import Resource from '../Resource';
import StripeBillingChargeResource from './StripeBillingChargeResource';
import StripeProductPlanResource from './StripeProductPlanResource';

export default class StripeProductResource extends Resource {

    stripeProductId = '';
    charges: StripeBillingChargeResource[] = [];
    plans: StripeProductPlanResource[] = [];

    init(stripeProductId: string, charges: StripeBillingChargeResource[], plans: StripeProductPlanResource[]) {
        this.stripeProductId = stripeProductId;
        this.charges = charges;
        this.plans = plans;
        return this;
    }
}
