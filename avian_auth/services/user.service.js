const { getPassMd5 } = require('../helpers/common');
const _ = require('lodash');
const { jwtHelper } = require('../internal/avian_framework/helpers/index')

const {  UserModel, UserSessionModel } = require('../models');
const requestIp = require('request-ip');
const crypto = require("crypto");
const { userConstant } = require('../constants');


async function handleLogin({ user, req }) {
    const uuid = crypto.randomBytes(16).toString("hex");
    const [refreshtoken, jwt] = await Promise.all([
    jwtHelper.sign(APP_CONFIG.refresh_secret, { uuid }, "8d"),
    jwtHelper.sign(
        APP_CONFIG.jwt_secret,
        {
            id: user._id,
            full_name: user.full_name,
            email: user.email,
            phone: user.phone,
            last_login: Date.now(),
            uuid,
        },
        "7d"
    )]);

    // create session
    const sessionObject = {
        user_id: user._id,
        user_jwt: jwt,
        user_agent: req.headers['user-agent'],
        client_ip: requestIp.getClientIp(req),
        login_at: Date.now(),
        logout_at: -1,
        is_expired: false,
        expired_reason: '',
        expire_at: Date.now() + userConstant.ONE_DAY_MILISECOND * 7,
    };
    await UserSessionModel.create(sessionObject);

    return {
        ..._.omit(user, ['password']),
        jwt,
        refreshtoken,
    }
    
}

async function handleRegister({ body }) {
    const { password, full_name, email, age, phone } = body;
    const hashPassword = await getPassMd5(password, APP_CONFIG.jwt_secret);
    const user = await UserModel.create({
        phone,
        email,
        password: hashPassword,
        full_name,
        age,
    });

    return _.omit(user.toObject(), ['password']);
}

module.exports = {
    handleRegister,
    handleLogin,
    handleRegister,
}