import Resource from '../Resource';

export default class BillingChargesResource extends Resource {

    charges: { type, cost }[];

    init(charges: {type, cost}[]) {
        this.charges = charges;
        return this;
    }

}
