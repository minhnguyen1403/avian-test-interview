const _ = require('lodash');
const { BookingModel} = require('../models');
const createError = require('http-errors');
const { SeatConstant } = require('../constants');
const sdk = require('../internal/avian_sdk');

async function createBooking({ body, userId }){

    const { concert_id, concert_name, concert_date, seat_type_id, seat_type, seat_name, price, user_id  } = body;
    // booked seat
    const booking = await BookingModel.create({
        concert_id,
        concert_name,
        concert_date,
        seat_type,
        seat_type_id,
        seat_name,
        user_id: userId,
        price,
        user_id,
    });

    return booking;

}

module.exports = {
    createBooking
};