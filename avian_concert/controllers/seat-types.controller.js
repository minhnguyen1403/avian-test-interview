const BaseController = require('./base.controller');
const { SeatTypeService} = require('../services');
const { SeatTypeModel } = require('../models');
const _ = require('lodash')
const { seatTypeSchema } = require('../schemas');
const { SeatTypeValidator} = require('../validators');
const {
    validateBody,
} = require('../middlewares/validator/validator')

class SeatController extends BaseController{
    static run(app) {
        app.get('/v1/seat-types', this.handler('getList'));
        app.get('/v1/seat-types/:id', this.handler('getDetail'));
        app.put('/v1/seat-types/booking', validateBody(seatTypeSchema.bookingTicket),this.handler('handleBookingTicket'));
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
            const userId = this.loggedUser.id;
            const existedSeatType = await SeatTypeValidator.validateBookingTicket({body: req.body})
            await SeatTypeService.handleBookingTicket({seatType: existedSeatType, userId});
            return res.json({});
        } catch (error) {
            return next(error);
        }
    }


}


module.exports = SeatController;
