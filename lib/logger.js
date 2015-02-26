/*****************************************************************************
 * logger.js
 */ 

var bunyan = require('bunyan');

var utils = require('./utils');
var SysError = require('../utils/syserror').SysError;

// Declaration internal name-space
var internals = {};


/**
 * setLogLevel
 *
 * Sets the level to all streams.
 * 
 * @todo - Figure out why this is not changing the the log level on run-time
 *
 * @static
 * 
 * @param {string} level - fatal | error | warn | info | debug | trace
 */
internals.setLogLevel = function(level)
{
    if (internals.loggerInstance)
    {
        internals.loggerInstance.level(level);
    }
};

/**
 * getLogLevel
 *
 * Gets the lowest level of all streams
 *
 * @static
 * 
 * @return {string} level - fatal | error | warn | info | debug | trace
 */
internals.getLogLevel = function()
{
    if (internals.loggerInstance)
    {
        return internals.loggerInstance.level();
    }
    return null;
};


/**
 * The singleton logger root instance
 * @type {Object}  The current implementation uses Bunyan
 */
internals.loggerInstance = null;

/***************************************************************************
 * Gets the logger.
 *
 * It uses the global config information to create a singleton root logger.
 * Once the root logger instance is crated, subsequent call to this function
 * will return a child (nested) logger with the componentName.
 * 
 * The current implementation uses Bunyan, and expects the log configuration
 * as follows:
 *
 * log: {
 *     level: <default_level>
 *     name: <root log name, e.g. BrixApp>
 *     streams: [
 *         {
 *             level: <'warn'|info'|'debug'|'trace'>
 *             output: <'file' | 'stderr'| 'stdout'>
 *             <if_output:'file'>
 *                 type: 'rotating-file'
 *                 path: <file path>
 *                 period: <'1d'>
 *                 count: <num of files to keep>
 *             </if_output>
 *         }
 *     ]
 * }
 *
 * 
 *
 * @param {String} componentName
 *        The name of the component which will serve as log entry label.
 *
 * @return {Logger} The child logger
 *
 ****************************************************************************/
internals.getLogger = function(componentName)
{
    // Create the singleton instance for the first time.
    if (internals.loggerInstance === null)
    {
        // Parse out the log config and create streams:
        var logConfig = utils.getConfigProperty('log');

        var defaultLevel = (logConfig.level) ? logConfig.level : 'info';
        var logStreams = [];

        logConfig.streams.forEach(function(element, index, array) {
            var logLevel = element.level || defaultLevel;

            if (element.output === 'file')
            {
                // @todo: If you specify a directory within your config that does not 
                // yet exist the app will throw an error...fix that.
                var logDir = (element.logDir) ? element.logDir : './';
                if (logDir.match('/$') != '/') {
                    logDir = logDir+ '/';
                }

                logStreams.push(
                {
                    level: logLevel,
                    type: element.type || 'rotating-file', // Defaults to rotating file
                    path: logDir + logConfig.name + '.log',
                    period: element.period || '1d', // Defaults to daily rotation
                    count: element.count || 10 // defaults to 10 files back-copy window
                });
            }

            else if (element.output === 'stderr' || element.output === 'stdout')
            {
                logStreams.push(
                {
                    level: logLevel,
                    stream: process[element.output]
                });
            }

            // Possibly add other output types such as logstash

            else
            {
                console.log('Logger warning: unrecognized configuration value log.streams[' + index + '].type');
            }

        });

    
        if (logStreams.length === 0 )
        {
            var errorMessage = 'Logger warning: no stream attached to the logger!';
            console.log(errorMessage);
            throw Error(errorMessage);
        }
        
        // Create the root logger instance with the streams configured above
        internals.loggerInstance = bunyan.createLogger({
            name:logConfig.name,
            level: defaultLevel,
            streams: logStreams
        });
    }

    // Create a child logger with the componentName and return it
    
    var childInfo = {
        component: componentName
    };
    if (config.app_version)
    {
        childInfo.app_version = config.app_version;
    }

    var logger = internals.loggerInstance.child(childInfo);

    return logger;
};

/**
 * logError
 *
 * @todo - it would be more intuitive if we encapsulate the bunyan's logger
 *         in a wrapper class, and call logError in that class.
 *
 * Logs an error object.
 * If the error is instance of Error, it logs the stack property.
 * If the error object is instance of SysError it
 * 1. checks that the error has not been logged yet.
 * 2. HTTP status below 500 are logged as warning,
 *    500 or above are logged as error
 * 3. Mark error object as logged by setting _logged property to true 
 *
 * @static
 * 
 * @param {logger} logger  - the logger to log
 * @param {Error|SysError} error  - the error to log
 * @param {?string} logMessage    - The message that is written to log
 * @param {?Object} extraLogData  - The data object that is written to log
 */
internals.logError = function(logger, error, logMessage, extraLogData)
{
    var logData = extraLogData || {};

    if (error instanceof Error)
    {
        logData.error = error.stack;

        if (!logMessage)
        {
            logMessage = error.toString();
        }
        logger.error(logData, logMessage);
    }
    else if (error instanceof SysError)
    {
        if (error._logged !== true)
        {
            logData.error = error;

            if (!logMessage)
            {
                logMessage = error.message;
            }
            if (error.status < 500)
            {
                logger.warn(logData, logMessage);
            }
            else
            {
                logger.error(logData, logMessage);
            }
            error._logged = true;
        }
    }
};



/** Expose public classes and static methods of this module **/

// Export setLogLevel 
module.exports.setLogLevel = internals.setLogLevel;

// Export getLogLevel 
module.exports.getLogLevel = internals.getLogLevel;

// Export getLogger 
module.exports.getLogger = internals.getLogger;

// Export logError 
module.exports.logError = internals.logError;
