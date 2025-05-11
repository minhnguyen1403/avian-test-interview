const moment = require('moment-timezone');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { ConcertModel, SeatTypeModel } = require('../models');
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
    const { seat_types, name, description, date, location, artists, image_url  } = body;

    const totalSeats = _.sumBy(seat_types, 'total_seats');
    
    const dataConcert = {
        _id: new ObjectId(),
        name,
        description,
        date: moment.utc(date),
        location,
        artists,
        image_url,
        total_seats: totalSeats,
        available_seats: totalSeats,
        created_by: userId,
    };

    const createdSeatTypes = _.map(seat_types, (item) => ({
        _id: ObjectId(),
        // data concert
        concert_id: dataConcert._id,
        concert_name: name,
        concert_date: moment.utc(date),
        
        // data seat
        type: item.type,
        price: item.price,
        name: item.name,
        total_seats: item.total_seats,
        remaining_seats: item.remaining_seats,
        created_by: userId,
    }));

    // create concert and seat
    await ConcertModel.create({...dataConcert, seat_types: _.map(createdSeatTypes, '_id')}),
    await SeatTypeModel.create(createdSeatTypes);

    const newConcert = await ConcertModel.findOne({ _id: dataConcert._id }).populate('seats').lean();

    return newConcert;
};

module.exports = {
    buildCondition,
    handleCreate,
};