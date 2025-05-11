const {
    validateBody,
} = require('../middlewares/validator/validator')
const {
    concertSchema,
} = require('../schemas');
const BaseController = require('./base.controller');
const { ConcertService} = require('../services');
const { ConcertValidator } = require('../validators');
const { ConcertModel } = require('../models');
const _ = require('lodash')


class ConcertController extends BaseController{
    static run(app) {
        app.get('/v1/concerts', this.handler('getList'));
        app.get('/v1/concerts/:id', this.handler('getDetail'));
        app.post('/v1/concerts', validateBody(concertSchema.create) ,this.handler('create'));
    }

    async getList(req, res, next) {
        try {
            const query = req.query;
            const condition = ConcertService.buildCondition({ query });
            const { sort_by, select, skip = 0, limit = 10 } = query;
            if (!sort_by) this.sort_by = 'created_at';
            const sort = { [this.sort_by]: this.sort_type };
            const populateField = _.get(query, 'populate_field', '');

            const [data, count] = await Promise.all([
                ConcertModel.find(condition).populate(populateField).select(select).sort(sort).skip(skip).limit(limit),
                ConcertModel.countDocuments(condition),
            ])

            return res.json({
                total: count,
                items: data,
            });
        } catch (error) {
            return next(error);
        }
    }
    async create(req, res, next){
        try {
            const body = req.body;
            const userId = _.get(this, 'loggedUser.id', '');
            await ConcertValidator.checkExistConcert({body});
            const newConcert = await ConcertService.handleCreate({ body, userId });
            
            return res.json(newConcert)
        } catch (error) {
            next(error)
        }
    }

    async getDetail(req, res, next) {
        try {
            const { id } = req.params;
            const detailConcert = await ConcertModel.findById(id).populate('seats').lean();
            return res.json(detailConcert);
        } catch (error) {
            return next(error);
        }
    }


}


module.exports = ConcertController;
