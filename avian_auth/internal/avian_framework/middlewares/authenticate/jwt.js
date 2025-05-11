const createError = require('http-errors');
const JwtHelper = require('../../helpers').jwtHelper;
const _ = require('lodash')
// const { CacheProvider } = require('../../cache');

/**
 *
 * @param {string} secret jwt secret key
 */
function JwtAuthenticate(secret, whitelistEndpoints = [], whitelistIps = []) {
  this.secret = secret;
  this.whitelistEndpoints = whitelistEndpoints;
  this.whitelistIps = whitelistIps;

  // if (REDIS_CLIENT) {
  //   this.cacheProvider = new CacheProvider(REDIS_CLIENT);
  // }
}

/**
 *
 */
JwtAuthenticate.prototype.handle = async function (req, res, next) {
  const isTrusted = req.isTrusted || false;

  if (isTrusted && req.header('Authorization') && req.header('Authorization').split(' ').length > 0){
    try{
      const _jwt = req.header('Authorization').split(' ')[1];  
      const { user } = await JwtHelper.verify(this.secret, _jwt);
      req.loggedUser = user;
    }catch(err){
      next(err)
    }
  }

  if (isTrusted) return next();

  // White list by path and method
  const reqPath = req.path;
  const reqMethod = req.method;
  for (let index = 0; index < this.whitelistEndpoints.length; index++) {
    const endpoint = this.whitelistEndpoints[index];
    const regexEndpointPath = new RegExp(endpoint.path);
    const allowedPath = regexEndpointPath.test(reqPath);
    const allowedMethod =
      reqMethod.toLocaleLowerCase() ===
      `${endpoint.method}`.toLocaleLowerCase();
    if (allowedMethod && allowedPath) return next();
  }

  // White list ip
  const reqIp = req.ip;
  for (let index = 0; index < this.whitelistIps.length; index++) {
    const ip = this.whitelistIps[index];
    const regexIp = new RegExp(ip);
    if (regexIp.test(reqIp)) return next();
  }

  if (!req.header('Authorization')) return next(createError.Unauthorized('error_unauthorized'));

  const auth = req.header('Authorization').split(' ');
  if (auth[0] !== 'Bearer' || !auth[1]) return next(createError.Unauthorized('error_jwt_invalid')) ;  
  const jwt = auth[1];

  if (this.cacheProvider) {
    const cacheKey = `USER:TOKEN:BL:${jwt}`;
    const isBlocked = await this.cacheProvider.get(cacheKey);
    if (isBlocked) return next(createError.Unauthorized('error_unauthorized'));
  }

  JwtHelper.verify(this.secret, jwt)
    .then(decoded => {
      req.loggedUser = decoded.user;      
      next();
    })
    .catch(() => {
      next(createError.Unauthorized('error_jwt_invalid'));
    });
};

/**
 * Factory method to create instance of jwt authentication class
 * then return function to handle middleware callback
 */
exports.jwtMiddleware = function (config) {
  const endpoints = _.get(config, 'endpoints', []).concat([
    { method: 'get', path: '/favicon.ico' },
    { method: 'get', path: '/health/ping' },
    { method: 'post', path: '/users/login' }
  ]);

  const jwtAuthen = new JwtAuthenticate(
    config.jwt_secret,
    endpoints,
    config.ips,
  );

  return jwtAuthen.handle.bind(jwtAuthen);
}
