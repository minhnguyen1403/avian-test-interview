const { SeatTypeModel } = require('../models');
const createError = require('http-errors');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

async function validateBookingTicket({ body }) {
    const { concert_id, seat_type } = body;

    const seatType = await SeatTypeModel.findOne({
        concert_id: new ObjectId(concert_id),
        type: seat_type,
    }).lean();

    if(!seatType) throw createError(422, 'not_exists_seat_type');
    const { is_sold_out } = seatType;
    if(is_sold_out) throw createError(422, 'sold_out_ticket')

    return seatType;
}

module.exports = {
    validateBookingTicket,
}