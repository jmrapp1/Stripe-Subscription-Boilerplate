import Resource from '../Resource';
import PaymentMethodResource from './PaymentMethodResource';

export default class PaymentMethodSearchResource extends Resource {

    total = 0;
    offset = 0;
    size = 0;
    cards: PaymentMethodResource[] = [];

    init(total: number, offset: number, size: number, cards: PaymentMethodResource[]): PaymentMethodSearchResource {
        this.total = total;
        this.offset = offset;
        this.size = size;
        this.cards = cards;
        return this;
    }

}
