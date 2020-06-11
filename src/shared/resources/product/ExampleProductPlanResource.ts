import Resource from '../Resource';
import StripeProductPlanResource from '../stripe/StripeProductPlanResource';

export default class ExampleProductPlanResource extends StripeProductPlanResource {

    name = '';

    initExampleProduct(name: string, stripePlanId: string): this {
        super.init(stripePlanId);
        this.name = name;
        return this;
    }
}
