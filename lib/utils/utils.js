/*****************************************************************************
 * utils.js
 * Includes various utility functions
 */

var nconf = require('nconf');
var childProc = require('child_process');
var bunyan = require('bunyan');

var internals = {};

/**
 * endsWith
 * Returns true if the str ends with the suffix, false otherwise.
 *
 * @param {string} str
 * @param {string} suffix
 */
module.exports.endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

/**
 * startsWith
 * Returns true if the str starts with the prefix, false otherwise.
 *
 * @param {string} str
 * @param {string} prefix
 * @param {number} position
 */
module.exports.startsWith = function(str, prefix, position) {
    position = position || 0;
    return str.lastIndexOf(prefix, position) === position;
};

/**
 * Access an object using dot notation
 * When third parameter is provided, the function behaves as setter, otherwise behaves as getter
 *
 * Sample:
 *   utils.dotAccess(object, 'a.b.c', 'Hello World');
 *   var myval = utils.dotAccess(object, 'a.b.c');
 *   --> myval = 'Hello World'
 * source: http://stackoverflow.com/questions/6393943/convert-javascript-string-in-dot-notation-into-an-object-reference
 *
 * @param obj
 * @param is
 * @param value
 * @returns {*}
 */
module.exports.dotAccess = function(obj, is, value) {
    if (typeof is == 'string')
        return module.exports.dotAccess(obj, is.split('.'), value);
    else if (is.length == 1 && value !==undefined)
        return obj[is[0]] = value;
    else if (is.length == 0)
        return obj;
    else
        return module.exports.dotAccess(obj[is[0]], is.slice(1), value);
};

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


module.exports.getConfigProperty = function(key)
{
    return nconf.get(key);
};

/**
 * runCommandLine
 * @param {string} cwd     - Current working directory
 * @param {string} command - The command to execute
 * @param {string} argList - The arguments to pass to the command
 * @param {function(err, data)} onclose  - The callback function
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
