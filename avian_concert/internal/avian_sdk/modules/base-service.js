const { RequestBuilder } = require('../request-builder');
const { RequestExecutor } = require('../request-executor');
const { getServicePublicKey, getConfig, getUrl, getAuthorization } = require('./configuration');
const { SharedSchema } = require('../schema');
const Ajv = require('ajv');
// const tracer = require('../tracer');
const { FORMAT_HTTP_HEADERS } = require('opentracing');
const { getNamespace } = require('cls-hooked');
const _ = require('lodash');
/**
 * All service class must extend from this class.
 * This class is responsible for constructing all request
 */
class BaseService {

  /**
   * @constructor
   * Constructor function for this class
   *
   * @param {Object | string} data object's id or object content
   */
  constructor(data) {
    if (data) {
      if (typeof data != 'string') {
        this.fillData(data);
      } else {
        this.id = data;
      }
    }
  }

  /**
   * Child class must implement this function to provide service's name
   * @returns {string}
   */
  static version() { return "" }

  /**
   * Child class must implement this function to provide service's name
   * @returns {string}
   */
  static serviceName() { return "" }

  /**
   * Child class must implement this function to provide service's endpoint
   * @returns {string}
   */
  static endpoint() { return "" }

  /**
   * This function is used to config which request builder will be used
   * Child class can leave this function.
   *
   * @returns {RequestBuilder}
   */
  static requestBuilder() { return RequestBuilder }

  /**
   * This function is used to config request executor.
   * child class can leave this function.
   */
  static requestExecutor() {
    const excludeAutoParse = this.excludeAutoParse();
    const executor = new RequestExecutor(this, excludeAutoParse, this.loadFromCache.bind(this));
    return executor;
  }

  /**
   * Service will auto parsing from json to object using item
   * and item keys in response by default.
   *
   * Override this function to return which endpoint will not
   * auto parsing
   */
  static excludeAutoParse() { return []; }


  static async loadFromCache(options, cacheProvider) {
    return null;
  };

  /**
   * Helper function to validate input
   *
   * @param {Object} schema schema to validate
   */
  static validate(schema, data) {
    const ajv = new Ajv({
      allErrors: true,
      useDefaults: true,
    });

    const isValid = ajv.validate(schema, data);
    if (!isValid) throw new Error(ajv.errorsText(ajv.errors));
  }

  /**
   * This function will build request with basic informations.
   *
   * @param {string | null} jwt user's jwt
   * @returns {RequestBuilder} builder
   */
  static baseReqBuilder(jwt = null) {
    const headers = {};

    const publicKey = getServicePublicKey(this.serviceName());

    if (publicKey) { // have public key
      if (this._disableAccessTrusted && this._disableAccessTrusted === true) {
      } else {
        headers['Avian-Access-Trusted'] = publicKey
      }
    }

    if (jwt) {
      headers.Authorization = jwt
    }

    const opts = {
      url: getUrl(this.serviceName()),
      authorization: getAuthorization(this.serviceName())
    }

    if (opts.authorization != '' && _.isEmpty(headers.Authorization))
      headers.Authorization = opts.authorization;

    // headers['Content-Type'] = 'application/json';
    const namespace = getNamespace('request');
    if (namespace) {
      const span = namespace.get('span');
      //if (span)
        // tracer.inject(span.context(), FORMAT_HTTP_HEADERS, headers);
    }    

    const baseUrl =  (opts && opts.url) ? opts.url : getConfig('baseUrl');
    const RequestBuilderClass = this.requestBuilder();
    const reqExecutor = this.requestExecutor();
    return (new RequestBuilderClass(baseUrl))
      .withVersion(this.version())
      .withPath(this.endpoint())
      .withHeaders(headers)
      .withReqExecutor(reqExecutor);
  }

  static disableAccessTrusted(disable = true) {
    this._disableAccessTrusted = disable;
  };

  /**
   * Child class MUST implement this function to
   * fill data to class
   *
   * @param {Object} data object's content
   */
  fillData(data) {
    this.id = data.id || data._id;
    this.created_at = data.created_at;
    this.modified_at = data.modified_at;
  }

  /**
   * Child class MUST implement this function to
   * export data which will be used in create or update request
   */
  exportData() { }

  /**
   * Build get list request
   *
   * @param {string | null} jwt user's jwt
   *
   * @returns {RequestBuilder} builder
   */
  static getList(jwt = null) {
    return this.baseReqBuilder(jwt)
      .makeGET();
  }

  /**
   * Build get detail request
   *
   * @param {string | null} jwt user's jwt
   *
   * @returns {RequestBuilder} builder
   */
  static getDetail(id, jwt = null) {
    this.validate(SharedSchema.mongoObjectId, id);

    return this.baseReqBuilder(jwt)
      .withPath(`${id}`)
      .makeGET();
  }

  /**
   * Build create request
   *
   * @param {Object} data object's content
   * @param {string | null} jwt user's jwt
   *
   * @returns {RequestBuilder} builder
   */
  static create(data, jwt = null) {
    return this.baseReqBuilder(jwt)
      .makePOST(data);
  }

  /**
   * Build update request
   *
   * @param {string} id object's id
   * @param {Object} data object's content
   * @param {string | null} jwt user's jwt
   *
   * @returns {RequestBuilder} builder
   */
  static update(id, data, jwt = null) {
    this.validate(SharedSchema.mongoObjectId, id);

    return this.baseReqBuilder(jwt)
      .withPath(`${id}`)
      .makePUT(data);
  }

  /**
   * Build update request to update apart of object
   *
   * @param {string} id object's id
   * @param {Object} data object's content
   * @param {string | null} jwt user's jwt
   *
   * @returns {RequestBuilder} builder
   */
  static updateProperties(id, data, jwt = null) {
    this.validate(SharedSchema.mongoObjectId, id);

    return this.baseReqBuilder(jwt)
      .withPath(`${id}`)
      .makePATCH(data);
  }

  /**
   * Build delete request
   *
   * @param {string} id object's id
   * @param {string | null} jwt user's jwt
   *
   * @returns {RequestBuilder} builder
   */
  static delete(id, deleted_by, jwt = null) {
    this.validate(SharedSchema.mongoObjectId, id);

    return this.baseReqBuilder(jwt)
      .withPath(`${id}`)
      .withBody({ deleted_by })
      .makeDELETE();
  }

  /**
   * Create or update object to server
   *
   * @param {string | null} jwt json web token
   */
  save(jwt) {
    const data = this.exportData();
    const constructor = this.constructor;
    const createBuilder = () => {
      if (this.id) {
        return constructor.update(this.id, data, jwt);
      } else {
        return constructor.create(data, jwt);
      }
    };

    return createBuilder().then(newObject => {
      this.fillData(newObject);
      return this;
    });
  }

  /**
   * Load object from server
   *
   * @param {string | null} jwt json web token
   */
  load(jwt = null) {
    return this.constructor.getDetail(this.id, jwt).then(newObject => {
      this.fillData(newObject);
      return this;
    });
  }

  /**
   * Delete object
   *
   * @param {string | null} jwt json web token
   */
  delete(jwt = null) {
    return this.constructor.delete(this.id, jwt).exec();
  }
}

exports.BaseService = BaseService;
