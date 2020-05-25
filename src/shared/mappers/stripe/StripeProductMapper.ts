import ResourceMapper from '../ResourceMapper';
import StripeProductPlanResource from '../../resources/stripe/StripeProductPlanResource';
import StripeProductResource from '../../resources/stripe/StripeProductResource';
import StripeBillingChargeMapper from './StripeBillingChargeMapper';
import StripeProductPlanMapper from './StripeProductPlanMapper';

class StripeProductMapper extends ResourceMapper {

    id = 'StripeProductMapper';
    resourceType = StripeProductResource;

    build(data): StripeProductResource {
        return new StripeProductResource().init(data.stripeProductId, data.charges.map(StripeBillingChargeMapper.build), data.plans.map(StripeProductPlanMapper.build));
    }

}

export default new StripeProductMapper();
