const config = (process.env.NODE_ENV !== 'localhost') ?  require('./config.json') : require('./local-config.json') ;
console.log({env: process.env.NODE_ENV})
const framework = require('./internal/avian_framework');
const createError = require('http-errors');
const fs = require('fs');
const path = require('path');
const pathSecretKey = path.resolve('.', 'id_rsa');
config.accessTrusted.privateKey = fs.readFileSync(pathSecretKey).toString();
const express = require('express');
global.APP_CONFIG = config;
let app = express();
const {
  ConcertController,
  SeatTypeController,
} = require('./controllers');
const _ = require('lodash');
const sdk = require('./internal/avian_sdk');

async function main() {
  const appConfig = await framework.createApp(app, config, sdk);
  
  ConcertController.run(appConfig);
  SeatTypeController.run(appConfig);

  /** handle logic */
  appConfig.use(function (req, res, next) {
    next(createError(404));
  });
  const port = process.env.PORT || '3000';
  appConfig.start(port, () => {
    console.log(`Example app listening on port ${port}!`);
    console.log(`==> http://localhost:${port}`);
});
}

main();
