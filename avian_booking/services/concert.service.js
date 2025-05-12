const moment = require('moment-timezone');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { ConcertModel, SeatModel } = require('../models');
const _ = require('lodash');

function buildCondition({ query }) {
    const {
        from_created_at,
        to_created_at,
        search_text
    } = query;

    let cond = {};
    if(from_created_at) cond = _.merge(cond, { created_at: { $gte: moment.utc(from_created_at) } })
    if(to_created_at) cond = _.merge(cond, { created_at: { $lte: moment.utc(to_created_at) } })
    if(search_text) {
        conditions.$or = [
            { name: { $regex: search_text, $options: 'i' } },
        ];
    }
    return cond;
}

async function handleCreate({ body, userId }) {
    const { seats, name, description, date, location, artists, image_url  } = body;

    const countSeats = seats.length;
    
    const dataConcert = {
        _id: new ObjectId(),
        name,
        description,
        date: moment.utc(date),
        location,
        artists,
        image_url,
        total_seats: countSeats,
        available_seats: countSeats,
        sold_seats: 0,
        created_by: userId,
    };

    const createdSeats = _.map(seats, (item) => ({
        _id: ObjectId(),
        // data concert
        concert_id: dataConcert._id,
        concert_name: name,
        concert_date: moment.utc(date),
        
        // data seat
        type: item.type,
        price: item.price,
        seat_number: item.seat_number,
        row: item.row,
        column: item.column,
        zone: item.zone,
        created_by: userId,
    }));

    // create concert and seat
    await ConcertModel.create({...dataConcert, seats: _.map(createdSeats, '_id')}),
    await SeatModel.create(createdSeats);

    const newConcert = await ConcertModel.findOne({ _id: dataConcert._id }).populate('seats').lean();

    return newConcert;
};

module.exports = {
    buildCondition,
    handleCreate,
};