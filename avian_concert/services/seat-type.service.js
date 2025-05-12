const _ = require('lodash');
const { SeatTypeModel, ConcertModel } = require('../models');
const sdk = require('../internal/avian_sdk')
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
function buildCondition({ query }) {
    const {
        from_created_at,
        to_created_at,
        search_text,
        concert_status,
        type,
        concert_id,
    } = query;

    let cond = {};
    if(from_created_at) cond = _.merge(cond, { created_at: { $gte: moment.utc(from_created_at) } })
    if(to_created_at) cond = _.merge(cond, { created_at: { $lte: moment.utc(to_created_at) } })
    if(search_text) {
        conditions.$or = [
            { concert_name: { $regex: search_text, $options: 'i' } },
        ];
    }
    if(concert_status)
        cond = _.merge(cond, { concert_status: { $in: concert_status.split(',') } })

    if(type) cond = _.merge(cond, { type: type.split(',') })

    if(concert_id) cond = _.merge(cond, { concert_id: ObjectId(concert_id) })
    
    return cond;
}

async function reserveSeatTypeInRedis({ redisKey, amount = -1 }) {
    // amount = 1 -> cancel booking
    // amount = 1 -> create booking
    
    const luaScript = `
        local key = KEYS[1]
        local amount = tonumber(ARGV[1])
        local current = tonumber(redis.call("GET", key))

        if current == nil then
            return -1
        end

        if current < amount then
            return 0
        end

        redis.call("INCRBY", key, amount)
        return 1
    `;

    const redisKeyStr = String(redisKey);
    const amountStr = String(amount);

    const result = await redis.eval(luaScript, {
        keys: [redisKeyStr],
        arguments: [amountStr],
    });

    return result;
}

async function initSeatTypeStockIfNeeded({ redisKey, remainingSeats }) {
    const exists = await redis.exists(redisKey);
    if (!exists) {
        await redis.set(redisKey, remainingSeats || 0);
    }
}

async function updateRemainingQtyOnMongodb({ seatTypeId, amount = -1, concertId }) {
    // update status for seat && count total for concert
    await Promise.all([
        SeatTypeModel.findByIdAndUpdate(seatTypeId, {
            $set: {
                modified_at: new Date()
            },
            $inc: { remaining_seats: amount }}),
        ConcertModel.findOneAndUpdate({ _id: concertId}, {
            $set: { modified_at: new Date()},
            $inc: { available_seats: amount }
        })
    ]);
    // update status is_sold_old for seatTypeModel and else
    if(amount == -1) {
        await SeatTypeModel.updateOne(
            { _id: seatTypeId, remaining_seats: 0  },
            { $set: { is_sold_out: true, modified_at: new Date() } }
        );
    }else {
        await SeatTypeModel.updateOne(
            { _id: seatTypeId, remaining_seats: { $ne: 0 }  },
            { $set: { is_sold_out: false, modified_at: new Date() } }
        );
    }
    
}

async function handleBookingTicket({ seatType, userId }) {
    const { concert_id: concertId, concert_date, concert_status, type, concert_name, price, seat_name, _id: seatTypeId, remaining_seats: remainingSeats} = seatType;
    
    const redisKey = `${concertId}-${seatTypeId}`;
    try {

        // handle lock with lua-script on redis
        // init redis if needed
        await initSeatTypeStockIfNeeded({ redisKey, concertId, seatTypeId, remainingSeats });
        // reverse ticket in redis
        const result = await reserveSeatTypeInRedis({ redisKey });
        if (result === 0) {
            throw createError(422, 'ticket_is_sold_out');
        } else if (result == -1) {
            throw createError(422, 'seat_is_not_init');
        }

        // Usually, this part will be pushed to Rabbit
        const createdBooking = {
            seat_type_id: seatTypeId,
            concert_date,
            concert_status,
            seat_type: type,
            concert_id: concertId,
            concert_name,
            price,
            seat_name,
            user_id: userId
        };
        const booking = await sdk.Booking.createBooking(createdBooking);
        // update status for seat && count total for concert
        await updateRemainingQtyOnMongodb({ seatTypeId, concertId, amount: -1 });
        // done 
        return booking;
    }catch(err) {
        // if error -> rollback
        await redis.incrBy(redisKey, 1);
        throw err;
    }
};

async function cancelBooking({ body, userId}){
    const { concert_id } = body;
    
    // cancel from service booking
    const booking = await sdk.Booking.cancel({ concert_id, user_id: userId });

    // done -> update qty on redis and mongo
    const { concert_id: concertId, seat_type_id: seatTypeId } = booking;
    // redis
    const redisKey = `${concertId}-${seatTypeId}`;
    reserveSeatTypeInRedis({ redisKey, amount: 1})
    // mongo
    await updateRemainingQtyOnMongodb({ seatTypeId, concertId, amount: 1 });

}

module.exports = {
    buildCondition,
    handleBookingTicket,
    cancelBooking,
};