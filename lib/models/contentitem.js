/*****************************************************************************
 * 
 * contentitem.js
 * 
 * The content schema.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var internals = {}

// Singleton object of the ContentItem schema
internals.contentItemSchema = null;

internals.getSchemaDefObject = function()
{
    return {

            uuid: {type: String, required: true, unique: true},
            refName: { type: String, required: true }, // Reference Name of this content

            parent: { type: Schema.Types.ObjectId, ref: 'ContentNode' },
            parentUuid: { type: String, index: true },

            createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
            createdAt: { type: Date, default: Date.now, index: true },
            modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            modifiedAt: { type: Date, default: Date.now },
            copiedFrom: { type: Schema.Types.ObjectId, ref: 'ContentItem' },
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
                license:    String, //"Creative Commons",
                locale:     { type: String, index: true }, // "en_US",
                title:      { type: String, required: true}, // "Sum of Single Digit",
                description:{ type: String }, // "Sum of Single Digit",
                // ? How the pre recomendation should be encoded? by GUID?",
                preRecommendations: [String],
                isAssessment: { type: Boolean, index: true }
            },

            body: {
                // The models section includes data passed to"
                models: Schema.Types.Mixed,

                // The presenters sections includes configuration information",
                // for the UI components ",
                presenters: [
                    {
                        id: String,
                        type: String,
                        config: Schema.Types.Mixed
                    }
                ],

                // The models section includes data passed to",
                policy: {
                    maxAttempts: Number,
                    // Optional - if present, each attempt will be timed in seconds",
                    timed: Number,
                    timeOverAction: String
                },

                // The models section includes data passed to",
                submissionEval: {
                    engine: String,
                    correctAnswer: Schema.Types.Mixed,
                    // The models section includes data passed to",
                    feedback: [
                        { 
                            case: String, // Expression 
                            message: String // feedback message
                        }
                    ],
                    solution: Schema.Types.Mixed,
                    hints: [String]
                },

            }
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