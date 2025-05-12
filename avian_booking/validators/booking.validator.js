const { BookingModel } = require('../models');
const createError = require('http-errors');

const { BookingConstant } = require('../constants');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function validateBooking({ body }) {
    const { concert_id, user_id } = body;
    const booking = await BookingModel.findOne({ concert_id, user_id, status: { $ne: BookingConstant.STATUS.CANCEL }  }).lean();
    if(booking) throw createError(422, 'existed_booking', { msg: 'Booking exists' });
}

async function validateCancelBooking({ user_id, concert_id }) {
    const booking = await BookingModel.findOne({ concert_id: new ObjectId(concert_id), user_id: new ObjectId(user_id), status: { $ne: BookingConstant.STATUS.PENDING }  }).lean();
    if(booking) throw createError(422, 'booking_is_confirmed', { msg: 'Booking is confirmed/canceled, can not cancel' });
}

module.exports = {
    validateBooking,
    validateCancelBooking,
}