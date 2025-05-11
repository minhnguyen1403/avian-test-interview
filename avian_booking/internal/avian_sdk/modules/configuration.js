const Ajv = require('ajv');
const { ConfigSchema } = require('../schema');

const { NODE_ENV } = process.env;

const AVAILABLE_SERVICES = {
    AVIAN_CONCERT: 'avian_concert',
};

exports.AVAILABLE_SERVICES = AVAILABLE_SERVICES;

const CONFIG = {
    baseUrl: '',
    debug: false,
    services: []
};

exports.setConfig = function (config) {
    const ajv = new Ajv();
    const valid = ajv.validate(ConfigSchema.config, config);
    if (!valid) throw new Error(ajv.errorsText(ajv.errors));

    if (config.baseUrl) {
        CONFIG.baseUrl = config.baseUrl;
    }

    // CONFIG.baseUrl = 'http://localhost:3000'

    CONFIG.services = config.sdk.services || [];
    CONFIG.debug = config.debug || false;
    global.SDK_DEBUG = CONFIG.debug;
    return true;
};

exports.getConfig = function (key) {
    return CONFIG[`${key}`];
};

exports.getServicePublicKey = function (serviceName) {
    const service = CONFIG.services.find((service) => service.name === serviceName);
    if (service) {
        return service.publicKey;
    }

    return undefined;
};

exports.getUrl = function (serviceName) {
    const service = CONFIG.services.find((service) => service.name === serviceName);
    if (service)
        return service.url;
    return '';
}

exports.getAuthorization = function (serviceName) {
    const service = CONFIG.services.find((service) => service.name === serviceName);
    if (service)
        return service.authorization;
    return '';
}
