import {Inject, Service} from 'typedi';
import DatabaseService from '../DatabaseService';
import StripeUser, { IStripeUserDocument } from '../../models/stripe/StripeUser';
import StripeService from './StripeService';

@Service()
export default class StripeUserService extends DatabaseService<IStripeUserDocument> {

    model = StripeUser;

    @Inject(type => StripeService)
    stripeService: StripeService;



}
