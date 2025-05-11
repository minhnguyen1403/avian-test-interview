const { ConcertModel } = require('../models');
const createError = require('http-errors');
const moment = require('moment-timezone');

async function checkExistConcert({ body }) {
    const { name, date } = body;

    const existedConcert = await ConcertModel.findOne({
        name,
        date: moment.utc(date),
    }).lean();

    if(existedConcert != null) throw createError(422, 'existed_concert');
}

module.exports = {
    checkExistConcert
}