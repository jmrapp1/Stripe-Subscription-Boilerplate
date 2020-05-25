import Resource from '../Resource';
import StripeProductPlanResource from '../stripe/StripeProductPlanResource';

export default class ExampleProductPlanResource extends StripeProductPlanResource {

    name: string;

    initExampleProduct(name: string, stripePlanId: string, interval: "day" | "week" | "month" | "year", price: number, aggregationMode: string, usageType: string): this {
        super.init(stripePlanId, interval, price, aggregationMode, usageType);
        this.name = name;
        return this;
    }
}
