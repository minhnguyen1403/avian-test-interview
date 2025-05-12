'use strict';

const { BaseService } = require('./../base-service');
const { AVAILABLE_SERVICES } = require('../configuration');

class Seats extends BaseService {
    static version() { return 'v1'; }
    static serviceName() { return AVAILABLE_SERVICES.AVIAN_CONCERT; }
    static endpoint() { return 'seats'; }

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

    static booked(id, jwt = null) {
        return this.baseReqBuilder(jwt)
            .withPath(`booked/${id}`)
            .makePut()
            .exec();
    }


}
module.exports = { Seats };
