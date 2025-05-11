
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const { Schema } = mongoose;
const { userConstant } = require('../constants');
const { removeAccent } = require('../helpers/common');


const ModelSchema = new Schema({
    password: { type: String },
    full_name: { type: String },
    full_name_none_accent: { type: String, default: '' },
    age: { type: Number },
    email: { type: String, unique: true },
    phone: { type: String, unique: true},
    status: { type: String, default: userConstant.STATUS.active, enum: Object.values(userConstant.STATUS) },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } });

ModelSchema.index({ created_at: -1 });
ModelSchema.index({ modified_at: -1 });

ModelSchema.plugin(mongooseDelete, {
    deletedAt: true,
    deletedBy: true,
    overrideMethods: true,
});

ModelSchema.pre('save', function (next) {
    if (this.full_name) {
        this.full_name_none_accent = removeAccent(this.full_name);
    }
    if (this.email) {
        this.email = this.email.toLowerCase();
    }
    return next();
});
const UserModel = mongoose.model('UserModel', ModelSchema, 'avions_users');

module.exports = {
    UserModel,
};
