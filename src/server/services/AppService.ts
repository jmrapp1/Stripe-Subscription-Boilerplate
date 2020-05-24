import {Inject, Service} from 'typedi';
import ServiceResponse from './response/ServiceResponse';
import DatabaseService from './DatabaseService';
import App, {AppDocument} from '../models/App';
import CreateAppResource from '../../shared/resources/app/CreateAppResource';
import AppAccessService from './AppAccessService';
import UserService from './UserService';
import AccessRoles from '../models/AccessRoles';
import AppTiers from '../models/AppTiers';
import AddAppAccessResource from '../../shared/resources/appAccess/AddAppAccessResource';
import AwsService from './AwsService';
import Logger from '../util/Logger';
import AppSearchResource from '../../shared/resources/app/AppSearchResource';
import AppResource from '../../shared/resources/app/AppResource';
import AppMapper from '../../shared/mappers/app/AppMapper';
import BillingCycleService from './BillingCycleService';

@Service()
export default class AppService extends DatabaseService<AppDocument> {

    model = App;

    @Inject(type => AppAccessService)
    appAccessService: AppAccessService;

    @Inject(type => UserService)
    userService: UserService;

    @Inject(type => AwsService)
    awsService: AwsService;

    @Inject(type => BillingCycleService)
    billingCycleService: BillingCycleService;

    createApp(reqUserId: string, createAppResource: CreateAppResource) {
        return this.promise((resolve, reject) => {

            createAppResource.hostUrl = this.cleanUrl(createAppResource.hostUrl);
            createAppResource.emailDomainUrl = this.cleanUrl(createAppResource.emailDomainUrl);

            this.userService.findOne({_id: reqUserId}).then(userRes => {
                this.findWithLimit({
                    name: createAppResource.name,
                    owner: reqUserId,
                    isDeleted: false
                }, 1).then(async findRes => {
                    if (findRes.data.length > 0) return reject(new ServiceResponse('An app with this name already exists.', 400));

                    createAppResource.envVars.push({key: 'FROM_EMAIL', value: createAppResource.emailDomainUrl});
                    createAppResource.envVars.push({key: 'NODE_ENV', value: 'production'});
                    createAppResource.envVars.push({key: 'NPM_CONFIG_PRODUCTION', value: 'true'});
                    createAppResource.envVars.push({key: 'LOG_S3', value: 'true'});
                    createAppResource.envVars.push({
                        key: 'HOST_BASE_URL',
                        value: `https://www.${createAppResource.hostUrl}`
                    });
                    createAppResource.envVars.push({
                        key: 'SEND_EMAIL_LAMBDA',
                        value: 'contact-service-SendEmail'
                    });

                    this.insert({
                        name: createAppResource.name,
                        repoSource: 'Github',
                        repoName: createAppResource.repoName,
                        repoBranch: createAppResource.repoBranch,
                        repoAuthToken: createAppResource.repoAuthToken,
                        hostUrl: createAppResource.hostUrl,
                        emailDomainUrl: createAppResource.emailDomainUrl,
                        owner: reqUserId,
                        envVars: createAppResource.envVars,
                        tier: AppTiers.BASIC,
                        isDeleted: false,
                        createdBy: reqUserId,
                        updatedBy: reqUserId
                    }).then((appRes) => {
                        appRes.data.envVars.push({
                            key: 'S3_BUCKET',
                            value: `${process.env.AWS_ACCOUNT_ID}-tenant-${appRes.data._id}-bucket`
                        });
                        appRes.data.envVars.push({
                            key: 'SERVICE_ID',
                            value: appRes.data._id.toString()
                        });
                        this.save(appRes.data).then(() => {
                            this.appAccessService.addAppAccess(reqUserId, new AddAppAccessResource().init(appRes.data._id.toString(), reqUserId, AccessRoles.OWNER)).then(roleRes => {
                                return resolve(appRes);
                                // this.awsService.createNewAppStack(reqUserId, appRes.data)
                                //     .then(async () => {
                                //         try {
                                //             // await this.billingCycleService(appRes.data._id.toString(), 'hosting', 5, 1.2);
                                //         } catch (e) {
                                //             Logger.critical(`Could not create billing cycle for ${appRes.data._id}: ` + JSON.stringify(e));
                                //         }
                                //         resolve(appRes);
                                //     })
                                //     .catch((e) => {
                                //         this.deleteById(appRes.data._id).then(() => reject(e)).catch(() => reject(e));
                                //     });
                            }).catch((e) => {
                                this.deleteById(appRes.data._id).then(() => reject(e)).catch(() => reject(e));
                            });
                        }).catch(reject);
                    }).catch(reject);
                }).catch(reject);
            }).catch((e) => this.handleCaught(e, reject, new ServiceResponse('No user found with that ID.', 400)));
        });
    }

    deleteApp(reqUserId: string, appId: string) {
        return this.promise((resolve, reject) => {
            this.userService.findOne({_id: reqUserId}).then(() => {
                this.findOne({_id: appId, isDeleted: false}).then(async findRes => {
                    this.appAccessService.doesUserHaveAppAccessRole(appId, reqUserId, AccessRoles.OWNER).then(() => {
                        Logger.info(`Request from ${reqUserId} to delete app ${appId} in progress.`);
                        this.awsService.deleteAppStack(reqUserId, findRes.data).then(() => {
                            this.appAccessService.deleteByUserAndApp(appId, reqUserId).then(() => {
                                const app = findRes.data;
                                app.isDeleted = true;
                                this.save(app).then(resolve).catch(reject);
                                // this.deleteById(appId).then(resolve).catch(reject);
                            }).catch(reject);
                        }).catch(reject);
                    }).catch((e) => this.handleCaught(e, reject, new ServiceResponse('You do not have permission to delete this app.', 400)))
                }).catch((e) => this.handleCaught(e, reject, new ServiceResponse('No app found with that ID.', 400)));
            }).catch((e) => this.handleCaught(e, reject, new ServiceResponse('No user found with that ID.', 400)));
        });
    }

    getApp(appId: string) {
        return this.findById(appId);
    }

    findAppByCustomerId(customerId: string, populate = []) {
        return this.findOne({ stripeCustomerId: customerId }, populate);
    }

    private cleanUrl(url) {
        return url
            .replace('http://www.', '')
            .replace('https://www.', '')
            .replace('http://', '')
            .replace('https://', '');
    }

    private mapDocumentsToServiceResources(documents: AppDocument[]): AppResource[] {
        return documents.map(AppMapper.build);
    }

}
