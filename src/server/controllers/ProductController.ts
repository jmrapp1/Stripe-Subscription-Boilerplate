import { JsonController, Post, Res, } from 'routing-controllers';
import { BuildResource } from '../decorators/BuildResource';
import { Inject } from 'typedi';
import BaseController from './BaseController';
import ProductExampleService from '../services/ProductExampleService';
import ExampleProductMapper from '../../shared/mappers/product/ExampleProductMapper';
import ExampleProductResource from '../../shared/resources/product/ExampleProductResource';
import * as StripeBillingCycle from '../models/stripe/StripeBillingCycle';
import * as ProductExample from '../models/ProductExample';
import StripeBillingCycleMappers from '../mappers/stripe/StripeBillingCycleMappers';
import ProductExampleMappers from '../mappers/ProductExampleMappers';
import HttpUtils from '../util/HttpUtils';

@JsonController('/products')
export default class ProductController extends BaseController {

    @Inject()
    productService: ProductExampleService;

    @Post('/register')
    register(@Res() response: any, @BuildResource(ExampleProductMapper) prodResource: ExampleProductResource) {
        if (!prodResource) return response;
        return this.productService.registerProduct(
            prodResource.name,
            prodResource.description,
            prodResource.stripeProductId,
            prodResource.charges.map(StripeBillingCycleMappers.mapChargeResourceToEntity),
            prodResource.plans.map(ProductExampleMappers.mapPlanResourceToEntity))
            .then(
                res => response.status(200).json(HttpUtils.mappedResourceToJson(res.data, ExampleProductMapper)),
                err => this.handleServiceError(response, err)
            );
    }

}
