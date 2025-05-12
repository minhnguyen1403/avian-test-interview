const createError = require('http-errors');
const sshpk = require('sshpk');
const ACCESS_TRUSTED_HEADER = 'Avian-Access-Trusted';



function AccessTrustedAuthenticate(privateKey, endpoints = []) {
  try {
    this.privateKey = sshpk.parsePrivateKey(privateKey, 'pem');
    this.endpoints = endpoints;
  } catch (error) {
    throw error;
  }
}

AccessTrustedAuthenticate.prototype.handle = function (req, res, next) {
  const trustedKey = req.get(ACCESS_TRUSTED_HEADER);

  if (trustedKey) {
    try {
      const data = 'some data';

      /* Sign some data with the key */
      const s = this.privateKey.createSign('sha1');
      s.update(data);
      const signature = s.sign();

      /* Now load the public key (could also use just key.toPublic()) */
      const keyPub = trustedKey;
      const key = sshpk.parseKey(keyPub, 'ssh');

      /* Make a crypto.Verifier with this key */
      const v = key.createVerify('sha1');
      v.update(data);
      const valid = v.verify(signature);

      req.isTrusted = valid;
    } catch (error) {
      logger.error(`Cannot parse key`, error);
    }
  }  

  const required = this.endpoints.findIndex(e => new RegExp(e.path).test(req.path) && e.method.toUpperCase() === req.method) !== -1;
  if (!req.isTrusted && required)
    return next(createError.Unauthorized('error_unauthorized'));

  next();
};

exports.accessTrustedMiddleware = function (config) {
  const accessTrustedAuthen = new AccessTrustedAuthenticate(config.privateKey, config.endpoints);
  return accessTrustedAuthen.handle.bind(accessTrustedAuthen);
};
