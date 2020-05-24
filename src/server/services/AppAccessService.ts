import {Inject, Service} from 'typedi';
import ServiceResponse from './response/ServiceResponse';
import DatabaseService from './DatabaseService';
import AddAppAccessResource from '../../shared/resources/appAccess/AddAppAccessResource';
import AppService from './AppService';
import UserService from './UserService';
import AccessRoles from '../models/AccessRoles';
import AppAccess, {AppAccessDocument} from '../models/AppAccess';
import AddAppAccessMapper from '../../shared/mappers/appAccess/AddAppAccessMapper';
import AppAccessResource from '../../shared/resources/appAccess/AppAccessResource';
import AppAccessMapper from '../../shared/mappers/appAccess/AppAccessMapper';
import AppAccessSearchResource from '../../shared/resources/appAccess/AppAccessSearchResource';
import {isUndefined} from 'util';

@Service()
export default class AppAccessService extends DatabaseService<AppAccessDocument> {

    model = AppAccess;

    @Inject(type => AppService)
    appService: AppService;

    @Inject(type => UserService)
    userService: UserService;

    addAppAccess(reqUserId: string, addAppAccessResource: AddAppAccessResource) {
        return this.promise((resolve, reject) => {
            if (!addAppAccessResource.validated) {
                const error = AddAppAccessMapper.verifyAllConstraints(addAppAccessResource);
                if (error) return reject(new ServiceResponse(error));
            }
            this.appService.findOne({ _id: addAppAccessResource.appId }).then(appRes => {
                this.userService.findOne({ _id: addAppAccessResource.userId }).then(userRes => {
                    if (!this.isAccessRoleValid(addAppAccessResource.role)) return reject(new ServiceResponse('That access role is not valid.', 400));
                    addAppAccessResource.role = addAppAccessResource.role.toUpperCase();
                    this.findWithLimit({ app: addAppAccessResource.appId, user: addAppAccessResource.userId }, 1).then(existRes => {
                        if (existRes.data.length === 1) {
                            const existing = existRes.data[0];
                            existing.roles.push(addAppAccessResource.role);
                            existing.roles = [...new Set(existing.roles)]; // remove duplicates
                            return this.save(existing).then(resolve).catch(reject);
                        } else {
                            return this.insert({
                                app: addAppAccessResource.appId,
                                user: addAppAccessResource.userId,
                                roles: [ addAppAccessResource.role ]
                            }).then(resolve).catch(reject);
                        }
                    });
                }).catch(e => this.handleCaught(e, reject, new ServiceResponse('No user found with that ID.', 400)));
            }).catch(e => this.handleCaught(e, reject, new ServiceResponse('No app found with that ID.', 400)));
        });
    }

    getApps(userId: string, size: number, offset: number) {
        return this.promise((resolve, reject) => {
            this.page({ user: userId }, size, offset, ['app']).then(findRes => {
                const data = findRes.data
                    .filter(a => a.app && !isUndefined(a.app) && a.app != null)
                    .filter(a => !a.app.isDeleted);
                return resolve(new ServiceResponse(new AppAccessSearchResource().init(findRes.total, findRes.offset, findRes.size, this.mapDocumentsToServiceResources(data))));
            }).catch(reject);
        });
    }

    getAppAccessApp(userId: string, appAccessId: string) {
        return this.promise((resolve, reject) => {
            this.findOne({ user: userId, _id: appAccessId }, ['app']).then(findRes => {
                return resolve(new ServiceResponse(this.mapDocumentsToServiceResource(findRes.data)));
            }).catch(reject);
        });
    }

    deleteByUserAndApp(appId: string, userId: string) {
        return this.promise((resolve, reject) => {
            this.findOne({app: appId, user: userId}).then(accessRes => {
                this.deleteById(accessRes.data._id).then(resolve).catch(reject);
            }).catch(e => this.handleCaught(e, reject, new ServiceResponse('No app registered with that user.', 400)));
        });
    }

    doesUserHaveAppAccessRole(appId: string, userId: string, accessRole: string) {
        return this.promise((resolve, reject) => {
            this.findOne({app: appId, user: userId}).then(accessRes => {
                accessRes.data.roles.forEach(role => {
                    if (accessRole.toUpperCase() === role.toUpperCase()) return resolve(new ServiceResponse());
                })
            }).catch(e => this.handleCaught(e, reject, new ServiceResponse('No app registered with that user.', 400)));
        });
    }

    isAccessRoleValid(accessRole: string) {
        const roles = Object.keys(AccessRoles);
        for (const role of roles) {
            if (role.toUpperCase() === accessRole.toUpperCase()) return true;
        }
        return false;
    }

    private mapDocumentsToServiceResources(documents: AppAccessDocument[]): AppAccessResource[] {
        return documents.map(AppAccessMapper.build);
    }

    private mapDocumentsToServiceResource(document: AppAccessDocument): AppAccessResource {
        return AppAccessMapper.build(document);
    }

}
