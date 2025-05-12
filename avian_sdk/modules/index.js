const { Seats } = require('./concerts');
const { Booking} = require('./booking');
const { setConfig, getConfig} = require('./configuration');
module.exports = {
    Seats,
    Booking,
    setConfig,
    getConfig,
}