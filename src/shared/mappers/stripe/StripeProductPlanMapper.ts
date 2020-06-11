import ResourceMapper from '../ResourceMapper';
import StripeProductPlanResource from '../../resources/stripe/StripeProductPlanResource';

class StripeProductPlanMapper extends ResourceMapper {

    id = 'StripeProductPlanMapper';
    resourceType = StripeProductPlanResource;

    build(data): StripeProductPlanResource {
        return new StripeProductPlanResource().init(data.stripePlanId/*, data.interval, data.price, data.aggregationMode, data.usageType*/);
    }

}

export default new StripeProductPlanMapper();
