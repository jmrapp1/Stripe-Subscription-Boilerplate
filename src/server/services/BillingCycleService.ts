import {Inject, Service} from 'typedi';
import * as moment from 'moment-timezone'
import DatabaseService from './DatabaseService';
import DateUtils, {DATE_FULL_TIME_FORMAT} from '../../shared/utils/DateUtils';
import BillingCycle, {BillingCycleDocument} from '../models/BillingCycle';
import ServiceResponse from './response/ServiceResponse';
import AppService from './AppService';
import AddBillingCycleResource from '../../shared/resources/billing/AddBillingCycleResource';
import MetricResource from '../../shared/resources/metric/MetricResource';
import NumberUtils from '../../shared/utils/NumberUtils';
import BillingChargesResource from '../../shared/resources/billing/BillingChargesResource';
import AwsService from './AwsService';
import Logger from '../util/Logger';

const EMAIL_COST = 0.0002;

@Service()
export default class BillingCycleService extends DatabaseService<BillingCycleDocument> {

    model = BillingCycle;

    @Inject(type => AppService)
    appService: AppService;

    @Inject(type => AwsService)
    awsService: AwsService;

    addBillingCycle(resource: AddBillingCycleResource, actualStartDate?) {
        return this.promise((resolve, reject) => {
            this.appService.findById(resource.appId).then(() => {
                this.insert({
                    app: resource.appId,
                    charges: resource.charges,
                    actualStartDate: actualStartDate || resource.startDate,
                    cycleStartDate: resource.startDate,
                    cycleEndDate: resource.endDate,
                }).then(res => resolve(new ServiceResponse())).catch(reject);
            }).catch(reject);
        });
    }

    getCurrentBillingCharges(reqUserId: string, appId: string, onDate?) {
        return this.promise((resolve, reject) => {
            this.getBillingCycleDuringDate(appId, onDate || DateUtils.getUtcMomentNow()).then(async cycleRes => {
                const cycle = cycleRes.data;
                const charges: [{ type, cost}] = ([] as any);

                const startMoment = DateUtils.getUtcMomentFromDateObject(cycle.cycleStartDate);
                const endMoment = DateUtils.getUtcMomentFromDateObject(cycle.cycleEndDate);
                const progression = this.getMonthProgession(startMoment, startMoment.clone().endOf('month'));

                for (const b of cycle.charges) {
                    charges.push({type: b.type, cost: b.usage});
                    /*if (b.type.toLowerCase() === 'hosting') {
                        let cost = (await this.awsService.getHostingCosts(appId, startMoment.format(DateUtils.DATE_YEAR_MONTH_DAY_FORMAT), endMoment.format(DateUtils.DATE_YEAR_MONTH_DAY_FORMAT))).data;
                        Logger.info(`Found cost of ${cost} from AWS for hosting ${appId}`);
                        if (cost < b.minValue) {
                            cost = b.minValue * progression;
                        } else {
                            cost += b.additionalCosts;
                            cost *= b.percentAddition;
                        }
                        charges.push({ type: b.type, cost: NumberUtils.round(cost, 2) });
                    } else if (b.type.toLowerCase() === 'database') {
                        charges.push({ type: b.type, cost: NumberUtils.round(b.minValue * progression, 2)});
                    } else if (b.type.toLowerCase() === 'emails') {
                        const newStartDate = startMoment.clone().startOf('day').format(DATE_FULL_TIME_FORMAT);
                        const newEndDate = endMoment.clone().endOf('day').format(DATE_FULL_TIME_FORMAT);
                        const emailsRes = (await this.awsService.getEmailMetrics(reqUserId, appId, newStartDate, newEndDate, 86400)).data;
                        let emails = 0;
                        emailsRes.values.forEach(c => emails += c);
                        let cost = emails * EMAIL_COST;
                        if (cost < b.minValue) {
                            cost = b.minValue * progression;
                        } else {
                            cost = (cost + b.additionalCosts) * b.percentAddition;
                        }
                        charges.push({ type: b.type, cost: NumberUtils.round(cost, 2) });
                    } else if (b.type.toLowerCase() === 'texting') {
                        charges.push({ type: b.type, cost: NumberUtils.round(b.minValue * progression, 2) });
                    }*/
                }
                return resolve(new ServiceResponse(new BillingChargesResource().init(charges)));
            }).catch(reject);
        });
    }

    getPastSixBillingCycle(reqUserId: string, appId: string) {
        return this.promise((resolve, reject) => {
            const startDate = DateUtils.getUtcMomentNow().startOf('month').subtract(6, 'months');
            const endDate = DateUtils.getUtcMomentNow().startOf('month');
            this.getBillingCycleHistory(reqUserId, appId, startDate, endDate).then(historyRes => {
                const nextDate = startDate.clone();
                const timeStamps = [];
                const charges = [];
                while (nextDate.isBefore(endDate)) {
                    const nextEnd = nextDate.clone().endOf('month');
                    const found = historyRes.data.filter(h => DateUtils.isDateWithinRange(DateUtils.getUtcMomentFromDateObject(h.cycleEndDate), nextDate, nextEnd, true));
                    let cost = 0;
                    if (found.length === 1) {
                        cost = found[0].usage;
                    }
                    timeStamps.push(nextDate.format(DateUtils.DATE_YEAR_MONTH_FORMAT));
                    charges.push(cost);
                    nextDate.endOf('month').add(1, 'day').startOf('month');
                }
                return resolve(new ServiceResponse(new MetricResource().init('Historical Charges', timeStamps, charges)));
            }).catch(reject);
        });
    }

    getBillingCycleHistory(reqUserId: string, appId: string, startDate, endDate) {
        return this.find({
            $and: [
                {app: appId},
                {
                    $or: [
                        {
                            $and: [
                                {cycleStartDate: {'$lte': startDate}},
                                {cycleEndDate: {'$gte': endDate}}
                            ]
                        },
                        {cycleStartDate: {'$gte': startDate, '$lt': endDate}},
                        {cycleEndDate: {'$gt': startDate, '$lte': endDate}}
                    ]
                }
            ]
        });
    }

    getRecentBillingCycleForApp(appId: string) {
        return this.findWithLimit({
            app: appId.toString()
        }, 1, 0, this.populate, { 'created_at' : -1 });
    }

    getBillingCycleDuringDate(appId: string, date) {
        return this.findOne({
            app: appId,
            cycleStartDate: {'$lte': date},
            cycleEndDate: {'$gt': date}
        });
    }

    private getMonthProgession(billingStart, monthEnd) {
        const now = DateUtils.getUtcMomentNow().endOf('day');
        const day = now.diff(billingStart, 'days');
        const monthStart = monthEnd.clone().startOf('month');
        const dif = monthEnd.diff(monthStart, 'days') + 1;
        return day / dif;
    }

}
