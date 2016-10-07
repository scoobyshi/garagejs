const winston = require('winston');
const logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ colorize:true, timestamp: function() { return (new Date()).toLocaleString(); } })
    ]
});
logger.level = process.env.LOG_LEVEL || 'info';

module.exports=logger;
