
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const { Schema } = mongoose;
const { ConcertConstant } = require('../constants');


const ModelSchema = new Schema({
    name: { type: String },
    description: { type: String },
    date: { type: String, default: '' },
    location: { type: Number },
    artists: { type: String, unique: true },
    image_url: { type: String, unique: true},
    status: { type: String, default: ConcertConstant.STATUS.active, enum: Object.values(ConcertConstant.STATUS) },
    seats: [
        { type: mongoose.SchemaTypes.ObjectId, index: true, ref: 'SeatModel' },
    ], 

    total_seats: { type: Number },
    available_seats: { type: Number },
    sold_seats: { type: Number },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } });

ModelSchema.index({ created_at: -1 });
ModelSchema.index({ modified_at: -1 });

ModelSchema.plugin(mongooseDelete, {
    deletedAt: true,
    deletedBy: true,
    overrideMethods: true,
});

const ConcertModel = mongoose.model('ConcertModel', ModelSchema, 'avions_concerts');

module.exports = {
    ConcertModel,
};
