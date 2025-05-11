const BaseController = require('./base.controller');
const { SeatService} = require('../services');
const { SeatModel } = require('../models');
const _ = require('lodash')


class SeatController extends BaseController{
    static run(app) {
        app.get('/v1/seats', this.handler('getList'));
        app.get('/v1/seats/:id', this.handler('getDetail'));
        app.put('/v1/seats/booked/:id' ,this.handler('bookingSeat'));

    }

    async getList(req, res, next) {
        try {
            const query = req.query;
            const condition = SeatService.buildCondition({ query });
            const { sort_by, select, skip = 0, limit = 10 } = query;
            if (!sort_by) this.sort_by = 'created_at';
            const sort = { [this.sort_by]: this.sort_type };

            const [data, count] = await Promise.all([
                SeatModel.find(condition).select(select).sort(sort).skip(skip).limit(limit),
                SeatModel.countDocuments(condition),
            ])

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
            const detailConcert = await SeatModel.findById(id).lean();
            return res.json(detailConcert);
        } catch (error) {
            return next(error);
        }
    }

    async bookingSeat(req, res, next) {
        try {
            const { id } = req.params;
            await SeatService.handleBookedSeat({id});
            return res.json({});
        } catch (error) {
            return next(error);
        }
    }


}


module.exports = SeatController;
