/*****************************************************************************
 * 
 * model/contentitem.js
 * 
 * The ContentItem schema.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var contentbase = require('./contentbase');

var internals = {}

// Singleton object of the ContentItem schema
internals.contentItemSchema = null;

internals.ComponentsSchema = new Schema(
        {
            id: String,
            type: String,
            config: Schema.Types.Mixed
        });

internals.getSchemaDefObject = function()
{
    var schemaDefObject = contentbase.getSchemaDefObject();
    schemaDefObject.body = Schema.Types.Mixed;
    return schemaDefObject;
};

internals.getSchema = function()
{
    if (!internals.contentItemSchema)
    {
        internals.contentItemSchema = new Schema( internals.getSchemaDefObject() );
    }
    return internals.contentItemSchema;
}

module.exports.getSchemaDefObject = internals.getSchemaDefObject;
module.exports.getSchema = internals.getSchema;