import {Inject, Service} from 'typedi';
import ServiceResponse from './response/ServiceResponse';
import DatabaseService from './DatabaseService';
import Subscription, {SubscriptionDocument} from '../models/Subscription';
import AppAccessService from './AppAccessService';
import UserService from './UserService';
import SubscriptionTier from '../models/SubscriptionTier';
import Logger from '../util/Logger';
import BillingCycleService from './BillingCycleService';

@Service()
export default class SubscriptionService extends DatabaseService<SubscriptionDocument> {

    model = Subscription;

    @Inject(type => UserService)
    userService: UserService;

    @Inject(type => BillingCycleService)
    billingCycleService: BillingCycleService;

}
