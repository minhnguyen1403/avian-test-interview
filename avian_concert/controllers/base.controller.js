const createError = require('http-errors');
const tracer = require('../internal/avian_framework/jaeger-handle/tracer');
const RequestBuilder = require('../middlewares/request-builder').RequestBuilder;
const ACCESS_TRUSTED_HEADER = 'Avian-Access-Trusted';
const _ = require('lodash');
/**
 * All service's controller must be extended from this
 * controller.
 */
class BaseController {
        constructor(req, res, next) {
            this.method = req.method;
            this.ip = req.ip;
            this.isTrusted = req.isTrusted || false;
            // this.pusher = Pusher;
            // this.rbac = _.cloneDeep(req._rbac);
            this.loggedUser = _.cloneDeep(req.loggedUser);
            this.query = _.cloneDeep(req.query || {});
            // this.params = _.cloneDeep(req.params || {});
            // this.body = _.cloneDeep(req.body || {});
            // this.span = _.cloneDeep(req.span);

            this.ctrlName = this.constructor.name.split('Controller')[0];
            this.limit = 10;
            this.skip = 0;

            if (this.method === 'GET') {
                this.limit = parseInt(this.query.limit || 10);
                this.skip = parseInt(this.query.skip || 0);
                this.sort_type = parseInt(this.query.sort_type || -1);
                this.sort_by = this.query.sort_by || 'modified_at';
                this.sort_type = -1;
            }

            // this.queueProvider = new QueueProvider(QUEUE_CHANNEL);

            // if (REDIS_CLIENT)
            //     this.cacheProvider = new CacheProvider(REDIS_CLIENT);
            // if (!APP_CONFIG.SKIP_VALIDATE_USER_ID) this._validateUserId(req);
    }
    static middlewares(fn) {
        return [];
    };
    static handler(fn) {
        const middlewares = this.middlewares(fn);
        return [
            //authorized(APP_CONFIG.jwt),
            middlewares,
            (req, res, next) => {
                const controller = new this(req, res, next);
                if (controller[fn].constructor.name === 'AsyncFunction') {
                    controller[fn](req, res, next).catch(next);
                } else {
                    controller[fn](req, res, next);
                }
            }
        ];
    };

    createTracingHeader() {
        const tracingHeaders = {};
        tracer.inject(this.span.context(), FORMAT_HTTP_HEADERS, tracingHeaders);
        return tracingHeaders;
    }

    // Create request builder instance
    reqBuilder = () => {
        return new RequestBuilder().withHeaders(this.createTracingHeader());
    };

    trustedReqBuilder(key) {
        const headers = {};
        headers[ACCESS_TRUSTED_HEADER] = key;
        return this.reqBuilder().withHeaders(headers);
    }
    /**
     * Children controller must implement
     * this method to routing request.
     *
     * @param {Object} app Express server instance
     */
    static run(app) { };
}

module.exports = BaseController;
