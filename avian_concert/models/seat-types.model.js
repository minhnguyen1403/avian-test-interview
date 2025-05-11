
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const { Schema } = mongoose;
const { SeatConstant, ConcertConstant } = require('../constants');
const { ObjectId } = mongoose.Types;

const ModelSchema = new Schema({
    concert_id: { type: ObjectId, ref: 'ConcertModel' },
    concert_name: { type: String },
    concert_date: { type: Date, default: '' },
    concert_status: { type: Number, default: ConcertConstant.STATUS.active },

    name: { type: String },
    type: { type: String, default: SeatConstant.TYPE.REGULAR, enum: Object.values(SeatConstant.TYPE) }, // VIP, Regular, etc.
    price: { type: Number, required: true },

    is_sold_out: { type: Boolean, default: false},
    total_seats: { type: Number },
    remaining_seats: { type: Number },
    // seat_number: { type: String }, // A1, B5
    // row: { type: String }, // A, B, C
    // column: { type: Number }, // 1, 2, 3
    // zone: { type: String },
	//zone: { type: String },

    expired_at: { type: Date },

}, { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } });

ModelSchema.index({ created_at: -1 });
ModelSchema.index({ modified_at: -1 });

ModelSchema.plugin(mongooseDelete, {
    deletedAt: true,
    deletedBy: true,
    overrideMethods: true,
});
ModelSchema.index({ concert_id: 1, type: 1 }, { unique: true });

const SeatTypeModel = mongoose.model('SeatTypeModel', ModelSchema, 'avian_seat_types');

module.exports = {
    SeatTypeModel,
};
