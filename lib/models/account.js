/*****************************************************************************
 * 
 * model/account.js
 * 
 * The Account schema.
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

        createdBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        createdAt: { type: Date, default: Date.now, index: true },
        modifiedBy: { type: Schema.Types.ObjectId, ref: 'Account' },
        modifiedAt: { type: Date, default: Date.now },
        modifiedCounter: { type: Number, default: 0 }, // Number of time this record was modified
        kind: { type: String, index: true, required: true }, // 
        
        roles: [String], //roles
        status: { type: String, index: true},
        name: { type: String }, // Name to be displayed (could be First Last name)
        imageUrl: { type: String },

        authentication: {
            oauthSource: { type: String, index: true}, // e.g. Google
            oauthId: { type: String, index: true}, // Unique ID provided by the Outh provider
            id: { type: String, index: true, unique: true },
            password: { type: String, index: true },
            rememberToken: { type: String, index: true },
            ativationCode: { type: String, index: true },
            securityQuestion: { type: String},
            securityAnswer: { type: String},
            sessionTimestamp: { type: Date },
            authFailCounter: { type: Number } // Number of consecutive authorization failure
        }

        profile: {
            // The models section includes data passed to"
            givenName: { type: String, index: true },
            familyName: { type: String, index: true },
            middleName: { type: String, index: true },
            dob: { type: Date }, // Date of birth
            gender: { type: String },
            phone: { type: String },
            mobile: { type: String },
            email: { type: String },
            timezone: { type: String },
            permalink: { type: String },

            guardians: [Schema.Types.ObjectId], // parents
            languages:[String],

            education: {
                lastLevel: { type: String }, // Last achieved level
                // More details?
            }

            address: {
                countryCode: { type: String },
                stateCode: { type: String },
                street: { type: String },
                postalCode: { type: String }
            }
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