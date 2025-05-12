let ioredis;
let redis = require("redis")
try {
    ioredis = require("ioredis")
} catch (error) { }
exports.createClient = async function (config) {
    const client = await redis.createClient({
        url: `redis://${config.HOST}:${config.PORT}`
    }).on('error', err => console.log('Redis Client Error', err))
        .connect();
    client.on('connect', () => {
        console.log('Redis connected (TCP level)');
    });

    client.on('ready', () => {
        console.log('Redis ready (commands can be sent)');
    });

    client.on('error', (err) => {
        console.error('Redis error:', err);
    });

    client.on('end', () => {
        console.warn('Redis connection closed');
    });
    return client;


};

exports.CacheProvider = require('./cache-provider');
