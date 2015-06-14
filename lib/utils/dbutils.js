/*
 * This file is part of the EcoLearnia platform.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * EcoLearnia v0.0.1
 *
 * @fileoverview
 *  This file includes definition of HapiResource.
 *
 * @author Young Suk Ahn Park
 * @date 2/15/15
 */
var mongoose = require('mongoose');

var logger = require('../utils/logger');

// Declararation of namespace for internal module use
var internals = {};

internals.DbUtils = {};

/**
 * connect
 *
 * @param {string} connSgtring  'mongodb://localhost/test'
 */
internals.DbUtils.connect = function(connString)
{
    mongoose.connect(connString);

    var db = mongoose.connection;
    db.on('error', function (callback) {
    	var aLogger = logger.Logger.getLogger('DbUtils');
    	aLogger.error({conn: connString}, 'Error on Mongo connection');
    });

    db.once('open', function (callback) {
    	var aLogger = logger.Logger.getLogger('DbUtils');
    	aLogger.info({conn: connString}, 'Connected');
    });

    return db;
}

/**
 * getModel
 * @param {string} name   - The name of the model
 * @param {Schema} schema - The schema reference
 */
internals.DbUtils.getModel = function (name, schema)
{
    return mongoose.model(name, schema);
}


module.exports.DbUtils = internals.DbUtils;