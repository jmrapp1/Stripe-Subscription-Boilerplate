import * as mongoose from 'mongoose';
import {AppDocument} from './App';

const billingChargeSchema = new mongoose.Schema({
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

export const billingCycleSchema = new mongoose.Schema({
    app: {type: mongoose.Schema.Types.ObjectId, ref: 'App', index: true},
    charges: {type: [billingChargeSchema]},
    usage: {type: Number, default: 0},
    actualStartDate: {type: Date},
    cycleStartDate: {type: Date},
    cycleEndDate: {type: Date},
    status: { type: String, default: 'upcoming'},
    stripeInvoiceUrl: { type: String },
    stripeChargeData: { type: stripeChargeDataSchema, default: { chargeLogs: [] }}
});

export interface BillingCycleDocument extends mongoose.Document {
    _id: string;
    app: AppDocument;
    charges: {
        type: string,
        percentAddition: number,
        minValue: number,
        additionalCosts: number,
        usage: number
    }[];
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

const BillingCycle = mongoose.model<BillingCycleDocument>('BillingCycle', billingCycleSchema, 'BillingCycle');

export default BillingCycle;
