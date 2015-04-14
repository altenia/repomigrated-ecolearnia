/*****************************************************************************
 * 
 * model/course.js
 * 
 * The Course schema.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var internals = {}

// Singleton object of the ContentItem schema
internals.courseSchema = null;

internals.getSchema = function()
{
    if (!internals.courseSchema)
    {
        internals.courseSchema = new Schema({

            uuid: {type: String, required: true, unique: true},
            contentNode: { type: Schema.Types.ObjectId, ref: 'ContentNode' },
            contentNodeUuid: { type: String, index: true },

            createdBy: { type: Schema.Types.ObjectId, ref: 'Account' },
            createdAt: { type: Date, default: Date.now, index: true },
            modifiedBy: { type: Schema.Types.ObjectId, ref: 'Account' },
            modifiedAt: { type: Date, default: Date.now },

            // The area in which the learner is engaged",
            learningArea: {
                subject:     { type: String, index: true, required: true }, // "Match"
                subjectArea: { type: String, index: true, required: true }, // "Arithmetic"
                // Array of the topic hierarchy starting from the broadest to  specific",
                // Without including the subject and subjectArea",
                topicHierarchy: [String],
                tags: [String]
            },
            title:      { type: String, required: true}, // "Sum of Single Digit",
            description:{ type: String }, // "Sum of Single Digit",
            webiste:    { type: String }, // "the webiste of the course",
            preRecommendations: [String],

            // Properties not found in ContentNode:
            institution:  String, // "Matchnia University",
            instructors:  [Schema.Types.ObjectId],
            openness:     String, // "open",

            startTime:   { type: Date, default: Date.now },
            startTime:   { type: Date, default: Date.now },
            timezone:    { type: String, index: true }, // "America/New_York",
            numEnrollment:{ type: Number, default:0 }, // Num students,

        });
    }
    return internals.courseSchema;
}


module.exports.getSchema = internals.getSchema;