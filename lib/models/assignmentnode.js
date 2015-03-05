/*****************************************************************************
 * 
 * contentitem.js
 * 
 * The content schema.
 */

var lodash = require('lodash');
var mongoose = require('mongoose');

var contentnode = require('/contentnode');

var Schema = mongoose.Schema;


var internals = {}

// Singleton object of the ContentItem schema
internals.asignmentNodeSchema = null;

internals.getSchemaDefObject = function()
{
    return lodash.extends( 
            {
                course: { type: Schema.Types.ObjectId, ref: 'Course' },
            }, 
            contentnode.getSchemaDefObject()
        );
}

internals.getSchema = function()
{
    if (!internals.asignmentNodeSchema)
    {
        internals.asignmentNodeSchema = new Schema(internals.getSchemaDefObject);
    }
    return internals.asignmentNodeSchema;
}


module.exports.getSchemaDefObject = internals.getSchemaDefObject;
module.exports.getSchema = internals.getSchema;