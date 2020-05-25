import * as moment from 'moment-timezone';

export const DATE_FORMAT_FULL_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
export const DATE_FORMAT_YEAR_MONTH = 'YYYY-MM';
export const SERVER_TZ = moment.tz.guess();

export function getNowUtcString(format = DATE_FORMAT_FULL_FORMAT) {
    return getNowUtcMoment().format(format);
}

export function getNowUtcMoment() {
    return moment(moment.utc().toDate());
}

export function getUtcMomentFromDateObject(date) {
    const format = date.toISOString();
    return getUtcMomentFromString(format);
}

export function getUtcMomentFromString(str, format = DATE_FORMAT_FULL_FORMAT) {
    return moment.utc(str, DATE_FORMAT_FULL_FORMAT);
}

export function isDateWithinRange(utcDateMoment, utcStartDate, utcEndDate, canEndBeSame = false) {
    return utcStartDate.isSameOrBefore(utcDateMoment) && (canEndBeSame ? utcEndDate.isSameOrAfter(utcDateMoment) : utcEndDate.isAfter(utcDateMoment));
}

export default {
    getNowUtcString,
    getNowUtcMoment,
    SERVER_TZ,
    DATE_FORMAT_FULL_FORMAT,
    getUtcMomentFromDateObject,
    getUtcMomentFromString,
    isDateWithinRange
};
