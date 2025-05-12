const {BaseController} = require('../internal/avian_framework/controllers');
const { SeatTypeService} = require('../services');
const { SeatTypeModel } = require('../models');
const _ = require('lodash')
const { seatTypeSchema } = require('../schemas');
const { SeatTypeValidator} = require('../validators');
const {
    validateBody,
} = require('../middlewares/validator/validator')
const createError = require('http-errors');

class SeatController extends BaseController{
    static run(app) {
        app.get('/v1/seat-types', this.handler('getList'));
        app.get('/v1/seat-types/:id', this.handler('getDetail'));
        app.post('/v1/seat-types/booking', validateBody(seatTypeSchema.bookingTicket),this.handler('handleBookingTicket'));
        app.post('/v1/seat-types/cancel-booking', validateBody(seatTypeSchema.cancelBookingTicket),this.handler('handleCancelBooking'));
        app.post('/v1/seat-types/sync-redis',this.handler('syncRemainingQtyToRedis'));
    }

    /**
     * Check system integrity every 5 minutes. If the remaining seat count between Redis and Mongo differs, report it to a group (e.g., Telegram) for verification.
     *  If there's a network error, sync the data to ensure consistency. For other errors, find a solution.
     */
    async syncRemainingQtyToRedis(req, res, next) {
        try {
            return res.json({});
        } catch (error) {
            return next(error);
        }
    }

    async getList(req, res, next) {
        try {
            const query = req.query;
            const condition = SeatTypeService.buildCondition({ query });
            const { sort_by, select, skip = 0, limit = 10 } = query;
            if (!sort_by) this.sort_by = 'created_at';
            const sort = { [this.sort_by]: this.sort_type };

            const [data, count] = await Promise.all([
                SeatTypeModel.find(condition).select(select).sort(sort).skip(skip).limit(limit),
                SeatTypeModel.countDocuments(condition),
            ]);

            return res.json({
                total: count,
                items: data,
            });
        } catch (error) {
            return next(error);
        }
    }

    async getDetail(req, res, next) {
        try {
            const { id } = req.params;
            const detailConcert = await SeatTypeModel.findById(id).lean();
            return res.json(detailConcert);
        } catch (error) {
            return next(error);
        }
    }

    async handleBookingTicket(req, res, next) {
        try {
            if(!this.loggedUser) throw createError(422, 'required_user');
            const userId = this.loggedUser.id;
            const existedSeatType = await SeatTypeValidator.validateBookingTicket({body: req.body})
            const newBooking = await SeatTypeService.handleBookingTicket({seatType: existedSeatType, userId});
            return res.json(newBooking);
        } catch (error) {
            return next(error);
        }
    }

    async handleCancelBooking(req, res, next) {
        try {
            if(!this.loggedUser) throw createError(422, 'required_user');
            const userId = this.loggedUser.id;
            await SeatTypeService.cancelBooking({ body: req.body, userId });
            return res.json({});
        } catch (error) {
            return next(error);
        }
    }


}


module.exports = SeatController;
