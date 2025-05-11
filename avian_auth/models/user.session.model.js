
const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');
const { Schema } = mongoose;
const { userConstant } = require('../constants');

const ModelSchema = new Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        default: null,
    },
    user_jwt: { type: String, default: '' },
    user_agent: { type: String, default: '' },
    client_ip: { type: String, required: false },
    login_at: { type: Date, required: false },
    logout_at: { type: Date, required: false },
    expire_at: { type: Date, required: false },
    headers: { type: Schema.Types.Mixed },
    is_expired: { type: Boolean, default: false },
    expired_reason: { type: String, required: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'modified_at' } });

ModelSchema.index({ created_at: -1 });
ModelSchema.index({ modified_at: -1 });

ModelSchema.plugin(mongooseDelete, {
    deletedAt: true,
    deletedBy: true,
    overrideMethods: true,
});

const UserSessionModel = mongoose.model('UserSessionModel', ModelSchema, 'avian_user_sessions');

module.exports = {
    UserSessionModel,
};
