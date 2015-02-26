/*****************************************************************************
 * 
 * contentnode.js
 * 
 * The ContentNode schema.
 */


var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var internals = {}

// Singleton object of the content schema
internals.contentNodeSchema = null;

internals.getSchema = function()
{
    if (!internals.contentNodeSchema)
    {
        internals.contentNodeSchema = new Schema({

            sid: {type: Number, unique: true},
            uuid: {type: String, required: true, unique: true},
            parent: { type: Schema.Types.ObjectId, ref: 'ContentItem' },
            createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
            createdAt: { type: Date, default: Date.now, index: true },
            modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            modifiedAt: { type: Date, default: Date.now },
            copiedFrom: { type: Schema.Types.ObjectId, ref: 'ContentItem' },
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
                // ? How the pre recomendation should be encoded? by GUID?",
                preRecommendations: [String],
                isAssessment: { type: Boolean, index: true }
            },

            body: {
                // The models section includes data passed to"
                items: [
                    {
                        type: { type: String, required: true}, // Node|Item|ContentGen,
                        item: { type: Schema.Types.ObjectId },
                        difficulty: Number,

                        // Optional for generation
                        gen: {
                            type: String,
                            params: Schema.Types.Mixed
                        }
                    }
                ]
            }
        });
    }
    return internals.contentNodeSchema;
}


module.exports.getSchema = internals.getSchema;