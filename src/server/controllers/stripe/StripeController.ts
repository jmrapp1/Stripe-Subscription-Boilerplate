import {
    Body,
    BodyParam,
    Delete,
    Get,
    JsonController,
    Param,
    Post,
    QueryParam,
    Req,
    Res,
    UseBefore
} from 'routing-controllers';
import {Inject} from 'typedi';

const bodyParser = require('body-parser');
import BaseController from '../BaseController';
import StripeService from '../../services/stripe/StripeService';

@JsonController('/stripe')
export default class StripeController extends BaseController {

    @Inject(type => StripeService)
    stripeService: StripeService;

    @Post('/hook')
    @UseBefore(bodyParser.raw({type: 'application/json'}))
    stripeHook(@Req() req: any, @Res() response: any, @Body() body) {
        const stripeSig = req.headers['stripe-signature'];
        if (!stripeSig || !body) return response.sendStatus(401);
        /*return this.stripeService.handleStripeWebhook(body, stripeSig).then(
            res => response.sendStatus(200),
            err => this.handleServiceError(response, err)
        );*/
    }

}
