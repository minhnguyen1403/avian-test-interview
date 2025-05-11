const { UserModel } = require('../models');
const createError = require('http-errors');
const { isValidEmail, isValidPhone } = require('../helpers/common');
const { getPassMd5 } = require('../helpers/common');
const { userConstant } = require('../constants');

async function isValidUser({body}) {
    // validate by requirement
    const { phone, email } = body;
    if(!isValidEmail(email))throw createError(422, 'invalid_email', { msg: 'Invalid email' });
    if(!isValidPhone(phone))throw createError(422, 'invalid_phone', { msg: 'Invalid phone' });
    const existedUser = await UserModel.findOne({$or: [
        {phone}, 
        {email}
    ]}).lean();
    if(existedUser) throw createError(422, 'existed_user', { msg: 'Email or phone number is already registered.' });
}

async function validateLogin({body}) {
    const { email_or_phone, password } = body;
    const user = await UserModel.findOne({
        $or: [ { email: email_or_phone }, { phone: email_or_phone}]
    }).lean();
    if(!user) throw createError(422, 'invalid_user', { msg: 'Invalid User'});
    // compare pwd
    const hashPassword = await getPassMd5(password, APP_CONFIG.jwt_secret);
    if(user.password !== hashPassword){
        throw createError(422, 'invalid_password', { msg: 'Invalid Password' });
    }
    if (user.status == userConstant.STATUS.inactive) {
        throw createError(422, 'invalid_user', { msg: 'Inactive User' });
    }
    return user;
}

module.exports = {
    isValidUser,
    validateLogin,
}