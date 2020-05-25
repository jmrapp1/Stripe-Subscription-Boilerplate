import StripeBillingChargeResource from '../../../shared/resources/stripe/StripeBillingChargeResource';
import { IStripeBillingCycleCharge } from '../../models/stripe/StripeBillingCycle';

export function mapChargeResourceToEntity(resource: StripeBillingChargeResource): IStripeBillingCycleCharge {
    return {
        type: resource.type,
        percentAddition: resource.percentAddition,
        minValue: resource.minValue,
        additionalCosts: resource.additionalCosts,
        usage: resource.usage
    };
}

export function mapChargeEntityToResource(entity: IStripeBillingCycleCharge): StripeBillingChargeResource {
    return new StripeBillingChargeResource().init(
        entity.type,
        entity.percentAddition,
        entity.minValue,
        entity.additionalCosts,
        entity.usage
    );
}

export default {
    mapChargeEntityToResource,
    mapChargeResourceToEntity
}