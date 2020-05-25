import StripeProductResource from '../stripe/StripeProductResource';
import StripeBillingChargeResource from '../stripe/StripeBillingChargeResource';
import StripeProductPlanResource from '../stripe/StripeProductPlanResource';
import ExampleProductPlanResource from './ExampleProductPlanResource';

export default class ExampleProductResource extends StripeProductResource {

    name: string;
    description: string;

    initExampleProduct(name: string, description: string, stripeProductId: string, charges: StripeBillingChargeResource[], plans: ExampleProductPlanResource[]): this {
        super.init(stripeProductId, charges, plans);
        this.name = name;
        this.description = description;
        return this;
    }
}
