import Resource from '../Resource';

export default class SetPaymentMethodResource extends Resource {

    token = '';

    init(token: string) {
        this.token = token;
        return this;
    }

}
