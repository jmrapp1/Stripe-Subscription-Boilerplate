import * as mongoose from 'mongoose';
import { IStripeSubscriptionDocument } from './StripeSubscription';
import StripeBillingChargeResource from '../../../shared/resources/stripe/StripeBillingChargeResource';

export const StripeBillingChargeSchema = new mongoose.Schema({
    type: String,
    percentAddition: { type: Number, default: 1 },
    minValue: Number,
    additionalCosts: { type: Number, default: 0 },
    usage: { type: Number, default: 0 }
});

const stripeChargeLogSchema = new mongoose.Schema({
    subTotal: { type: Number },
    total: { type: Number },
    statusDate: { type: Date },
    status: { type: String },
    createdOn: { type: Date },
    cycleStart: { type: Date },
    cycleEnd: { type: Date }
});

const stripeChargeDataSchema = new mongoose.Schema({
    chargeLogs: { type: [stripeChargeLogSchema] }
});

const billingCycleSchema = new mongoose.Schema({
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', index: true },
    charges: { type: [StripeBillingChargeSchema] },
    usage: { type: Number, default: 0 },
    actualStartDate: { type: Date },
    cycleStartDate: { type: Date },
    cycleEndDate: { type: Date },
    status: { type: String, default: 'upcoming' },
    stripeInvoiceUrl: { type: String },
    stripeChargeData: { type: stripeChargeDataSchema, default: { chargeLogs: [] } }
});

export interface IStripeBillingCycleDocument extends mongoose.Document {
    _id: string;
    subscription: IStripeSubscriptionDocument;
    charges: IStripeBillingCycleCharge[];
    usage: number;
    actualStartDate: Date;
    cycleStartDate: Date;
    cycleEndDate: Date;
    status: string;
    stripeInvoiceUrl: string;
    stripeChargeData: {
        chargeLogs: {
            subTotal: number;
            total: number;
            statusDate: Date;
            status: string;
            createdOn: Date,
            cycleStart: Date,
            cycleEnd: Date
        }[];
    }
}

export interface IStripeBillingCycleCharge {
    type: string,
    percentAddition: number,
    minValue: number,
    additionalCosts: number,
    usage: number
}

const StripeBillingCycle = mongoose.model<IStripeBillingCycleDocument>('StripeBillingCycle', billingCycleSchema, 'StripeBillingCycle');

export default StripeBillingCycle;
