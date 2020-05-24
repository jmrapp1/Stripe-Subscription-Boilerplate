import Resource from '../Resource';

export default class AddBillingCycleResource extends Resource {

    appId = '';
    charges = [{
        type: String,
        percentAddition: Number,
        minValue: Number,
        additionalCosts: Number
    }];
    startDate =  '';
    endDate = '';

    init(appId: string, charges, startDate, endDate) {
        this.appId = appId;
        this.charges = charges;
        this.startDate = startDate;
        this.endDate = endDate;
        return this;
    }

}
