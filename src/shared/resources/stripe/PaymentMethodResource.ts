import Resource from '../Resource';

export default class PaymentMethodResource extends Resource {

    brand = '';
    country = '';
    expireMonth = 0;
    expireYear = 0;
    last4 = '';

    init(brand: string, country: string, expireMonth: number, expireYear: number, last4: string) {
        this.brand = brand;
        this.country = country;
        this.expireMonth = expireMonth;
        this.expireYear = expireYear;
        this.last4 = last4;
        return this;
    }

}
