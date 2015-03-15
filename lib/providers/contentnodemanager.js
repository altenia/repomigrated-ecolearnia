var promiseutils = require('../utils/promiseutils');
var uuid = require('node-uuid');

var utils = require('../utils/utils');
var defaultProvider = require('./defaultprovider');

var contentNodeSchema = require('../models/contentitem').getSchema();


// Declararation of namespace for internal module use
var internals = {};


internals.managerInstance = null;

internals.ContentNodeManager = function()
{
    this.contentNodeProvider = defaultProvider.createProvider('ContentNode', 'contentnode', { primaryKey: 'uuid'} );
}

internals.ContentNodeManager.prototype.add = function(contentNode, contextIds)
{
    var self = this;
    var promise = promiseutils.createPromise(function(resolve, reject) {
        
        if (contextIds && contextIds.parentUuid) {
        	// Add sub-node to the parent
	        var parentNodeCriteria = {
	            uuid: contextIds.parentUuid
	        }
	        this.contentNodeProvider.find(parentNodeCriteria)
	        .then(function(parentContentNodeModel) {
	            
	            contentNode.parent = parentContentNodeModel._id;
	            contentNode.parentUuid = parentContentNodeModel.uuid;
	            contentNode.items = [];

	            // Add the the new node as child
	            self.contentNodeProvider.add(contentNode)
	            .then(function(newContentNodeModel) {
	                resolve(newContentNodeModel);
	            })
	            .catch(function(error) {
	                reject(error);
	            });

	        })
	        .catch(function(nodeError) {
	            reject(nodeError);
	        });
	    } else {
	    	// Add a top-level node
	    	self.contentNodeProvider.add(contentNode)
            .then(function(newContentNodeModel) {
                resolve(newContentNodeModel);
            })
            .catch(function(error) {
                reject(error);
            });
	    }

    }.bind(this));

    return promise; 
}


internals.ContentNodeManager.prototype.find = function(criteria, contextIds)
{
    return this.contentNodeProvider.find(criteria, contextIds)
}

/**
 * @param {Map.<String, Object>} criteria -  A map of criteria
 */
internals.ContentNodeManager.prototype.query = function(criteria, contextIds)
{
    return this.contentNodeProvider.query(criteria, contextIds)
}

internals.ContentNodeManager.prototype.update = function(criteria, contextIds)
{
    return this.contentNodeProvider.update(criteria, contextIds)
}

internals.ContentNodeManager.prototype.remove = function(criteria, contextIds)
{
    // @todo - Remove in the parent's
    return this.contentNodeProvider.remove(criteria, contextIds)
}

/**
 * Factory method
 */
internals.getManager = function()
{
    if (!internals.managerInstance)
    {
        internals.managerInstance = new internals.ContentNodeManager();
    }
    return internals.managerInstance;
}

module.exports.getManager = internals.getManager;