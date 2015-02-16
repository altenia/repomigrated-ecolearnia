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
internals.contentContainerSchema = null;

internals.getSchema = function()
{
    if (!internals.contentContainerSchema)
    {
        internals.contentContainerSchema = new Schema({

            guid: String,
            metadata: {
                // The area in which the learner is engaged",
                learningArea: {
                    subject:     String, // "Match"
                    subjectArea: String, // "Arithmetic"
                    // Array of the topic hierarchy starting from the broadest to  specific",
                    // Without including the subject and subjectArea",
                    topicHierarchy: [String]
                },

                // If this content was originally copied from another content",
                copiedFrom: String, // The GUID
                createdAt:  Date,
                modifiedAt: Date,
                authors:   [String],
                license:    String, //"Creative Commons",
                locale:     String, // "en_US",
                title:      String, // "Sum of Single Digit",
                // ? How the pre recomendation should be encoded? by GUID?",
                preRecommendations: [String],
                isAssessment: Boolean
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
    return internals.contentContainerSchema;
}


module.exports.getSchema = internals.getSchema;