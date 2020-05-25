import UserRegisterMapper from './user/UserRegisterMapper';
import UserLoginMapper from './user/UserLoginMapper';
import JwtMapper from './user/JwtMapper';
import StripeBillingChargeMapper from './stripe/StripeBillingChargeMapper';
import StripeProductMapper from './stripe/StripeProductMapper';
import StripeProductPlanMapper from './stripe/StripeProductPlanMapper';
import ExampleProductPlanMapper from './product/ExampleProductPlanMapper';
import ExampleProductMapper from './product/ExampleProductMapper';

export const GenericMappers = {
};
const mappers = [
    UserRegisterMapper,
    UserLoginMapper,
    JwtMapper,
    StripeBillingChargeMapper,
    StripeProductMapper,
    StripeProductPlanMapper,
    ExampleProductPlanMapper,
    ExampleProductMapper
];

export function buildFromMapper(mapperId: string, isArray: boolean, json) {
    for (let i = 0; i < mappers.length; i++) {
        if (mappers[ i ].id === mapperId) {
            if (!isArray) return mappers[ i ].build(cleanData(json));
            return json.map(data => mappers[ i ].build(cleanData(data)));
        }
    }
    return json;
}

function cleanData(data) {
    delete data['validated'];
    return data;
}

export default {
    buildFromMapper,
    GenericMappers
};
