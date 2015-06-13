/*****************************************************************************
 * 
 * model/assignmentnode.js
 * 
 * The AssignmentNode schema.
 */

var lodash = require('lodash');
var mongoose = require('mongoose');

var contentnode = require('./contentnode');

var Schema = mongoose.Schema;


var internals = {}

// Singleton object of the ContentItem schema
internals.asignmentNodeSchema = null;

internals.getSchemaDefObject = function()
{
    return lodash.extend( 
            {
                course: { type: Schema.Types.ObjectId, ref: 'Course' },
                courseUuid: { type: String, index: true }
            }, 
            contentnode.getSchemaDefObject()
        );
}

internals.getSchema = function()
{
    if (!internals.asignmentNodeSchema)
    {
        internals.asignmentNodeSchema = new Schema( internals.getSchemaDefObject() );
    }
    return internals.asignmentNodeSchema;
}


module.exports.getSchemaDefObject = internals.getSchemaDefObject;
module.exports.getSchema = internals.getSchema;