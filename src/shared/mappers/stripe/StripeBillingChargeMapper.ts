import ResourceMapper from '../ResourceMapper';
import StripeBillingChargeResource from '../../resources/stripe/StripeBillingChargeResource';

class StripeBillingChargeMapper extends ResourceMapper {

    id = 'StripeBillingChargeMapper';
    resourceType = StripeBillingChargeResource;

    build(data): StripeBillingChargeResource {
        return new StripeBillingChargeResource().init(data.type, data.percentAddition, data.minValue, data.additionalCosts, data.usage);
    }

}

export default new StripeBillingChargeMapper();
