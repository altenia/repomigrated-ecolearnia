/*****************************************************************************
 * 
 * model/contentnode.js
 * 
 * The ContentNode schema.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var contentbase = require('./contentbase');

var internals = {}

// Singleton object of the content schema
internals.contentNodeSchema = null;

internals.getSchemaDefObject = function()
{
    var schemaDefObject = contentbase.getSchemaDefObject();
    schemaDefObject.body = {
            // Items within this node, possibly none
            items: [
                {
                    type: { type: String, required: true}, // Item|ItemGen,
                    /* 
                     * During runtime it given retrieve option set to retrieve
                     * item, the item property with MongoOID value will be
                     * replaced by the actual item model
                     */
                    item: { type: Schema.Types.ObjectId },
                    itemUuid: { type: String, required: true },
                    difficulty: Number,

                    // Optional for generation
                    gen: {
                        type: String,
                        params: Schema.Types.Mixed
                    }

                }
            ],
            // Subnodes within this node, possibly none (for terminal nodes)
            subnodes: [
                {
                    /* 
                     * During runtime it given retrieve option set to retrieve
                     * item, the item property with MongoOID value will be
                     * replaced by the actual item model
                     */
                    node: { type: Schema.Types.ObjectId },
                    nodeUuid: { type: String, required: true },
                    difficulty: Number,
                }
            ]
    };

    return schemaDefObject;
};

internals.getSchema = function()
{
    if (!internals.contentNodeSchema)
    {
        internals.contentNodeSchema = new Schema( internals.getSchemaDefObject() );
    }
    return internals.contentNodeSchema;
}

module.exports.getSchemaDefObject = internals.getSchemaDefObject;
module.exports.getSchema = internals.getSchema;