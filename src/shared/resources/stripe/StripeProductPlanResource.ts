import Resource from '../Resource';

export default class StripeProductPlanResource extends Resource {

    stripePlanId = '';

    init(stripePlanId: string) {
        this.stripePlanId = stripePlanId;
        return this;
    }
}
