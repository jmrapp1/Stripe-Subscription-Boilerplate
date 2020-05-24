import * as mongoose from 'mongoose';
import {UserDocument} from './User';
import MongooseUtils from '../util/MongooseUtils';

export const appSchema = new mongoose.Schema({
    name: { type: String },
    repoSource: { type: String, default: 'Github' },
    repoName: { type: String },
    repoBranch: { type: String },
    repoAuthToken: { type: String },
    hostUrl: { type: String },
    owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true},
    envVars: [{ key: String, value: String }],
    tier: { type: {} },
    awsStackId: { type: String },
    awsStackName: { type: String },
    awsRoleArn: { type: String },
    awsRoleName: { type: String },
    awsPolicyArn: { type: String },
    awsEcrRepo: { type: String },
    awsEcsTask: { type: String },
    awsServiceName: { type: String },
    awsClusterName: { type: String },
    awsBucketName: { type: String },
    awsTargetGroup: { type: String },
    emailDomainUrl: { type: String },
    stripeProductId: { type: String },
    stripePlanId: { type: String },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: {type: String },
    stripeSubscriptionItemId: {type: String },
    createdOn: { type: Date },
    isDeleted: { type: Boolean },
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    updatedOn: { type: Date },
    updatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

export interface AppDocument extends mongoose.Document {
    _id: string;
    name: string;
    repoSource: string;
    repoName: string;
    repoBranch: string;
    repoAuthToken: string;
    hostUrl: string;
    owner: UserDocument;
    awsStackId: string;
    awsStackName: string;
    awsRoleArn: string;
    awsRoleName: string;
    awsPolicyArn: string;
    awsEcrRepo: string;
    awsEcsTask: string;
    awsServiceName: string;
    awsClusterName: string;
    awsBucketName: string;
    awsTargetGroup: string;
    stripeProductId: string;
    stripePlanId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripeSubscriptionItemId: string;
    emailDomainUrl: string;
    envVars: { key: string, value: string }[];
    tier;
    isDeleted: boolean;
    createdOn: Date;
    createdBy: UserDocument;
    updatedOn: Date;
    updatedBy: UserDocument;
}

MongooseUtils.attachAuditMiddleware(appSchema);
const App = mongoose.model<AppDocument>('App', appSchema, 'App');

export default App;
