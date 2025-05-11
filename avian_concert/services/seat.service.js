const _ = require('lodash');
const { SeatModel, ConcertModel } = require('../models');
const createError = require('http-errors');
const { SeatConstant } = require('../constants');

function buildCondition({ query }) {
    const {
        from_created_at,
        to_created_at,
        search_text,
        concert_status,
        status,
    } = query;

    let cond = {};
    if(from_created_at) cond = _.merge(cond, { created_at: { $gte: moment.utc(from_created_at) } })
    if(to_created_at) cond = _.merge(cond, { created_at: { $lte: moment.utc(to_created_at) } })
    if(search_text) {
        conditions.$or = [
            { concert_name: { $regex: search_text, $options: 'i' } },
        ];
    }
    if(concert_status)
        cond = _.merge(cond, { concert_status: { $in: concert_status.split(',') } })
    if(status)
        cond = _.merge(cond, { concert_status: { $in: status.split(',') } })

    return cond;
}

async function handleBookedSeat({ id }) {
    const seat = await SeatModel.findById(id).lean();

    if(!seat) throw createError(422, 'not_exists_seat');

    const { concert_id } = seat;
    // update status for seat && count total for concert
    await Promise.all([
        SeatModel.findByIdAndUpdate(id, { status: SeatConstant.STATUS.BOOKED, modified_at: new Date() }),
        ConcertModel.findOneAndUpdate({ _id: concert_id}, {
            $set: { modified_at: new Date()},
            $inc: { sold_seats: 1, available_seats: -1 }
        })
    ])
};

module.exports = {
    buildCondition,
    handleBookedSeat,
};