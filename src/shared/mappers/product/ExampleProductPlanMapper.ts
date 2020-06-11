import ResourceMapper from '../ResourceMapper';
import ExampleProductPlanResource from '../../resources/product/ExampleProductPlanResource';

class ExampleProductPlanMapper extends ResourceMapper {

    id = 'ExampleProductPlanMapper';
    resourceType = ExampleProductPlanResource;

    build(data): ExampleProductPlanResource {
        return new ExampleProductPlanResource().initExampleProduct(data.name, data.stripePlanId/*, data.interval, data.price, data.aggregationMode, data.usageType*/);
    }

}

export default new ExampleProductPlanMapper();
