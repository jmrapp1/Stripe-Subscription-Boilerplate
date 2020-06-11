import * as mongoose from 'mongoose';
import { StripeBillingChargeSchema, IStripeBillingCycleCharge } from './StripeBillingCycle';
import { SchemaDefinition } from 'mongoose';

const StripePlanSchema = new mongoose.Schema({
    stripePlanId: String,
    interval: String,
    price: Number,
    aggregationMode: String,
    usageType: String
});

const StripeSubProductSchema = new mongoose.Schema({
    stripeProductId: { type: String },
    charges: { type: [StripeBillingChargeSchema] }
    // Plans definition is added in function below
});

export const SubscriptionInterval = {
    DAILY: 'day',
    WEEKYL: 'week',
    MONTHLY: 'month',
    YEARLY: 'year'
};

export interface IStripeSubProductDocument<P extends IStripePlan> extends mongoose.Document {
    _id: string;
    stripeProductId: string;
    charges: IStripeBillingCycleCharge[];
    plans: P[];
}

export interface IStripePlan {
    stripePlanId: string;
}

export function createSubscriptionProductSchema(schema: SchemaDefinition, plansSchema?: SchemaDefinition) {
    if (!plansSchema) plansSchema = StripePlanSchema.clone();
    const newSubProductSchema = StripeSubProductSchema.clone();
    newSubProductSchema.add(schema); // add given def
    newSubProductSchema.add({ // add plans def based off given schema
        plans: { type: [plansSchema] }
    })
    return newSubProductSchema;
}

export function createProductPlanSchema(schema: SchemaDefinition) {
    const newPlanSchema = StripePlanSchema.clone();
    newPlanSchema.add(schema);
    return newPlanSchema;
}

export default {
    createSubscriptionProductSchema,
    createProductPlanSchema
}
