const { BookingModel } = require('../models');
const createError = require('http-errors');
const moment = require('moment-timezone');
const sdk = require('../internal/avian_sdk/');
const { BookingConstant } = require('../constants');

async function validateBooking({ body }) {
    const { concert_id, user_id } = body;
    const booking = await BookingModel.findOne({ concert_id, user_id  }).lean();
    if(booking) throw createError(422, 'existed_booking', { msg: 'Booking exists' });
}

module.exports = {
    validateBooking
}