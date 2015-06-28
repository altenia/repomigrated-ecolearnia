/*****************************************************************************
 * 
 * model/contentitem.js
 * 
 * The base schema definition for ContenNode and ContentItem schema.
 * @date 6/28/2915
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;


module.exports.getSchemaDefObject = function()
{
    return {
        uuid: { type: String, required: true, unique: true },
        refName: { type: String, required: true }, // Reference Name of this content

        parent: { type: Schema.Types.ObjectId, ref: 'ContentNode' },
        parentUuid: { type: String, index: true },
        ordering: { type: Number, index: true }, // Ordering position within it's parent

        createdBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        createdAt: { type: Date, default: Date.now, index: true },
        modifiedBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        modifiedAt: { type: Date, default: Date.now },
        
        // If this content was originally copied from another content",
        copiedFrom: { type: Schema.Types.ObjectId, ref: 'ContentNode' },
        kind: { type: String, index: true, required: true }, // <CourseTemplate|Assignment>,

        status: { type: String, index: true}, // <published>,
        
        metadata: {
            title:      { type: String, required: true}, // "Sum of Single Digit",
            // The area in which the learner is engaged",
            learningArea: {
                subject:     { type: String, index: true, required: true }, // "Match"
                subjectArea: { type: String, index: true, required: true }, // "Arithmetic"
                domainCodeSource: { type: String, index: true, required: false }, // "CommonCore",
                domainCode:  { type: String, index: true, required: false }, // "arithmetic",
                // Array of the topic hierarchy starting from the broadest to  specific",
                // Without including the subject and subjectArea",
                topicHierarchy: [String],
            },
            tags: [String],

            createdAt:  { type: Date, index: true },
            modifiedAt: { type: Date, index: true },
            version:    { type: String, default: '0.0.1' },
            authors:   [String],
            license:    String, // "Creative Commons",
            locale:     { type: String, index: true }, // "en_US",
            description:{ type: String }, // "Sum of Single Digit",
            // ? How the pre recomendation should be encoded? by GUID?",
            preRecommendations: [String],
            isAssessment: { type: Boolean, index: true }
        },

        body: {
        }
    };
};
