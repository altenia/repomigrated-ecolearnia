/*****************************************************************************
 * 
 * model/contentitem.js
 * 
 * The ContentItem schema.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
    return {

        uuid: {type: String, required: true, unique: true},
        refName: { type: String, required: true }, // Reference Name of this content

        parent: { type: Schema.Types.ObjectId, ref: 'ContentNode' },
        parentUuid: { type: String, index: true },

        createdBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        createdAt: { type: Date, default: Date.now, index: true },
        modifiedBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        modifiedAt: { type: Date, default: Date.now },
        copiedFrom: { type: Schema.Types.ObjectId, ref: 'ContentItem' },
        kind: { type: 'string', required: false }, // <submittable>,
        metadata: {
            // The area in which the learner is engaged,
            // If the values are not provided, it inherits from parent
            learningArea: {
                subject:     { type: String, index: true, required: true }, // "Match"
                subjectArea: { type: String, index: true, required: true }, // "Arithmetic"
                domainCodeSource: { type: String, index: true, required: false }, // "CommonCore",
                domainCode:  { type: String, index: true, required: false }, // "arithmetic",
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
            license:    String, //"Creative Commons",
            locale:     { type: String, index: true }, // "en_US",
            title:      { type: String, required: true}, // "Sum of Single Digit",
            description:{ type: String }, // "Sum of Single Digit",
            // ? How the pre recomendation should be encoded? by GUID?",
            preRecommendations: [String],
            isAssessment: { type: Boolean, index: true }
        },

        body: Schema.Types.Mixed
    };
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