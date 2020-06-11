import * as OktaJwtVerifier from '@okta/jwt-verifier';
import { ExpressMiddlewareInterface } from 'routing-controllers';

const oktaJwtVerifier = new OktaJwtVerifier({
    issuer: process.env.ISSUER,
    clientId: process.env.CLIENT_ID
});

export default class OktaAuthMiddleware implements ExpressMiddlewareInterface {

    async use(req: any, res: any, next: (err?: any) => any) {
        try {
            const { authorization } = req.headers;
            if (!authorization) throw new Error('You must send an Authorization header');

            const [authType, token] = authorization.trim().split(' ');
            if (authType !== 'Bearer') throw new Error('Expected a Bearer token');

            const { claims } = await oktaJwtVerifier.verifyAccessToken(token);
            if (!claims.scp.includes(process.env.SCOPE)) {
                throw new Error('Could not verify the proper scope');
            }
            next();
        } catch (error) {
            next(error.message);
        }
    }

}