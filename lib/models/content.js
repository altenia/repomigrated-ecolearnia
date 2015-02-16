/*****************************************************************************
 * 
 * content.js
 * 
 * The content schema.
 */


var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var internals = {}

// Singleton object of the content schema
internals.contentSchema = null;

internals.getSchema = function()
{
    if (!internals.contentSchema)
    {
        internals.contentSchema = new Schema({

            guid: {type: String, required: true, unique: true},
            metadata: {
                // The area in which the learner is engaged",
                learningArea: {
                    subject:     { type: String, index: true }, // "Match"
                    subjectArea: { type: String, index: true }, // "Arithmetic"
                    // Array of the topic hierarchy starting from the broadest to  specific",
                    // Without including the subject and subjectArea",
                    topicHierarchy: [String]
                },

                // If this content was originally copied from another content",
                copiedFrom: { type: String, index: true }, // The GUID
                createdAt:  { type: Date, index: true },
                modifiedAt: { type: Date, index: true },
                authors:   [String],
                license:    String, //"Creative Commons",
                locale:     { type: String, index: true }, // "en_US",
                title:      String, // "Sum of Single Digit",
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
                    correctAnswer: Schema.Types.Mixed
                },

                // The models section includes data passed to",
                feedback: [
                    { 
                        case: String, // Expression 
                        message: String // feedback message
                    }
                ]
            }
        });
    }
    return internals.contentSchema;
}


module.exports.getSchema = internals.getSchema;