
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const { Schema } = mongoose;
const { SeatConstant, ConcertConstant } = require('../constants');
const { ObjectId } = mongoose.Types;

const ModelSchema = new Schema({
    concert_id: { type: ObjectId, ref: 'ConcertModel' },
    concert_name: { type: String },
    concert_date: { type: String, default: '' },
    concert_status: { type: Number, default: ConcertConstant.STATUS.active },

    type: { type: String, default: SeatConstant.TYPE.REGULAR, enum: Object.values(SeatConstant.TYPE) }, // VIP, Regular, etc.
    price: { type: Number, required: true },

    seat_number: { type: String }, // A1, B5
    row: { type: String }, // A, B, C
    column: { type: Number }, // 1, 2, 3
    zone: { type: String },
    status: { type: String, enum: Object.values(SeatConstant.STATUS), default: SeatConstant.STATUS.AVAILABLE },
	zone: { type: String },

    expired_at: { type: Date },

}, { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } });

ModelSchema.index({ created_at: -1 });
ModelSchema.index({ modified_at: -1 });

ModelSchema.plugin(mongooseDelete, {
    deletedAt: true,
    deletedBy: true,
    overrideMethods: true,
});

const SeatModel = mongoose.model('SeatModel', ModelSchema, 'avions_seats');

module.exports = {
    SeatModel,
};
