import StripeProductPlanResource from '../../../shared/resources/stripe/StripeProductPlanResource';
import { IStripePlan } from '../../models/stripe/StripeSubscriptionProduct';

export function mapPlanResourceToEntity(resource: StripeProductPlanResource): IStripePlan {
    return {
        stripePlanId: resource.stripePlanId,
        // interval: resource.interval,
        // price: resource.price,
        // aggregationMode: resource.aggregationMode,
        // usageType: resource.usageType
    };
}

export function mapPlanEntityToResource(entity: IStripePlan): StripeProductPlanResource {
    return new StripeProductPlanResource().init(
        entity.stripePlanId,
        // entity.interval,
        // entity.price,
        // entity.aggregationMode,
        // entity.usageType
    );
}

export default {
    mapPlanResourceToEntity,
    mapPlanEntityToResource
}