import * as mongoose from 'mongoose';
import {UserDocument} from '../User';
import MongooseUtils from '../../util/MongooseUtils';
import StripeSubscription, { IStripeSubscriptionDocument } from './StripeSubscription';

const stripeUserSchema = new mongoose.Schema({
    stripeCustomerId: { type: String },
    subscriptions: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'StripeSubscription'
    }],
    isConfigured: { type: Boolean, default: false },
    isDeleted: { type: Boolean },
    createdOn: { type: Date },
    updatedOn: { type: Date }
});

export interface IStripeUserDocument extends mongoose.Document {
    _id: string;
    stripeCustomerId: string;
    subscriptions: IStripeSubscriptionDocument[];
    isConfigured: boolean;
    isDeleted: boolean;
    createdOn: Date;
    updatedOn: Date;
}

MongooseUtils.attachAuditMiddleware(stripeUserSchema);
const StripeUser = mongoose.model<IStripeUserDocument>('StripeUser', stripeUserSchema, 'StripeUser');

export default StripeUser;
