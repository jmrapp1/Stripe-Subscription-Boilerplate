import * as mongoose from 'mongoose';
import DateUtils, { nowUtcString } from '../../shared/utils/DateUtils';

export function attachAuditMiddleware(schema: mongoose.Schema) {
    schema.pre('save', function(next) {
        if (this._doc) {
            const doc = this._doc;
            const now = DateUtils.nowUtcString();
            if (!doc.createdOn) {
                doc.createdOn = now;
            }
            doc.modifiedOn = now;
        }
        next();
        return this;
    });
}

export default {
    attachAuditMiddleware
};
