import { Inject, Service } from 'typedi';
import DatabaseService from '../DatabaseService';
import DateUtils from '../../../shared/utils/DateUtils';
import StripeBillingCycle, { IStripeBillingCycleCharge, IStripeBillingCycleDocument } from '../../models/stripe/StripeBillingCycle';
import ServiceResponse from '../response/ServiceResponse';
import StripeUserService from './StripeUserService';
import Logger from '../../util/Logger';
import StripeSubscriptionService from './StripeSubscriptionService';
import HelperUtils from '../../../shared/utils/HelperUtils';
import StripeBillingChargeResource from '../../../shared/resources/stripe/StripeBillingChargeResource';
import MetricResource from '../../../shared/resources/stripe/metrics/MetricResource';

@Service()
export default class StripeBillingCycleService extends DatabaseService<IStripeBillingCycleDocument> {

    model = StripeBillingCycle;

    @Inject(type => StripeSubscriptionService)
    subService: StripeSubscriptionService;

    async createBillingCycleForNow(subId: string, startDate, endDate, charges: IStripeBillingCycleCharge[], actualStartDate?) {
        await this.subService.findById(subId);
        try {
            return await this.getCurrentBillingCycle(subId);
        } catch (e) {
            if (e instanceof ServiceResponse && (e as ServiceResponse<any>).errorCode === 400) {
                return this.insert({
                    subscription: subId,
                    charges,
                    actualStartDate: actualStartDate || startDate,
                    cycleStartDate: startDate,
                    cycleEndDate: endDate,
                });
            } else {
                Logger.critical(`Problem adding billing cycle for sub ${subId}: ${HelperUtils.getExceptionAsString(e)}`);
                throw e;
            }
        }
    }

    async getCurrentBillingCharges(subId: string, onDate?) {
        const sub = await this.subService.findById(subId);
        const cycleRes = await this.getBillingCycleDuringDate(subId, onDate || DateUtils.getNowUtcMoment());
        const cycle = cycleRes.data;
        const charges: [{ type, cost }] = ([] as any);

        const startMoment = DateUtils.getUtcMomentFromDateObject(cycle.cycleStartDate);
        const endMoment = DateUtils.getUtcMomentFromDateObject(cycle.cycleEndDate);
        // TODO: Support multiple subscription intervals
        const progression = this.getProgression(startMoment, endMoment, 'month');

        for (const b of cycle.charges) {
            charges.push({ type: b.type, cost: b.usage });
        }
        return new ServiceResponse(/*new StripeBillingChargeResource().init(charges)*/);
    }

    async getPastSixBillingCycle(subId: string) {
        // TODO: Support multiple subscription intervals
        const startDate = DateUtils.getNowUtcMoment().startOf('month').subtract(6, 'months');
        const endDate = DateUtils.getNowUtcMoment().startOf('month');

        const historyRes = await this.getBillingCycleHistory(subId, startDate, endDate);

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
            timeStamps.push(nextDate.format(DateUtils.DATE_FORMAT_FULL_FORMAT));
            charges.push(cost);
            nextDate.endOf('month').add(1, 'day').startOf('month');
        }
        return new ServiceResponse(new MetricResource().init('Historical Charges', timeStamps, charges));
    }

    getBillingCycleHistory(subId: string, startDate, endDate) {
        return this.find({
            $and: [
                { subscription: subId },
                {
                    $or: [
                        {
                            $and: [
                                { cycleStartDate: { '$lte': startDate } },
                                { cycleEndDate: { '$gte': endDate } }
                            ]
                        },
                        { cycleStartDate: { '$gte': startDate, '$lt': endDate } },
                        { cycleEndDate: { '$gt': startDate, '$lte': endDate } }
                    ]
                }
            ]
        });
    }

    getCurrentBillingCycle(subId: string) {
        return this.getBillingCycleDuringDate(subId, DateUtils.getNowUtcMoment());
    }

    getRecentBillingCycleForApp(subId: string) {
        return this.findWithLimit({
            subscription: subId
        }, 1, 0, this.populate, { 'created_at': -1 });
    }

    getBillingCycleDuringDate(subId: string, date) {
        return this.findOne({
            subscription: subId,
            cycleStartDate: { '$lte': date },
            cycleEndDate: { '$gt': date }
        });
    }

    private getProgression(billingStart, billingEnd, interval: 'day' | 'week' | 'month' | 'year') {
        let difType = 'days';
        let endOfType = 'day';
        if (interval === 'day') {
            difType = 'minutes';
            endOfType = 'day';
        }

        const now = DateUtils.getNowUtcMoment().endOf(endOfType as any);
        const day = now.diff(billingStart, difType as any);
        const monthStart = billingEnd.clone().startOf(interval);
        const dif = billingEnd.diff(monthStart, difType as any) + 1;
        return day / dif;
    }

}
