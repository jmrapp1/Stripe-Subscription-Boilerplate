import * as dotenv from 'dotenv';
import * as morgan from 'morgan';
import * as passport from 'passport';
import * as bodyParser from 'body-parser';
import 'reflect-metadata'; // required
import './mixins/underscore';
import registerPassport from './config/passport';

dotenv.config();

import { createExpressServer, useContainer } from 'routing-controllers';
import { Container } from 'typedi';

import DatabaseSetup from './util/DatabaseSetup';
import UserController from './controllers/UserController';
import Logger from './util/Logger';
import ProductController from './controllers/ProductController';

useContainer(Container);

const express = require('express');

const app = createExpressServer({
    cors: true,
    routePrefix: '/api',
    controllers: [ UserController, ProductController ]
});

if (process.env.NODE_ENV === 'production') {
    console.log('Using production build');
    app.use(express.static('dist/client'));
}

app.set('port', (process.env.PORT || 3000));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(morgan('dev'));

app.use(function (err, req, res, next) {
    next(err);
});

Logger.setup();

new DatabaseSetup().setupDb(() => {

    registerPassport(passport);

    app.listen(app.get('port'), () => {
        console.log('Listening on port ' + app.get('port'));
    });
});

export { app };
