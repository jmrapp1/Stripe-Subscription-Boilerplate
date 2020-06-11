import { Get, JsonController, Post, Req, Res, UseBefore, } from 'routing-controllers';
import { BuildResource } from '../decorators/BuildResource';
import UserRegisterMapper from '../../shared/mappers/user/UserRegisterMapper';
import UserRegisterResource from '../../shared/resources/user/UserRegisterResource';
import HttpUtils from '../util/HttpUtils';
import UserLoginMapper from '../../shared/mappers/user/UserLoginMapper';
import UserLoginResource from '../../shared/resources/user/UserLoginResource';
import { Inject } from 'typedi';
import UserService from '../services/UserService';
import JwtMapper from '../../shared/mappers/user/JwtMapper';
import BaseController from './BaseController';
import OktaAuthMiddleware from '../middlewares/OktaAuthMiddleware';

@JsonController('/user')
export default class UserController extends BaseController {

    @Inject()
    userService: UserService;

    @Post('/register')
    register(@Res() response: any, @BuildResource(UserRegisterMapper, true) registerResource: UserRegisterResource) {
        if (!registerResource) return response;
        return this.userService.register(registerResource).then(
            res => response.status(200).json({}),
            err => this.handleServiceError(response, err)
        );
    }

    @Post('/login')
    login(@Res() response: any, @BuildResource(UserLoginMapper, true) loginResource: UserLoginResource) {
        if (!loginResource) return response;
        return this.userService.login(loginResource).then(
            res => response.status(200).json(HttpUtils.mappedResourceToJson(res.data, JwtMapper)),
            err => this.handleServiceError(response, err)
        );
    }

    @Get('/test')
    @UseBefore(OktaAuthMiddleware)
    oktaTest(@Req() req: any, @Res() response: any) {
        console.log('Pass');
        return response.sendStatus(200);
    }

}
