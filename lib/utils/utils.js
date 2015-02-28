var nconf = require('nconf');
var childProc = require('child_process');
var bunyan = require('bunyan');
//var lodash = require('lodash');

var internals = {};

module.exports.endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};
module.exports.startsWith = function(str, prefix, position) {
    position = position || 0;
    return str.lastIndexOf(prefix, position) === position;
};

module.exports.getConfigProperty = function(key)
{
    return nconf.get(key);
};

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

        if (elapsedMs < 3000) {
            logger.debug(logPayload, logMessage);
        } else {
            // If it takes more than three seconds, then log it as warning
            logger.warn(logPayload, logMessage);
        }
    };
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

/**
 * dotAccess(object, 'a.b.c', 'new val')
 * source: http://stackoverflow.com/questions/6393943/convert-javascript-string-in-dot-notation-into-an-object-reference
 */
module.exports.dotAccess = function(obj, is, value) {
    if (typeof is == 'string')
        return dotAccess(obj, is.split('.'), value);
    else if (is.length == 1 && value !==undefined)
        return obj[is[0]] = value;
    else if (is.length == 0)
        return obj;
    else
        return index(obj[is[0]], is.slice(1), value);
}


/**
 * dotPopulate
 */
module.exports.dotPopulate = function(obj, values) {
    for (var property in values) {
        if (values.hasOwnProperty(property)) {
            module.export.dotAccess(obj, property, values[property]);
        }
    }
}