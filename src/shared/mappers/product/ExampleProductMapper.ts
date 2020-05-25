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

}

export default new ExampleProductMapper();
