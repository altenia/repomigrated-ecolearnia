/*****************************************************************************
 * 
 * contenthelper.js
 * 
 * The base schema definition for ContenNode and ContentItem schema.
 * @date 6/28/2915
 */

var internals = {};

internals.Kind = {
	ROOT: 'root',
	CONTAINER: 'container',
	ITEM: 'item'
};

internals.ContentHelper = {};

/**
 * @class ContentHelper
 *
 * @module providers
 *
 * @classdesc
 *  Content Item/Node helper class.
 *
 */
internals.ContentHelper.initForCreate = function(content, createdBy, parentContentModel, kind)
{
	content.createdBy = createdBy;
 	content.createdAt = new Date();
    content.kind = kind;

    if (content.structural)
    {
    	content.structural = {};
    }
    if (!content.refName) {
        content.refName = content.uuid || content.metadata.title;
    }
    if (parentContentModel) {
		content.parent = parentContentModel._id;
	    content.parentUuid = parentContentModel.uuid;
	}
};

module.exports.Kind = internals.Kind;
module.exports.ContentHelper = internals.ContentHelper;
