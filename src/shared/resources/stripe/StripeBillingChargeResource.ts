import Resource from '../Resource';

export default class StripeBillingChargeResource extends Resource {

    type = '';
    percentAddition = 0;
    minValue = 0;
    additionalCosts = 0;
    usage = 0;

    init(type: string, percentAddition: number, minValue: number, additionalCosts: number, usage: number) {
        this.type = type;
        this.percentAddition = percentAddition;
        this.minValue = minValue;
        this.additionalCosts = additionalCosts;
        this.usage = usage;
        return this;
    }
}
