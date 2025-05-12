
const bookingTicket = {
    type: 'object',
    properties: {
        concert_id: {
            type: 'string',
        },
        seat_type: {
            type: 'string',
        },
    },
    required: [
        'concert_id',
        'seat_type',
    ]
};

const cancelBookingTicket = {
    type: 'object',
    properties: {
        concert_id: {
            type: 'string',
        },
    },
    required: [
        'concert_id',
    ]
};

module.exports = {
    bookingTicket,
    cancelBookingTicket,
}