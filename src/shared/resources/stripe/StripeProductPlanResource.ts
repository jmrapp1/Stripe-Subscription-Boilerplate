import Resource from '../Resource';

export default class StripeProductPlanResource extends Resource {

    stripePlanId = '';
    interval: 'day' | 'week' | 'month' | 'year' = 'day';
    price = 0;
    aggregationMode = '';
    usageType = '';

    init(stripePlanId: string, interval: "day" | "week" | "month" | "year", price: number, aggregationMode: string, usageType: string) {
        this.stripePlanId = stripePlanId;
        this.interval = interval;
        this.price = price;
        this.aggregationMode = aggregationMode;
        this.usageType = usageType;
        return this;
    }
}
