import { Inject, Service } from 'typedi';
import ServiceResponse from './response/ServiceResponse';
import Logger from '../util/Logger';
import * as Stripe from 'stripe';
import DateUtils from '../../shared/utils/DateUtils';
import * as dotenv from 'dotenv';
import AddBillingCycleResource from '../../shared/resources/stripe/AddBillingCycleResource';
import SetPaymentMethodResource from '../../shared/resources/stripe/SetPaymentMethodResource';

dotenv.load({ path: '.env' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const DEFAULT_CHARGES = [
    {
        type: 'hosting',
        minValue: 10,
        percentAddition: 1,
        additionalCosts: 1,
        usage: 0
    },
    {
        type: 'texting',
        minValue: 5,
        percentAddition: 1,
        additionalCosts: 0,
        usage: 0
    },
    {
        type: 'email',
        minValue: 5,
        percentAddition: 1,
        additionalCosts: 0,
        usage: 0
    },
    {
        type: 'database',
        minValue: 10,
        percentAddition: 1,
        additionalCosts: 0,
        usage: 0
    }
];

@Service()
export default class StripeService {

    createBillingPlan(app: AppDocument) {
        return new Promise<ServiceResponse<any>>(async (resolve, reject) => {
            try {
                await this.billingCycleService.getRecentBillingCycleForApp(app._id);
            } catch (e) {
                const start = DateUtils.getUtcMomentNow().startOf('month').startOf('day');
                const end = DateUtils.getUtcMomentNow().endOf('month').endOf('day');
                await this.billingCycleService.addBillingCycle(new AddBillingCycleResource().init(app._id, DEFAULT_CHARGES, start, end), DateUtils.getUtcMomentNow());
            }
            await this.createAppProduct(app);
            await this.createAppPlan(app);
            await this.createAppCustomer(app);
            await this.createAppSubscription(app);
            return resolve(new ServiceResponse());
        });
    }

    setAppPaymentMethod(reqUserId: string, appId: string, resource: SetPaymentMethodResource) {
        return new Promise<ServiceResponse<any>>((resolve, reject) => {
            this.appService.findById(appId).then(appRes => {
                // TODO: AUTH BILLING PERMS
                const app = appRes.data;
                if (!app.stripeCustomerId) return reject(new ServiceResponse(`Customer record does not exist for ${ app._id }`, 500));
                stripe.customers.update(app.stripeCustomerId, {
                    source: resource.token,
                }).then(createRes => {
                    // TODO: LOG BILLING SET
                    return resolve(new ServiceResponse());
                }).catch(reject);
            }).catch(reject);
        });
    }

    getAppPaymentMethods(reqUserId: string, appId: string) {
        return new Promise<ServiceResponse<any>>((resolve, reject) => {
            this.appService.findById(appId).then(appRes => {
                // TODO: AUTH BILLING PERMS
                const app = appRes.data;
                if (!app.stripeCustomerId) return reject(new ServiceResponse(`Customer record does not exist for ${ app._id }`, 500));
                stripe.customers.listSources(app.stripeCustomerId, {
                    limit: 100,
                    object: 'card',
                }).then(cardRes => {
                    const cards = cardRes.data.map(card => (
                        new PaymentMethodResource().init(card.brand, card.country, card.exp_month, card.exp_year, card.last4)
                    ));
                    resolve(new ServiceResponse(new PaymentMethodSearchResource().init(cards.length, 0, 100, cards)));
                }).catch(reject);
            }).catch(reject);
        });
    }

    handleStripeWebhook(eventBody, stripeSig: string) {
        return new Promise<ServiceResponse<any>>(async (resolve, reject) => {
            let event;
            try {
                event = stripe.webhooks.constructEvent(eventBody, stripeSig, process.env.STRIPE_WEBHOOK_SECRET);
                console.log(`Successfully validate event ${ event.id }'s signature.`);
            } catch (err) {
                Logger.warn(`Webhook Error: ${ err.message }`);
                return reject(new ServiceResponse('', 401));
            }

            if (!event.type) return reject(new ServiceResponse('Stripe event did not contain a type: ' + JSON.stringify(event), 500));
            const type = event.type.toLowerCase();
            const data = event.data.object;

            // TODO: LOG RECEIVED EVENT TO PREVENT DUPLICATE

            console.log(`Received '${ type }' event ${ event._id || event.id }`);

            try {
                if (type === 'customer.subscription.created') {
                    await this.handleNewCycleCreated(data);
                } else if (type === 'customer.subscription.updated') {
                    await this.handleCycleUpdated(data, event.data);
                } else if (type === 'invoice.created') {
                    await this.handleInvoiceCreated(data);
                } else if (type === 'invoice.upcoming') {
                    await this.handleUpcomingInvoice(data);
                } else if (type === 'invoice.payment_failed') {
                    await this.handleInvoicePaymentFailed(data);
                } else if (type === 'invoice.payment_succeeded') {
                    await this.handleInvoicePaid(data);
                } else if (type === 'invoice.sent') {
                    await this.handleSentInvoice(data);
                } else if (type === 'invoice.payment_action_required') {
                    await this.handleInvoiceActionRequired(data);
                } else if (type === 'invoice.marked_uncollectible') {
                    await this.handleInvoiceUncollectible(data);
                } else {
                    return reject(new ServiceResponse('Received webhook type that is not supported: ' + type));
                }
                return resolve(new ServiceResponse());
            } catch (e) {
                return reject(e);
            }
        });
    }

    private handleNewCycleCreated(data) {
        return new Promise<ServiceResponse<string>>((resolve, reject) => {
            const customer = data.customer;
            this.appService.findAppByCustomerId(customer, ['owner']).then(appRes => {
                const app = appRes.data;
                const cycleStart = DateUtils.fromUnix(data.current_period_start);
                const cycleEnd = DateUtils.fromUnix(data.current_period_end);
                this.billingCycleService.getBillingCycleDuringDate(app._id, cycleStart).then(billingRes => {
                    Logger.warn(`Tried recreating a new billing cycle for app ${ app._id.toString() } for period ${ cycleStart.format(DateUtils.DATE_FULL_TIME_FORMAT) } to ${ cycleEnd.format(DateUtils.DATE_FULL_TIME_FORMAT) }`);
                    return resolve(new ServiceResponse());
                }).catch(() => {
                    this.billingCycleService.getRecentBillingCycleForApp(app._id).then(cyclesRes => {
                        let charges = DEFAULT_CHARGES;
                        if (cyclesRes.data.length > 0) {
                            charges = cyclesRes.data[ 0 ].charges;
                        }
                        charges.forEach(c => c.usage = 0);
                        charges.forEach(c => delete ( c as any )._id);
                        const billCycle: BillingCycleDocument = {
                            _id: undefined,
                            app,
                            status: 'cycleStarted',
                            stripeInvoiceUrl: undefined,
                            charges,
                            usage: 0,
                            actualStartDate: cycleStart.format(DateUtils.DATE_FULL_TIME_FORMAT),
                            cycleStartDate: cycleStart.format(DateUtils.DATE_FULL_TIME_FORMAT),
                            cycleEndDate: cycleEnd.format(DateUtils.DATE_FULL_TIME_FORMAT),
                            stripeChargeData: {
                                chargeLogs: [{
                                    subTotal: 0,
                                    total: 0,
                                    statusDate: DateUtils.getUtcMomentNow().format(DateUtils.DATE_FULL_TIME_FORMAT),
                                    status: 'cycleStarted',
                                    createdOn: DateUtils.getUtcMomentNow().format(DateUtils.DATE_FULL_TIME_FORMAT),
                                    cycleStart: cycleStart.format(DateUtils.DATE_FULL_TIME_FORMAT),
                                    cycleEnd: cycleEnd.format(DateUtils.DATE_FULL_TIME_FORMAT)
                                }]
                            }
                        };
                        this.billingCycleService.insert(billCycle).then(() => {
                            Logger.info(`Successfully created new billing cycle for app ${ app._id } for period ${ cycleStart.format(DateUtils.DATE_FULL_TIME_FORMAT) } to ${ cycleEnd.format(DateUtils.DATE_FULL_TIME_FORMAT) }`);
                            return resolve(new ServiceResponse());
                        }).catch(reject);
                    }).catch(e => {
                        Logger.critical(`Got webhook for stripe customer ${ customer } but could not find recent billing cycle for app: ${ HelperUtils.getExceptionAsString(e) }`);
                        return reject(new ServiceResponse('Could not get billing cycle for app.', 400));
                    });
                });
            }).catch(e => {
                Logger.critical(`Got webhook for stripe customer ${ customer } but could not find app.`);
                return resolve(new ServiceResponse('No app exists with customer. Consuming event.', 200));
            });
        });
    }

    private handleCycleUpdated(data, event) {
        return new Promise<ServiceResponse<string>>((resolve, reject) => {
            const customer = data.customer;
            this.appService.findAppByCustomerId(customer, ['owner']).then(appRes => {
                const app = appRes.data;
                const previousCycleStart = DateUtils.fromUnix(event.previous_attributes.current_period_start);
                const previousCycleEnd = DateUtils.fromUnix(event.previous_attributes.current_period_end);
                const newCycleStart = DateUtils.fromUnix(data.current_period_start);
                const newCycleEnd = DateUtils.fromUnix(data.current_period_end);
                Logger.info(`Got subscription update for new cycle: ${ newCycleStart.format(DateUtils.DATE_FULL_TIME_FORMAT) } to ${ newCycleEnd.format(DateUtils.DATE_FULL_TIME_FORMAT) } from the previous cycle ${ previousCycleStart.format(DateUtils.DATE_FULL_TIME_FORMAT) } to ${ previousCycleEnd.format(DateUtils.DATE_FULL_TIME_FORMAT) }`);
                this.billingCycleService.getBillingCycleDuringDate(app._id, newCycleStart).then(billingRes => {
                    Logger.warn(`Tried recreating a billing cycle for app ${ app._id.toString() } for period ${ newCycleStart.format(DateUtils.DATE_FULL_TIME_FORMAT) } to ${ newCycleEnd.format(DateUtils.DATE_FULL_TIME_FORMAT) } when updating subscription. Found billing cycle ${ billingRes.data._id }`);
                    return resolve(new ServiceResponse());
                }).catch(() => {
                    this.billingCycleService.getRecentBillingCycleForApp(app._id).then(cyclesRes => {
                        let charges = DEFAULT_CHARGES;
                        if (cyclesRes.data.length > 0) {
                            Logger.info(`Found recent billing cycle for app ${ app._id }, cycle id ${ cyclesRes.data[ 0 ] }`);
                            charges = cyclesRes.data[ 0 ].charges;
                        }
                        charges.forEach(c => c.usage = 0);
                        charges.forEach(c => delete ( c as any )._id);
                        const billCycle: BillingCycleDocument = {
                            _id: undefined,
                            app,
                            status: 'cycleStarted',
                            stripeInvoiceUrl: undefined,
                            charges,
                            usage: 0,
                            actualStartDate: newCycleStart.format(DateUtils.DATE_FULL_TIME_FORMAT),
                            cycleStartDate: newCycleStart.format(DateUtils.DATE_FULL_TIME_FORMAT),
                            cycleEndDate: newCycleEnd.format(DateUtils.DATE_FULL_TIME_FORMAT),
                            stripeChargeData: {
                                chargeLogs: [{
                                    subTotal: 0,
                                    total: 0,
                                    statusDate: DateUtils.getUtcMomentNow().format(DateUtils.DATE_FULL_TIME_FORMAT),
                                    status: 'cycleStarted',
                                    createdOn: DateUtils.getUtcMomentNow().format(DateUtils.DATE_FULL_TIME_FORMAT),
                                    cycleStart: newCycleStart.format(DateUtils.DATE_FULL_TIME_FORMAT),
                                    cycleEnd: newCycleEnd.format(DateUtils.DATE_FULL_TIME_FORMAT)
                                }]
                            }
                        };
                        this.billingCycleService.insert(billCycle).then(() => {
                            Logger.info(`Successfully created new billing cycle for app ${ app._id } for period ${ newCycleStart.format(DateUtils.DATE_FULL_TIME_FORMAT) } to ${ newCycleEnd.format(DateUtils.DATE_FULL_TIME_FORMAT) }`);
                            return resolve(new ServiceResponse());
                        }).catch(reject);
                    }).catch(e => {
                        Logger.critical(`Got webhook for stripe customer ${ customer }, app ${ app._id }, but could not find recent billing cycle for app: ${ e.stack }`);
                        return reject(new ServiceResponse('Could not get billing cycle for app.', 400));
                    });
                });
            }).catch(e => {
                Logger.critical(`Got webhook for stripe customer ${ customer } but could not find app.`);
                return resolve(new ServiceResponse('No app exists with customer. Consuming event.', 200));
            });
        });
    }

    private handleInvoicePaid(data) {
        return this.updateStripeChargeData(data, 'paid', true, true).then(res => {
                Logger.info(`Successfully marked billing cycle as paid for app ${ res.data.app._id }`);
                return this.contactService.sendUserEmail(res.data.app.owner, `An invoice of ${ StringUtils.numberToMoneyString(data.total / 100) } for ${ res.data.app.name } has been paid for the period ${ DateUtils.fromUnix(data.period_start).format(DateUtils.DATE_FULL_TIME_FORMAT) } to ${ DateUtils.fromUnix(data.period_end).format(DateUtils.DATE_FULL_TIME_FORMAT) }. Thank you!`);
            }
        );
    }

    private handleInvoiceUncollectible(data) {
        return this.updateStripeChargeData(data, 'uncollectible', true, false).then(res => {
                Logger.critical(`Billing marked as uncollectible for app ${ res.data.app._id }`);
                return this.contactService.sendUserEmail(res.data.app.owner, `An invoice of ${ StringUtils.numberToMoneyString(data.total / 100) } for ${ res.data.app.name } has been marked as uncollectible. Please navigate to ${ res.data.billCycle.stripeInvoiceUrl } to finish the payment. Thank you!`);
            }
        );
    }

    private handleInvoiceActionRequired(data) {
        return this.updateStripeChargeData(data, 'actionRequired', true, false).then(res => {
                Logger.critical(`Payment Action Required for for app ${ res.data.app._id }`);
                return this.contactService.sendUserEmail(res.data.app.owner, `An invoice of ${ StringUtils.numberToMoneyString(data.total / 100) } for ${ res.data.app.name } requires additional action. Please navigate to ${ res.data.billCycle.stripeInvoiceUrl } to finish the payment. Thank you!`);
            }
        );
    }

    private handleInvoicePaymentFailed(data) {
        return this.updateStripeChargeData(data, 'failed', true, false).then(res => {
                Logger.critical(`Billing cycle marked as failed to pay for app ${ res.data.app._id }`);
                return this.contactService.sendUserEmail(res.data.app.owner, `An invoice of ${ StringUtils.numberToMoneyString(data.total / 100) } for ${ res.data.app.name } has failed. Please navigate to ${ res.data.billCycle.stripeInvoiceUrl } to finish the payment. Thank you!`);
            }
        );
    }

    private handleSentInvoice(data) {
        return this.updateStripeChargeData(data, 'sent', true, true).then(
            res => this.contactService.sendUserEmail(res.data.app.owner, `An invoice of ${ StringUtils.numberToMoneyString(data.total / 100) } for ${ res.data.app.name } has just been finalized. You will see a charge to your card shortly. Thank you!`)
        );
    }

    private handleInvoiceCreated(data) {
        return this.updateStripeChargeData(data, 'invoiceCreated');
        // .then(res => this.contactService.sendUserEmail(res.data.app.owner, `This is just a reminder that a charge of ${StringUtils.numberToMoneyString(data.total / 100)} for ${res.data.app.name} will be charged to your card at the end of this billing period. Thank you!`))
    }

    private handleUpcomingInvoice(data) {
        return this.updateStripeChargeData(data, 'upcoming', true, false);
    }

    private updateStripeChargeData(data, status, saveInvoiceUrl = true, saveUsage = true) {
        return new Promise<ServiceResponse<{ app: AppDocument, billCycle: BillingCycleDocument }>>((resolve, reject) => {
            console.log(`Attempting to update stripe charge data for status ${ status }`);
            const customer = data.customer;
            this.appService.findAppByCustomerId(customer, ['owner']).then(appRes => {
                const app = appRes.data;
                const invoiceStart = DateUtils.fromUnix(data.period_start);
                this.billingCycleService.getBillingCycleDuringDate(app._id, invoiceStart).then(billingRes => {
                    const billCycle = billingRes.data;
                    billCycle.stripeChargeData.chargeLogs.push({
                        subTotal: data.subtotal,
                        total: data.total,
                        statusDate: DateUtils.fromUnix(data.status_transitions.finalized_at).format(DateUtils.DATE_FULL_TIME_FORMAT),
                        status: status,
                        createdOn: DateUtils.getUtcMomentNow().format(DateUtils.DATE_FULL_TIME_FORMAT),
                        cycleStart: DateUtils.fromUnix(data.period_start).format(DateUtils.DATE_FULL_TIME_FORMAT),
                        cycleEnd: DateUtils.fromUnix(data.period_end).format(DateUtils.DATE_FULL_TIME_FORMAT)
                    });
                    billCycle.status = status;

                    if (saveUsage) billCycle.usage = NumberUtils.round(data.total / 100, 2);
                    if (saveInvoiceUrl) billCycle.stripeInvoiceUrl = data.hosted_invoice_url;

                    this.billingCycleService.save(billCycle).then(() => {
                        return resolve(new ServiceResponse({ app, billCycle }));
                    }).catch(reject);
                }).catch(e => {
                    Logger.critical(`Got webhook for stripe customer ${ customer } app ${ app._id } but could not get billing cycle for start ${ invoiceStart.format(DateUtils.DATE_FULL_TIME_FORMAT) }`);
                    return reject(new ServiceResponse('Could not get app billing cycle.', 400));
                });
            }).catch(e => {
                Logger.critical(`Got webhook for stripe customer ${ customer } but could not find app.`);
                return reject(new ServiceResponse('No app exists with customer. Consuming event.', 200));
            });
        });
    }

    private createAppCustomer(app: AppDocument) {
        return new Promise<ServiceResponse<string>>((resolve, reject) => {
            if (app.stripeCustomerId) return resolve(new ServiceResponse(app.stripeCustomerId));
            stripe.customers.create({
                name: app.name,
                metadata: {
                    appId: app._id.toString()
                }
            }).then(res => {
                app.stripeCustomerId = res.id;
                this.appService.save(app).then(() => resolve(new ServiceResponse(res.id))).catch(reject);
            }).catch((e) => {
                Logger.critical(`Could not create customer for app ${ app._id }: ${ HelperUtils.getExceptionAsString(e) }`);
                reject(new ServiceResponse('Could not create app customer.', 500));
            });
        });
    }

    private createAppPlan(app: AppDocument) {
        return new Promise<ServiceResponse<string>>((resolve, reject) => {
            if (app.stripePlanId) return resolve(new ServiceResponse(app.stripePlanId));
            stripe.plans.create({
                currency: 'usd',
                interval: 'month',
                product: app.stripeProductId,
                aggregate_usage: 'last_during_period',
                amount: 1,
                usage_type: 'metered'
            }).then(planRes => {
                app.stripePlanId = planRes.id;
                this.appService.save(app).then(() => resolve(new ServiceResponse(planRes.id))).catch(reject);
            }).catch((e) => {
                Logger.critical(`Could not create plan for app ${ app._id }: ${ HelperUtils.getExceptionAsString(e) }`);
                reject(new ServiceResponse('Could not create app plan.', 500));
            });
        });
    }

    private createAppProduct(app: AppDocument) {
        return new Promise<ServiceResponse<string>>((resolve, reject) => {
            if (app.stripeProductId) return resolve(new ServiceResponse(app.stripeProductId));
            stripe.products.create({
                name: app.name,
                type: 'service',
                metadata: {
                    appId: app._id.toString()
                }
            }).then(prodRes => {
                app.stripeProductId = prodRes.id;
                this.appService.save(app).then(() => {
                    return resolve(new ServiceResponse(prodRes.id));
                }).catch(reject);
            }).catch((e) => {
                Logger.critical(`Could not create product for app ${ app._id }: ${ HelperUtils.getExceptionAsString(e) }`);
                reject(new ServiceResponse('Could not create app product.', 500));
            });
        });
    }

    private createAppSubscription(app: AppDocument) {
        return new Promise<ServiceResponse<any>>((resolve, reject) => {
            if (app.stripeSubscriptionId) return resolve(new ServiceResponse(app.stripeSubscriptionId));
            const nextMonth = DateUtils.getUtcMomentNow().endOf('month').endOf('day');
            console.log(`Creating subscription plan for ${ app._id }. Starting now till ${ nextMonth.format(DateUtils.DATE_FULL_TIME_FORMAT) }`);
            const nextUnix = nextMonth.unix();
            stripe.subscriptions.create({
                customer: app.stripeCustomerId,
                items: [
                    {
                        plan: app.stripePlanId
                    }
                ],
                billing_cycle_anchor: nextUnix,
                metadata: {
                    appId: app._id.toString()
                }
            }).then(res => {
                app.stripeSubscriptionId = res.id;
                app.stripeSubscriptionItemId = res.items.data[ 0 ].id;
                this.appService.save(app).then(() => {
                    return resolve(new ServiceResponse(res.id));
                }).catch(reject);
            }).catch((e) => {
                Logger.critical(`Could not create subscription for app ${ app._id }: ${ HelperUtils.getExceptionAsString(e) }`);
                reject(new ServiceResponse('Could not create app subscription.', 500));
            });
        });
    }

}
