var childProc = require('child_process');
var bunyan = require('bunyan');
//var lodash = require('lodash');

var internals = {};

module.exports.endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/***************************************************************************
 * The class StopwatchLog records in log the start and stop time.
 * It can be used to measure the time a process took, for example a remote 
 * invocation.
 * 
 * @param {Object} logger      The reference to the logger object,
 * @param {Object} timedThing  Name of the thing that is timed. This will
 *                             be printed in the log
 ****************************************************************************/
module.exports.StopwatchLog = function(logger, timedThing) {

    this.logger = logger;
    this.timedThing = timedThing;
    this.startTime = new Date();

    /***************************************************************************
     *
     * Timestamps the start time, and logs messaging saying that timing has 
     * started.
     * 
     * @param  {Object} payload      Object to be printed in the log for informational purpose.
     * @param  {string} extraMessage Additional message. Optional.
     */
    this.start = function(payload, extraMessage)
    {
        var logMessage = 'Before ' + timedThing + (extraMessage ? (' ' + extraMessage) : '');
        var logPayload = {
            timedThing: timedThing
        };
        if (payload) {
            logPayload['data'] = payload;
        }
        this.startTime = new Date().getTime();
        logger.trace(logPayload, logMessage);
    };

    /**
     * Logs a message with the elapsed time in millisecond.
     * 
     * @param  {Object} payload      Object to be printed in the log for informational purpose.
     * @param  {string} extraMessage Additional message. Optional.
     */
    this.stop = function(payload, extraMessage)
    {
        var logMessage = 'After ' + timedThing + (extraMessage ? (' ' + extraMessage) : '');
        var elapsedMs = (new Date()).getTime() - this.startTime;
        var logPayload = {
            timedThing: timedThing,
            elapsedMs: elapsedMs
        };
        if (payload) {
            logPayload['data'] = payload;
        }

        if (elapsedMs < 1000) {
            logger.debug(logPayload, logMessage);
        } else {
            // If it takes more than a second, then log it as warning
            logger.warn(logPayload, logMessage);
        }
    };
};

global.rootLogger = null;

/***************************************************************************
 * Gets the logger.
 * If the config argument contains the logger field, then a child logger is
 * created and returned. Otherwise a new bunyan logger is created.
 * @todo - Refactor getLogger and place it in a wrapper singleton class
 *         so we can access file, change level, etc.
 *  
 *
 * @param {Object} config        The configuration object that may contain the
 *                               logger field.
 * @param {String} componentName The name of the component.
 *
 * @return {Logger} The reference to the newly created logger
 *
 ****************************************************************************/
module.exports.getLogger = function(componentName, config) {
    var logger = null;
    if (global.rootLogger)
    {
        logger = global.rootLogger.child({component: componentName});
    }
    else
    {
        // This condition means that the function was called either for by the 
        // main application or in context of unit test testing
        var logLevel = (config.level) ? config.level : 'info';

        // @todo: If you specify a directory within your config that does not 
        // yet exist the app will throw an error...fix that.
        var logDir = (config.dir) ? config.dir : './';
        if (logDir.match('/$') != '/') {
            logDir = logDir+ '/';
        }
                
        var logStreams = [];
        if (config.logToFile)
        {
            logStreams.push(
            {
                level: config.logLevel,
                type: 'rotating-file',
                path: logDir + componentName + '.log',
                period: '1d',   // daily rotation
                count: 30       // keep 30 back copies
            });
        }
        if (config.logToScreen)
        {
            logStreams.push(
            {
                level: config.level,
                stream: process.stderr
            });
        }
        global.rootLogger = bunyan.createLogger({
            name: componentName,
            level: config.level,
            streams: logStreams
        });

        logger = global.rootLogger;
    }
    return logger;
};


/**
 * onclose {function(err, data)} The callback function
 */
module.exports.runCommandLine = function(cwd, command, argList, onclose){
    if (!module.exports.endsWith(cwd, '/')) {
        cwd += '/';
    }
    
    var spawnOpts = {
            cwd: cwd,
            env: process.env
        }
    var spawned = childProc.spawn(command, argList, spawnOpts);
    var stdout = '', 
        stderr = '';
    spawned.stdout.on('data', function(data){
        stdout += data;
    });
    spawned.stderr.on('data', function(data){
        stderr += data;
    });
    spawned.on('close', function(code){
        var error = null;
        if (code !== 0) {
            error = 'Error code ' + code;
        }
        stdout = stdout.split("\n");
        stderr = stderr.split("\n");
        onclose(error, {stdout: stdout, stderr: stderr} );
    });
}
