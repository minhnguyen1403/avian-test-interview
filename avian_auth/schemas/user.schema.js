const shared = require('./shared');

const login = {
    type: 'object',
    properties: {
        email_or_phone: {
            type: 'string',
        },
        password: {
            type: 'string',
        },
    },
    required: [
        'email_or_phone',
        'password'
    ]
};

const refreshtoken = {
    type: 'object',
    properties: {
        jwt: {
            type: 'string'
        },
        refreshtoken: {
            type: 'string',
        },
    },
    required: [
        'jwt',
        'refreshtoken',
    ]
};

const register = {
    type: 'object',
    properties: {
        password: {
            type: 'string',
        },
        full_name: shared.stringNotEmpty,
        phone: {
            type: 'string',
        },
        email: {
            type: 'string',
        },
        
    },
    required: [
        'phone',
        'password',
        'full_name',
        'email',
    ]
};

module.exports = {
    register,
    refreshtoken,
    login,
}