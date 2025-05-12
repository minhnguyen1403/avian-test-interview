const redis = require('redis');
const { promisify } = require("util");

class CacheProvider {

    /**
     * @constructor
     * 
     * @param {redis.RedisClient} client 
     */
    constructor(client) {
        this.client = client;
        this.setAsync = promisify(client.set).bind(client);
        this.getAsync = promisify(client.get).bind(client);
        this.delAsync = promisify(client.del).bind(client);
        this.expireAsync = promisify(client.expire).bind(client);
        this.expireAtAsync = promisify(client.expireAt).bind(client);
        this.getKeys = promisify(client.keys).bind(client);
        this.mgetAsync = promisify(client.mGet).bind(client);
        this.msetAsync = promisify(client.mSet).bind(client);
    }

    /**
     * Set expire in seconds for key
     * 
     * @param {string} key 
     * @param {number} seconds time to expire in seconds
     */
    async expire(key, seconds) {
        return await this.expireAsync(key, seconds);
    }

    /**
     * Set expire time for key
     * 
     * @param {string} key 
     * @param {number} timestamp 
     */
    async expireAt(key, timestamp) {
        return await this.expireAtAsync(key, timestamp);
    }

    /**
     * Set value to cache by key
     * 
     * @param {string} key 
     * @param {string | Object} value 
     * @param {number | null} seconds time to expire in seconds
     * 
     */
    async set(key, value, seconds = null) {
        let result;
        if (typeof value === 'string') {
            result = await this.setAsync(key, value);
        } else {
            const jsonString = JSON.stringify(value);
            result = await this.setAsync(key, jsonString);
        }

        if (seconds && seconds > 0) await this.expire(key, seconds);

        return result;
    }


    /**
     * Get value from cache by key
     * 
     * @param {string} key 
     * 
     * @returns {string | Object}
     */
    async get(key) {
        const value = await this.getAsync(key);

        try {
            // try to parse string to json
            return JSON.parse(value);
        } catch (error) {
            // plain string
            return value;
        }
    }

    /**
     * Get multiple values from cache by list keys
     * 
     * @param {Array<string>} keys
     * 
     * @returns {string | Object}
     */
    async getMultiple(keys = []) {
        const value = await this.mgetAsync(keys);

        try {
            // try to parse string to json
            return JSON.parse(value);
        } catch (error) {
            // plain string
            return value;
        }
    }

    /**
     * set multiple values to cache by list keys
     * 
     * @param {Array<string>} keys
     * @param {Array<string>} values
     * 
     * @returns {string | Object}
     */
    async setMultiple(keys = [], values = []) {
        const merged = [];
        for (var i = 0; i < keys.length; i++) {
            merged.push(keys[i]);
            merged.push(JSON.stringify(values[i]));
        }
        await this.msetAsync(merged);
    }

    /**
     * Delete cache by key
     * @param {string} key 
     */
    async del(key) {
        return await this.delAsync(key);
    }
}

module.exports = CacheProvider;