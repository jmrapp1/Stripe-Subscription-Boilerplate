import * as mongoose from 'mongoose';
import MongooseUtils from '../util/MongooseUtils';
import StripeSubscriptionProduct, { IStripePlan, IStripeSubProductDocument } from './stripe/StripeSubscriptionProduct';
import StripeProductPlanResource from '../../shared/resources/stripe/StripeProductPlanResource';
import ExampleProductPlanResource from '../../shared/resources/product/ExampleProductPlanResource';
import ExampleProductResource from '../../shared/resources/product/ExampleProductResource';

const planSchema = StripeSubscriptionProduct.createProductPlanSchema({
    name: String
});

const productExampleSchema = StripeSubscriptionProduct.createSubscriptionProductSchema({
    name: { type: String },
    description: { type: String },
    isDeleted: { type: Boolean, default: false },
    createdOn: { type: Date },
    updatedOn: { type: Date }
}, planSchema);

export interface IPlanExample extends IStripePlan {
    name: string;
}

export interface IProductExampleDocument extends IStripeSubProductDocument<IPlanExample> {
    name: string;
    description: string;
    isDeleted: boolean;
    createdOn: Date;
    updatedOn: Date;
}

MongooseUtils.attachAuditMiddleware(productExampleSchema);
const ProductExample = mongoose.model<IProductExampleDocument>('ProductExample', productExampleSchema, 'ProductExample');

export default ProductExample;
