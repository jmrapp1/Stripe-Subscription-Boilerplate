import * as mongoose from 'mongoose';
import MongooseUtils from '../../util/MongooseUtils';

export const stripeSubscriptionSchema = new mongoose.Schema({
    stripeProductId: { type: String },
    stripePlanId: { type: String },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: {type: String },
    stripeSubscriptionItemId: {type: String },
    isDeleted: { type: Boolean },
    createdOn: { type: Date },
    updatedOn: { type: Date }
});

export interface IStripeSubscriptionDocument extends mongoose.Document {
    _id: string;
    stripeProductId: string;
    stripePlanId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripeSubscriptionItemId: string;
    isDeleted: boolean;
    createdOn: Date;
    updatedOn: Date;
}

export const StripeSubscriptionInterval = {
    DAILY: 'day',
    WEEKYL: 'week',
    MONTHLY: 'month',
    YEARLY: 'year'
};

MongooseUtils.attachAuditMiddleware(stripeSubscriptionSchema);
const StripeSubscription = mongoose.model<IStripeSubscriptionDocument>('StripeSubscription', stripeSubscriptionSchema, 'StripeSubscription');

export default StripeSubscription;
