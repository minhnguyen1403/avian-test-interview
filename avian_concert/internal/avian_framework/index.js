const config = (process.env.NODE_ENV !== 'localhost') ?  require('../../config.json') : require('../../local-config.json') ;
const Models = require('./models');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
var cookieParser = require('cookie-parser');
const logger = require('morgan');
const bodyParser = require('body-parser');
const http = require('http');
global.APP_CONFIG = config;
const Tracing = require('./jaeger-handle/tracing')
let app = express();
let server = http.createServer(app);
const { redisClient } = require('./redis')
const { clientErrorHandler, logError, renderErrorHandler } = require('./middlewares/error-handler');
const { SysLogLogger } = require('./logger/syslog.logger')
const addRequestId = require('express-request-id')();
const {createNamespace} = require('cls-hooked');
const _ = require('lodash');
const syslogMiddleware = require('./logger/syslog.logger').config;
const { expressLoggerMiddleware, Logger, LoggerDB } = require('./logger/index');

const Middlewares = require('./middlewares/index');
const Authenticate = Middlewares.Authenticate;
const jwtMiddleware = Authenticate.jwtMiddleware;
const accessTrustedMiddleware = Authenticate.accessTrustedMiddleware;


async function createApp(app, config){
  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  app.use(addRequestId);

  app.use(Tracing.tracing());

  const namespace = createNamespace('request');
  global.namespace = namespace;
  app.use((req, res, next) => {
    namespace.run(() => {
      namespace.set('span', _.cloneDeep(req.span));
      next();
    });
  });

  global.syslogLogger = SysLogLogger;
  global.logger = Logger;
  global.loggerDB = LoggerDB;

  app.use(expressLoggerMiddleware);
  app.use(syslogMiddleware(config.log || {}));

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, PATCH, HEAD',
      );
      return res.status(200).json({});
    }

    // Allow get filename
    res.header('Access-Control-Expose-Headers', 'Content-Disposition');
    return next();
  });

  // Json parser middleware
  app.use(bodyParser.json({ limit: '10mb' }));

  // Url encoded parser middleware
  app.use(bodyParser.urlencoded({ extended: false }));

  // authen
  // Access trusted authen middleware
  app.use(accessTrustedMiddleware(config.accessTrusted));
   // JWT Authen middleware
  app.use(jwtMiddleware(config));

  if (config.REDIS){
    console.log('start connecting REDIS ...');
    global.redisClient = await redisClient(config.REDIS);
    console.log('connect REDIS successfully');
  }
  if(config.MONGODB){
    await Models.connectDB(config.MONGODB);
    console.log('connect DB successfully');
  }

  // if(config.CONSUL){
  //   await require('./internal/consul-client').createConnection({ config: config });
  // }

  // catch 404 and forward to error handler


  // error handler
  // app.use(function (err, req, res, next) {
  //   // set locals, only providing error in development
  //   res.locals.message = err.message;
  //   res.locals.error = req.app.get('env') === 'development' ? err : {};
  //   // render the error page
  //   res.status(err.status || 500);
  //   res.render('error');
  // });
  app.start = function(port, callback){
      // error handler
    app.use(logError);
    app.use(clientErrorHandler);
    app.use(renderErrorHandler);
    
    server.keepAliveTimeout = 65000;
    server.headersTimeout =  66000;
    server.setTimeout( 10 * 60 * 1000);
    server = app.listen(port, callback);
  }
  return app;

}

module.exports = {
  createApp
};