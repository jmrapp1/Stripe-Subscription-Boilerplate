import {Inject, Service} from 'typedi';
import DatabaseService from '../DatabaseService';
import StripeSubscription, { IStripeSubscriptionDocument } from '../../models/stripe/StripeSubscription';
import StripeService from './StripeService';
import { IStripeUserDocument } from '../../models/stripe/StripeUser';
import ServiceResponse from '../response/ServiceResponse';
import StripeBillingCycleService from './StripeBillingCycleService';
import StripeSubProduct, {
    IStripePlan,
    IStripeSubProductDocument
} from '../../models/stripe/StripeSubscriptionProduct';
import DateUtils from '../../../shared/utils/DateUtils';

@Service()
export default class StripeSubscriptionService extends DatabaseService<IStripeSubscriptionDocument> {

    model = StripeSubscription;

    @Inject(type => StripeService)
    stripeService: StripeService;

    @Inject(type => StripeBillingCycleService)
    billingCycleService: StripeBillingCycleService;

    async createSubscription(stripeUser: IStripeUserDocument, product: IStripeSubProductDocument<IStripePlan>, stripePlanId: string, interval) {
        if (!stripeUser.isConfigured) {
            throw new ServiceResponse(`Stripe user ${stripeUser._id} is not configured and trying to create sub.`, 500);
        }
        const subRes = await this.stripeService.createSubscription(stripeUser.stripeCustomerId, stripePlanId, interval, {});
        const billCycleRes = await this.billingCycleService.createBillingCycleForNow(subRes.data.id, null, null, product.charges, DateUtils.getNowUtcMoment());
        return new ServiceResponse();
    }

}
