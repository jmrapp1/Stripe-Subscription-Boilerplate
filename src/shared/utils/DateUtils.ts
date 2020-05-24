import * as moment from 'moment-timezone';

export const DATE_FORMAT_FULL_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
export const SERVER_TZ = moment.tz.guess();

export function nowUtcString(format = DATE_FORMAT_FULL_FORMAT) {
    return nowUtcMoment().format(format);
}

export function nowUtcMoment() {
    return moment(moment.utc().toDate());
}

export default {
    nowUtcString,
    nowUtcMoment,
    SERVER_TZ,
    DATE_FORMAT_FULL_FORMAT
};
