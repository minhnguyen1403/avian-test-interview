const shared = require('./shared');

const create = {
    type: 'object',
    properties: {
        name: {
            type: 'string',
        },
        date: {
            type: 'string',
        },
        seats: {
            type: 'array',
        }
    },
    required: [
        'name',
        'date',
    ]
};


module.exports = {
    create,
}