const {BaseController} = require('../internal/avian_framework/controllers');
const { BookingService } = require('../services');
const { BookingModel } = require('../models');
const { BookingValidator} = require('../validators');
const _ = require('lodash')
const sdk = require('../internal/avian_sdk/');
const { CacheProvider } = require('../internal/avian_framework/redis')

class BookingController extends BaseController{
    static run(app) {
        app.get('/v1/booking', this.handler('getList'));
        app.get('/v1/booking/:id', this.handler('getDetail'));
        app.post('/v1/booking', this.handler('create'));
    }

    // async getList(req, res, next) {
    //     try {
    //         const query = req.query;
    //         const condition = SeatService.buildCondition({ query });
    //         const { sort_by, select, skip = 0, limit = 10 } = query;
    //         if (!sort_by) this.sort_by = 'created_at';
    //         const sort = { [this.sort_by]: this.sort_type };

    //         const [data, count] = await Promise.all([
    //             SeatModel.find(condition).select(select).sort(sort).skip(skip).limit(limit),
    //             SeatModel.countDocuments(condition),
    //         ])

    //         return res.json({
    //             total: count,
    //             items: data,
    //         });
    //     } catch (error) {
    //         return next(error);
    //     }
    // }

    async getDetail(req, res, next) {
        try {
            const { id } = req.params;
            const booking = await BookingModel.findById(id).lean();
            return res.json(booking);
        } catch (error) {
            return next(error);
        }
    }

    async create(req, res, next) {
        try {
            const body = req.body;
            // lock trans
            await BookingValidator.validateBooking({ body });
            const newBooking = await BookingService.createBooking({ body })

            return res.json(newBooking);
        } catch (error) {
            return next(error);
        }
    }

}


module.exports = BookingController;
