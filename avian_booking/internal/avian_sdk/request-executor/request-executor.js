const rp = require('request-promise');
const createError = require('http-errors');
const util = require('util');
// const { CacheProvider } = require('../cache');
const _ = require("lodash");

class RequestExecutor {

  constructor(targetObject, excludeAutoParse = [], loadFromCache) {
    this.targetObject = targetObject;
    this.excludeAutoParse = excludeAutoParse;
    this.loadFromCache = loadFromCache;
  }

  exec = async (builder) => {
    const options = builder.build();
    if (SDK_DEBUG) {
      console.log(options);
    }

    // if (builder.usingCache && this.loadFromCache) {
    //   // try to load data from cache
    //   if (global.REDIS_CLIENT === null) throw new Error('error_redis_client_not_found');
    //   const cacheProvider = new CacheProvider(global.REDIS_CLIENT);
    //   const result = await this.loadFromCache(options, cacheProvider);
    //   if (result) return this.parseResult(options, result, { useRaw: builder.useRaw });
    // }

    return rp(options).then(result => {
      return this.parseResult(options, result, { useRaw: builder.useRaw });
    }).catch(err => {
      if (SDK_DEBUG) console.log(err);

      if (err.statusCode && err.error && err.error.error) {
        throw createError(err.statusCode, _.isArray(err.error.error) ? err.error.error[0] : err.error.error, {msg: (err.error.message) ? err.error.message : ''});
      }

      throw err;
    });
  }

  parseResult = (options, result, { useRaw = false }) => {
    // for (let index = 0; index < this.excludeAutoParse.length; index++) {
    //   const endpoint = this.excludeAutoParse[index];
    //   if (options.uri.includes(endpoint)) return result;
    // }

    // if (useRaw) {
    //   return new this.targetObject(result);
    // }

    // if (result && result.items) {
    //   return result.items.map(item => new this.targetObject(item));
    // }

    return result;
  }
}

exports.RequestExecutor = RequestExecutor;