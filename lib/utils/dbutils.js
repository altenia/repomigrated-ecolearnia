
var mongoose = require('mongoose');

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
    db.on('error', console.error.bind(console, 'Mongo connection error:'));

    db.once('open', function (callback) {
      // yay!
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