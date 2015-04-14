/*****************************************************************************
 * 
 * model/contentnode.js
 * 
 * The ContentNode schema.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var internals = {}

// Singleton object of the content schema
internals.contentNodeSchema = null;

internals.getSchemaDefObject = function()
{
    return {
        uuid: { type: String, required: true, unique: true },
        refName: { type: String, required: true }, // Reference Name of this content
        parent: { type: Schema.Types.ObjectId, ref: 'ContentNode' },
        parentUuid: { type: String, index: true },
        index: { type: Number }, // Index within it's parent

        createdBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        createdAt: { type: Date, default: Date.now, index: true },
        modifiedBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        modifiedAt: { type: Date, default: Date.now },
        copiedFrom: { type: Schema.Types.ObjectId, ref: 'ContentNode' },
        kind: { type: String, index: true, required: true }, // <CourseTemplate|Assignment>,
        metadata: {
            // The area in which the learner is engaged",
            learningArea: {
                subject:     { type: String, index: true, required: true }, // "Match"
                subjectArea: { type: String, index: true, required: true }, // "Arithmetic"
                // Array of the topic hierarchy starting from the broadest to  specific",
                // Without including the subject and subjectArea",
                topicHierarchy: [String],
                tags: [String]
            },

            // If this content was originally copied from another content",
            copiedFrom: { type: String, index: true }, // The GUID
            createdAt:  { type: Date, index: true },
            modifiedAt: { type: Date, index: true },
            version:    { type: String, default: '0.0.1' },
            authors:   [String],
            license:    String, // "Creative Commons",
            locale:     { type: String, index: true }, // "en_US",
            title:      { type: String, required: true}, // "Sum of Single Digit",
            description:{ type: String }, // "Sum of Single Digit",
            // ? How the pre recomendation should be encoded? by GUID?",
            preRecommendations: [String],
            isAssessment: { type: Boolean, index: true }
        },

        body: {
            // The models section includes data passed to"
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
            /* 
             * During runtime it is possible to retrieve the entire descendant
             * in the following strcuture
            subnodes: [
                Schema.Types.Mixed
            ]
             */
        }
    };
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