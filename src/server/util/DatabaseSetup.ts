import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';


export default class DatabaseSetup {

    db;

    setupDb(callback) {
        dotenv.config();
        this.connectToDb(callback, process.env.MONGODB_URI);
    }

    setupTestDb(callback) {
        dotenv.load();
        this.connectToDb(() => {
        }, process.env.MONGODB_TEST_URI);
    }

    connectToDb(callback, uri) {
        mongoose.connect(uri);
        const db = mongoose.connection;
        ( <any>mongoose ).Promise = global.Promise;

        db.on('error', console.error.bind(console, 'connection error:'));
        db.once('open', () => {
            this.db = db;
            console.log('Connected to MongoDB');
            callback(db);
        });
    }

    close(done) {
        mongoose.connection.close(() => {
            if (done) {
                done();
            }
        });
    }

    before(done) {
        this.setupDb(db => {
            done();
        });
    }

    after(done = null) {
        this.db.close().then(() => {
            this.close(done);
        });
    }
}
