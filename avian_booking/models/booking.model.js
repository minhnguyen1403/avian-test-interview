
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const { Schema } = mongoose;
const { BookingConstant } = require('../constants');
const { ObjectId } = mongoose.Types;

const ModelSchema = new Schema({
    concert_id: { type: ObjectId, ref: 'ConcertModel' },
    concert_name: { type: String },
    concert_date: { type: Date, default: '' },

    user_id: { type: ObjectId},
    seat_type_id: { type: ObjectId },
    seat_type: { type: String },
    seat_name: { type: String },

    status: { type: String, enum: Object.values(BookingConstant.STATUS), default: BookingConstant.STATUS.AVAILABLE },
    price: { type: Number, required: true },

}, { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } });

ModelSchema.index({ created_at: -1 });
ModelSchema.index({ modified_at: -1 });

ModelSchema.plugin(mongooseDelete, {
    deletedAt: true,
    deletedBy: true,
    overrideMethods: true,
});

ModelSchema.index({ concert_id: 1, user_id: 1 }, { unique: true });

const BookingModel = mongoose.model('BookingModel', ModelSchema, 'avions_bookings');

module.exports = {
    BookingModel,
};
