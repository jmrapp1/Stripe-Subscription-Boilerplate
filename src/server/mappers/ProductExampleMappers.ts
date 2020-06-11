import ExampleProductPlanResource from '../../shared/resources/product/ExampleProductPlanResource';
import ExampleProductResource from '../../shared/resources/product/ExampleProductResource';
import { IPlanExample, IProductExampleDocument } from '../models/ProductExample';
import StripeBillingCycleMappers from './stripe/StripeBillingCycleMappers';

export function mapPlanResourceToEntity(resource: ExampleProductPlanResource): IPlanExample {
    return {
        name: resource.name,
        stripePlanId: resource.stripePlanId,
        // interval: resource.interval,
        // price: resource.price,
        // aggregationMode: resource.aggregationMode,
        // usageType: resource.usageType
    };
}

export function mapPlanEntityToResource(entity: IPlanExample): ExampleProductPlanResource {
    return new ExampleProductPlanResource().initExampleProduct(
        entity.name,
        entity.stripePlanId,
        // entity.interval,
        // entity.price,
        // entity.aggregationMode,
        // entity.usageType
    );
}

export function mapProductEntityToResource(entity: IProductExampleDocument): ExampleProductResource {
    return new ExampleProductResource().initExampleProduct(
        entity.name,
        entity.description,
        entity.stripeProductId,
        entity.charges.map(StripeBillingCycleMappers.mapChargeEntityToResource),
        entity.plans.map(mapPlanEntityToResource)
    )
}

export default {
    mapPlanResourceToEntity,
    mapPlanEntityToResource,
    mapProductEntityToResource
}