const {BaseController} = require('../internal/avian_framework/controllers');
const { BookingService } = require('../services');
const { BookingModel } = require('../models');
const { BookingValidator} = require('../validators');
const _ = require('lodash')
const sdk = require('../internal/avian_sdk/');
const { CacheProvider } = require('../internal/avian_framework/redis')

class BookingController extends BaseController{
    static run(app) {
        app.get('/v1/booking/:id', this.handler('getDetail'));
        app.post('/v1/booking', this.handler('create'));
        app.post('/v1/booking/cancel', this.handler('cancelBooking'));
    }

    async getDetail(req, res, next) {
        try {
            const { id } = req.params;
            const booking = await BookingModel.findById(id).lean();
            return res.json(booking);
        } catch (error) {
            return next(error);
        }
    }

    // simulator send Mail - I comment to avoid service errors.
    async triggerSendMail(booking) {
        // push message to queue
        const options = this.reqBuilder()
            .trusted(APP_CONFIG.ACCESS_TRUSTED_MAIL)
            .withPath(`/v1/email/send`)
            .makePOST(booking)
            .build();
        this.queueProvider.enqueueToExchange(options, null, 'normal');
    }

    async create(req, res, next) {
        try {
            const body = req.body;
            // lock trans
            await BookingValidator.validateBooking({ body });
            const newBooking = await BookingService.createBooking({ body });
            // send mail when booking successful - I comment to avoid service errors.
            // this.triggerSendMail(newBooking);
            return res.json(newBooking);
        } catch (error) {
            return next(error);
        }
    }

    async cancelBooking(req, res, next) {
        try {
            const { user_id, concert_id } = req.body;
            const oldBooking = await BookingValidator.validateCancelBooking({ user_id, concert_id });
            const booking = await BookingService.cancelBooking({ user_id, oldBooking });
            // send mail when cancel booking successful - I comment to avoid service errors.
            // this.triggerSendMail(booking);
            return res.json(booking);
        }catch(err) {
            return next(err);
        }
    }

}


module.exports = BookingController;
