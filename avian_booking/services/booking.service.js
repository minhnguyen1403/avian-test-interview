const _ = require('lodash');
const { BookingModel} = require('../models');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const { BookingConstant } = require('../constants');

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

async function cancelBooking({ user_id, concert_id }) {
    // cancel booking
    const booking = await BookingModel.findOneAndUpdate(
        { user_id: new ObjectId(user_id), concert: new ObjectId(concert_id), status: BookingConstant.STATUS.PENDING}, {
            $set: {
                status: BookingConstant.STATUS.CANCEL,
                modified_at: new Date(),
                modified_by: user_id,
            }
        }
    );
    return booking;
}

module.exports = {
    createBooking,
    cancelBooking,
};