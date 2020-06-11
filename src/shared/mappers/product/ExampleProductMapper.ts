import ResourceMapper from '../ResourceMapper';
import ExampleProductPlanResource from '../../resources/product/ExampleProductPlanResource';
import ExampleProductResource from '../../resources/product/ExampleProductResource';
import StripeBillingChargeMapper from '../stripe/StripeBillingChargeMapper';
import StripeProductPlanMapper from '../stripe/StripeProductPlanMapper';
import ExampleProductPlanMapper from './ExampleProductPlanMapper';

class ExampleProductMapper extends ResourceMapper {

    id = 'ExampleProductMapper';
    resourceType = ExampleProductResource;

    build(data): ExampleProductResource {
        return new ExampleProductResource().initExampleProduct(data.name, data.description, data.stripeProductId, data.charges.map(StripeBillingChargeMapper.build), data.plans.map(ExampleProductPlanMapper.build));
    }

    verifyStrictConstraints(resource: ExampleProductResource) {
        for (let i = 0; i < resource.charges.length; i++) {
            const undefinedKey = StripeBillingChargeMapper.verifyPopulatedResource(resource.charges[i]);
            if (undefinedKey) return `Charge ${i + 1}: ${undefinedKey}`;
        }
        for (let i = 0; i < resource.plans.length; i++) {
            const undefinedKey = ExampleProductPlanMapper.verifyPopulatedResource(resource.plans[i]);
            if (undefinedKey) return `Plan ${i + 1}: ${undefinedKey}`;
        }
    }

}

export default new ExampleProductMapper();
