import * as DateUtils from '../../shared/utils/DateUtils';

class Logger {

    setup() {
        if (this.logS3Enabled()) {
            console.log('S3 Logging enabled.');
        } else {
            console.log('S3 Logging is disabled');
        }
        console.log('Logger finished setup');
    }

    info(msg) {
        if (this.logS3Enabled()) {
            console.log(`[INFO ${DateUtils.getNowUtcString()}] ${msg}`);
        }
    }

    warn(msg) {
        if (this.logS3Enabled()) {
            console.warn(`[WARN ${DateUtils.getNowUtcString()}] ${msg}`);
        }
    }

    critical(msg) {
        if (this.logS3Enabled()) {
            console.error(`[CRITICAL ${DateUtils.getNowUtcString()}] ${msg}`);
        }
    }

    private logS3Enabled() {
        return (process.env.LOGGER_ENABLED as any) === true || process.env.LOGGER_ENABLED === 'true';
    }

}

export default new Logger();
