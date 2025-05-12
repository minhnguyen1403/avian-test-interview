'use strict';

const { BaseService } = require('../base-service');
const { AVAILABLE_SERVICES } = require('../configuration');

class Booking extends BaseService {
    static version() { return 'v1'; }
    static serviceName() { return AVAILABLE_SERVICES.AVIAN_BOOKING; }
    static endpoint() { return 'booking'; }

    static excludeAutoParse() {
    }

    fillData(data) {
    }

    static getDetail(id, jwt = null) {
        return this.baseReqBuilder(jwt)
            .withPath(`${id}`)
            .makeGET()
            .exec();
    }

    static createBooking(body, jwt = null) {
        return this.baseReqBuilder(jwt)
            .makePOST(body)
            .exec();
    }

    static cancel(body, jwt = null) {
        return this.baseReqBuilder(jwt)
            .withPath('cancel')
            .makePOST(body)
            .exec();
    }


}
module.exports = { Booking };
