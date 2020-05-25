import {
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
import BaseController from '../BaseController';
import AuthMiddleware from '../../middlewares/AuthMiddleware';
import HttpUtils from '../../util/HttpUtils';
import StripeService from '../../services/stripe/StripeService';
import StripeBillingCycleService from '../../services/stripe/StripeBillingCycleService';
import StripeUserService from '../../services/stripe/StripeUserService';

@JsonController('/billing')
export default class BillingController extends BaseController {

    @Inject(type => StripeService)
    stripeService: StripeService;

    @Inject(type => StripeUserService)
    appService: StripeUserService;

    @Inject(type => StripeBillingCycleService)
    billingCycleService: StripeBillingCycleService;

    /*@Post('/cycle')
    @UseBefore(AuthMiddleware)
    addBillingHistory(@Req() req: any, @Res() response: any, @BuildResource(AddBillingCycleMapper) addResource: AddBillingCycleResource) {
        if (!addResource) return response;
        const user = req.user;
        return this.billingCycleService.addBillingCycle(addResource).then(
            res => response.status(200).json({}),
            err => this.handleServiceError(response, err)
        );
    }*/

    /*@Post('/payment/:id/plan')
    @UseBefore(AuthMiddleware)
    createAppPlan(@Req() req: any, @Res() response: any, @Param('id') id: string) {
        const user = req.user;
        return this.appService.findById(id).then(appRes => {
            return this.stripeService.createAppBillingPlan(appRes.data).then(
                res => response.status(200).json({}),
                err => this.handleServiceError(response, err)
            );
        }).catch(e => this.handleServiceError(response, e));
    }

    @Get('/payment/:id/method')
    @UseBefore(AuthMiddleware)
    getPaymentMethods(@Req() req: any, @Res() response: any, @Param('id') id: string) {
        const user = req.user;
        return this.stripeService.getAppPaymentMethods(user._id, id).then(
            res => response.status(200).json(HttpUtils.mappedResourceToJson(res.data, PaymentMethodSearchMapper)),
            err => this.handleServiceError(response, err)
        );
    }

    @Post('/payment/:id/method')
    @UseBefore(AuthMiddleware)
    setPaymentMethod(@Req() req: any, @Res() response: any, @Param('id') id: string, @BuildResource(SetPaymentMethodMapper) resource: SetPaymentMethodResource) {
        if (!resource) return response;
        const user = req.user;
        return this.stripeService.setAppPaymentMethod(user._id, id, resource).then(
            res => response.status(200).json({}),
            err => this.handleServiceError(response, err)
        );
    }

    @Get('/current/:id')
    @UseBefore(AuthMiddleware)
    getCharges(@Req() req: any, @Res() response: any, @Param('id') id: string) {
        const user = req.user;
        return this.billingCycleService.getCurrentBillingCharges(user._id, id).then(
            res => response.status(200).json(HttpUtils.mappedResourceToJson(res.data, BillingChargesMapper)),
            err => this.handleServiceError(response, err)
        );
    }

    @Get('/history/:id')
    @UseBefore(AuthMiddleware)
    getChargeHistory(@Req() req: any, @Res() response: any, @Param('id') id: string) {
        const user = req.user;
        return this.billingCycleService.getPastSixBillingCycle(user._id, id).then(
            res => response.status(200).json(HttpUtils.mappedResourceToJson(res.data, MetricMapper)),
            err => this.handleServiceError(response, err)
        );
    }*/

}
