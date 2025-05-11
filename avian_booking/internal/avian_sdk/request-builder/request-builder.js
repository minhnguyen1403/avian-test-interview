const URL = require('url').URL;
const Path = require('path');
const fs = require('fs');

/**
 * Http request builder
 * this object will contruct request object
 *
 * Constructor function
 *
 * @param {string} baseUrl request host name  
 */
function RequestBuilder(baseUrl) {
    if (!baseUrl) {
        throw new Error('error_invalid_base_url');
    }

    this.baseUrl = baseUrl;
    this.json = true;
    this.path = '';
    this.version = '';
    this.headers = {
        'kdb-request-source': process.env.APP_NAME
    };
    this.qs = {};
    this.body = {};
    this.form = {};
    this.formData = {};
    this.executor = null;
    this.usingCache = false;
    this.useRaw = false;
    this.useEncoding = false;
}

// RequestBuilder.prototype = Object.create({});
// RequestBuilder.prototype.constructor = RequestBuilder;


/**
 * Make a GET request
 *
 * @param {Object} qs request' query string
 */
RequestBuilder.prototype.makeGET = function (qs = null) {
    this.method = 'GET';
    if (qs) {
        return this.withQueryString(qs);
    }

    return this;
};


/**
 * Make POST request
 *
 * @param {Object} body request's body
 */
RequestBuilder.prototype.makePOST = function (body = null) {
    this.method = 'POST';
    if (body) {
        return this.withBody(body);
    }
    return this;
};


/**
 * Make PUT request
 *
 * @param {Object} body request's body
 */
RequestBuilder.prototype.makePUT = function (body = null) {
    this.method = 'PUT';
    if (body) {
        return this.withBody(body);
    }
    return this;
};

/**
 * Make PATCH request
 *
 * @param {Object} body request's body
 */
RequestBuilder.prototype.makePATCH = function (body = null) {
    this.method = 'PATCH';
    if (body) {
        return this.withBody(body);
    }
    return this;
};


/**
 * Make DELETE request
 *
 * @param {Object} body request's body
 */
RequestBuilder.prototype.makeDELETE = function (body = null) {
    this.method = 'DELETE';
    if (body) {
        return this.withBody(body);
    }
    return this;
};


RequestBuilder.prototype.withFullResponse = function () {
    this.resolveWithFullResponse = true;
    this.simple = false;
    return this;
};


RequestBuilder.prototype.simpleResponse = function () {
    this.resolveWithFullResponse = false;
    this.simple = true;
    return this;
};

RequestBuilder.prototype.withEncoding = function (encoding) {
    this.encoding = encoding;
    this.useEncoding = true;
    return this;
};

/**
 * This version will add to request's pathname
 * when build function called
 *
 * @param {string} version api version
 */
RequestBuilder.prototype.withVersion = function (version) {
    this.version = version;
    return this;
};


/**
 * This function can be call multiple time
 * to append path to full path
 *
 * @param {string} path path
 */
RequestBuilder.prototype.withPath = function (path) {
    let newPath = Path.join(this.path, path);
    newPath = Path.normalize(newPath);
    this.path = newPath;
    return this;
};

RequestBuilder.prototype.withFormData = function (key, value) {
    const formData = {};
    formData[key] = typeof(value) =='object' ? JSON.stringify(value) : value;
    this.formData = Object.assign(this.formData, formData);
    return this;
};

RequestBuilder.prototype.withResponseBinary = function () {
    this.formData = Object.assign(this.encoding, null);
    return this;
};

RequestBuilder.prototype.withForm = function (form) {
    this.form = Object.assign(this.form, form);
    return this;
};


RequestBuilder.prototype.withBody = function (body) {
    this.body = Object.assign(this.body, body);
    return this;
};

RequestBuilder.prototype.withBodyIntegration = function (body) {
    this.body = body;
    return this;
};


RequestBuilder.prototype.withQueryString = function (qs) {
    this.qs = Object.assign(this.qs, qs);
    return this;
};


RequestBuilder.prototype.willTimeoutIn = function (timeout) {
    this.timeout = timeout;
    return this;
};

RequestBuilder.prototype.willRawData = function (useRaw) {
    this.useRaw = useRaw;
    return this;
};


RequestBuilder.prototype.withFileUpload = function (keyName, path, filename, contentType = null) {
    this.formData[keyName] = {
        value: fs.createReadStream(path),
        options: {
            filename: filename,
            contentType: contentType,
        }
    };
    return this;
};

RequestBuilder.prototype.withFileUploadByBuffer = function (keyName, buffer, filename) {
    this.formData[keyName] = {
        value: buffer,
        options: {
            filename: filename
        }
    };
    return this;
};


/**
 * Use this function to add custom header
 *
 * @param {Object} headers request's header
 * @returns {RequestBuilder}
 */
RequestBuilder.prototype.withHeaders = function (headers) {
    this.headers = Object.assign(this.headers, headers);
    return this;
};

RequestBuilder.prototype.page = function (page) {
    this._page = page;
    return this;
};

RequestBuilder.prototype.limit = function (limit) {
    this._limit = limit;
    return this;
};

RequestBuilder.prototype.sortBy = function (sortBy = 'dateCreated') {
    this._sortBy = sortBy;
    return this;
};

RequestBuilder.prototype.sortType = function (sortType = 'desc') {
    this._sortType = sortType;
    return this;
};

RequestBuilder.prototype.enableCache = function (enable = true) {
    this.usingCache = enable;
    return this;
};


/**
 * This function will return full request object
 * from multiple part of this class
 */
RequestBuilder.prototype.build = function () {
    if (!this.method) {
        throw new Error('error_invalid_method');
    }

    const url = new URL(this.baseUrl);

    let pathname = Path.join(this.version, this.path);
    pathname = Path.normalize(pathname);
    url.pathname = pathname;

    const options = {
        uri: url.href,
        method: this.method,
        json: this.json,
    };

    if (this.headers) {
        options.headers = this.headers;
    }

    if (Object.keys(this.body).length !== 0) {
        options.body = this.body;
    }

    if (Object.keys(this.qs).length !== 0) {
        options.qs = this.qs;
    }

    if (Object.keys(this.form).length !== 0) {
        options.form = this.form;
    }

    if (Object.keys(this.formData).length !== 0) {
        options.formData = this.formData;
    }

    if (this.resolveWithFullResponse !== undefined && this.resolveWithFullResponse !== null) {
        options.resolveWithFullResponse = this.resolveWithFullResponse;
        options.simple = this.simple;
    }

    if (this.timeout) {
        options.timeout = this.timeout;
    }

    if (this.useEncoding) {
        options.encoding = this.encoding;
    }

    return options;
};

/**
 * Add request executor
 * 
 * @returns {RequestBuilder}
 */
RequestBuilder.prototype.withReqExecutor = function (executor) {
    this.executor = executor;
    return this;
};

/**
 * Executes this query and returns a promise
 * @returns {Promise}
 */
RequestBuilder.prototype.exec = function () {
    return this.executor.exec(this);
};

/**
 * Executes this query and returns a promise
 * 
 * @param {function} handler callback handler
 * 
 * @returns {Promise}
 */
RequestBuilder.prototype.then = function (handler) {
    return this.exec().then(handler);
};

exports.RequestBuilder = RequestBuilder;
