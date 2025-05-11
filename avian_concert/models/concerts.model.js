
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const { Schema } = mongoose;
const { ConcertConstant } = require('../constants');


const ModelSchema = new Schema({
    name: { type: String },
    description: { type: String },
    date: { type: Date, default: '' },
    location: { type: Number },
    artists: { type: String, unique: true },
    image_url: { type: String, unique: true},
    status: { type: String, default: ConcertConstant.STATUS.active, enum: Object.values(ConcertConstant.STATUS) }, // auto inactive if concert_date is passed
    
    seat_types: [
        { type: mongoose.SchemaTypes.ObjectId, index: true, ref: 'SeatTypeModel' },
    ], 

    total_seats: { type: Number },
    available_seats: { type: Number },
    
}, { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } });

ModelSchema.index({ created_at: -1 });
ModelSchema.index({ modified_at: -1 });

ModelSchema.plugin(mongooseDelete, {
    deletedAt: true,
    deletedBy: true,
    overrideMethods: true,
});

const ConcertModel = mongoose.model('ConcertModel', ModelSchema, 'avian_concerts');

module.exports = {
    ConcertModel,
};
