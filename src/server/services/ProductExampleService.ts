import { Inject, Service } from 'typedi';
import DatabaseService from './DatabaseService';
import UserService from './UserService';
import { IPlanExample, IProductExampleDocument } from '../models/ProductExample';
import ProductExample from '../models/ProductExample';
import StripeService from './stripe/StripeService';
import ServiceResponse from './response/ServiceResponse';
import { IStripeBillingCycleCharge } from '../models/stripe/StripeBillingCycle';
import { UserDocument } from '../models/User';

@Service()
export default class ProductExampleService extends DatabaseService<IProductExampleDocument> {

    model = ProductExample;

    @Inject(type => StripeService)
    stripeService: StripeService;

    async registerProduct(name: string, description: string, stripeProductId: string, charges: IStripeBillingCycleCharge[], plans: IPlanExample[]) {
        const existingProd = await this.findWithLimit({ stripeProductId }, 1);
        if (existingProd.data.length > 0) {
            throw new ServiceResponse('Product with that stripe product ID is already registered.', 400);
        }

        await this.stripeService.getProduct(stripeProductId);
        for (const plan of plans) {
            const stripePlan = (await this.stripeService.getProductPlan(plan.stripePlanId)).data;
            if (!stripePlan.active) {
                throw new ServiceResponse(`Plan '${plan.stripePlanId}' is not active and cannot be used.`);
            }
        }
        return await this.insert({
            name,
            description,
            stripeProductId,
            charges,
            plans
        });
    }

    async createSubscription(productId: string, planId: string, user: UserDocument) {

    }

}
