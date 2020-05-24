import * as mongoose from 'mongoose';
import {UserDocument} from './User';
import MongooseUtils from '../util/MongooseUtils';
import SubscriptionTier from './SubscriptionTier';

export const subscriptionSchema = new mongoose.Schema({
    tier: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionTier'},
    stripeProductId: { type: String },
    stripePlanId: { type: String },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: {type: String },
    stripeSubscriptionItemId: {type: String },
    isDeleted: { type: Boolean },
    createdOn: { type: Date },
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    updatedOn: { type: Date },
    updatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

export interface SubscriptionDocument extends mongoose.Document {
    _id: string;
    tier: string;
    stripeProductId: string;
    stripePlanId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripeSubscriptionItemId: string;
    isDeleted: boolean;
    createdOn: Date;
    createdBy: UserDocument;
    updatedOn: Date;
    updatedBy: UserDocument;
}

MongooseUtils.attachAuditMiddleware(subscriptionSchema);
const Subscription = mongoose.model<SubscriptionDocument>('Subscription', subscriptionSchema, 'Subscription');

export default Subscription;
