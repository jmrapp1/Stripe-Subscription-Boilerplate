import * as mongoose from 'mongoose';
import {AppDocument, appSchema} from './App';
import {UserDocument} from './User';
import MongooseUtils from '../util/MongooseUtils';

export const appAccessSchema = new mongoose.Schema({
    app: {type: mongoose.Schema.Types.ObjectId, ref: 'App'},
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    roles: { type: [String] },
    createdOn: { type: Date },
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    updatedOn: { type: Date },
    updatedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

export interface AppAccessDocument extends mongoose.Document {
    _id: string;
    app: AppDocument;
    user: UserDocument;
    roles: string[];
    createdOn: Date;
    createdBy: UserDocument;
    updatedOn: Date;
    updatedBy: UserDocument;
}

MongooseUtils.attachAuditMiddleware(appAccessSchema);
const AppAccess = mongoose.model<AppAccessDocument>('AppAccess', appAccessSchema, 'AppAccess');

export default AppAccess;
