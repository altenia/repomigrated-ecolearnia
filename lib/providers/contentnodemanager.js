var promiseutils = require('../utils/promiseutils');
var uuid = require('node-uuid');
var async = require('async');

var utils = require('../utils/utils');
var defaultProvider = require('./defaultprovider');

//var contentNodeSchema = require('../models/contentitem').getSchema();

var contentItemManager = require('./contentitemmanager');


// Declararation of namespace for internal module use
var internals = {};


internals.managerInstance = null;

internals.ContentNodeManager = function()
{
    this.contentNodeProvider = defaultProvider.createProvider('ContentNode', 'contentnode', { primaryKey: 'uuid'} );
    this.contentItemManager = contentItemManager.getManager();
}

internals.ContentNodeManager.prototype.add = function(contentNode, options)
{
    var self = this;
    var promise = promiseutils.createPromise(function(resolve, reject) {
        
        if (options && options.parentUuid) {
        	// Add sub-node to the parent
	        var parentNodeCriteria = {
	            uuid: options.parentUuid
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


internals.ContentNodeManager.prototype.find = function(criteria, options)
{
    return this.contentNodeProvider.find(criteria, options)
}

internals.ContentNodeManager.prototype.findByPK = function(pk, options)
{
    return this.contentNodeProvider.findByPK(pk, options)
}

/**
 * @param {Map.<String, Object>} criteria -  A map of criteria
 */
internals.ContentNodeManager.prototype.query = function(criteria, options)
{
    return this.contentNodeProvider.query(criteria, options)
}

internals.ContentNodeManager.prototype.update = function(criteria, options)
{
    return this.contentNodeProvider.update(criteria, options)
}

internals.ContentNodeManager.prototype.remove = function(criteria, options)
{
    // @todo - Remove in the parent's
    return this.contentNodeProvider.remove(criteria, options)
}

/**
 * retrieve
 * Retrieves a node with it's descendants
 *
 * @param {Object} criteria  - Criteria
 * @param {Object} options   - 
 *		options.includeItems - whether or not to include items
 *
 * @return {models.ContentNode}  - The found node with it's descendants
 */
internals.ContentNodeManager.prototype.retrieve = function(criteria, options)
{
	var promise = promiseutils.createPromise(function(resolve, reject) {
	    this.contentNodeProvider.find(criteria)
	    .then(function(contentNodeModel){
	    	// Recursive retrieval
	    	var contentNode = contentNodeModel.toJSON();
	    	this.retrieveRecursive_(contentNode, options)
	    	.then(function(result){
	    		resolve(result);
	    	})
	    	.catch(function(error) {
	    		reject(error);
	    	});
	    }.bind(this))
	    .catch(function(error) {
	    	reject(error);
	    });
	}.bind(this));

	return promise;
}

/**
 * retrieveRecursive_
 * Recursively retreives a node with it's descendants
 *
 * @param {Object} contentNode  - contentNode to retrieve the decendants
 *		options.includeItems - whether or not to include items
 *
 * @return {models.ContentNode}  - The found node with it's descendants
 */
internals.ContentNodeManager.prototype.retrieveRecursive_ = function(contentNode, options)
{
	var self = this;
	contentNode.body.subnodes = [];
	// Populate items
	var promise = promiseutils.createPromise(function(resolve, reject) {

console.log("** 4 - Handle a subNode");
        // Serialse the processing of child items and childe nodes
        async.series([
            // First serial function: load items
            function processItems(seriesCallback) {
                if (contentNode.body.items && contentNode.body.items.length > 0)
                {
console.log("** 4.1 - Iterating " + contentNode.body.items.length + " items");

                    function processEachItem(contentItemEntry, eachCallback) {
                        // 1. Retrieve the contentItem by item
                        self.contentItemManager.findByPK(contentItemEntry.itemUuid)
                        .then(function(contentItemModel){

                            if (contentItemModel) {
                            	contentItemEntry.item = contentItemModel;
                            
	                            eachCallback();
                            } else {
                                // @todo - throw 404
                                throw new Error('NotFound');
                            }
                        })
                        .catch(function(error) {
console.log("** 4.1.2 - Add item failed: " + JSON.stringify(error));
                            eachCallback(error);
                        });
                    };

                    // add items to assignmentNodeModel
                    async.each(contentNode.body.items, processEachItem, function(err) {
                        if (err) {
                            seriesCallback(err, null);
                        } else {
                            // All items retrieved, callback to async.series
                            seriesCallback(null, contentNode);
                        }
                    });

                } else {
                	// No items registered, callback to async.series
                    seriesCallback(null, contentNode);
                }
            },

            // Second serial function: load subNodes
            function processSubNodes(seriesCallback) {
                var subNodesCriteria = {
                    parent: contentNode._id
                };

                self.query(subNodesCriteria)
                .then(function(subNodeModels){
                    if (subNodeModels) {

console.log("** 4.2 - Iterating subnodes");

                        function processEachNode(contentSubNodeModel, eachCallback) {
                        	var contentSubNode = contentSubNodeModel.toJSON();
console.log("** 4.2.1 - Adding subnoeds of contentNode " + contentSubNode.uuid);
							contentNode.body.subnodes.push(contentSubNode);
                            // 4. Recurse
                            self.retrieveRecursive_(contentSubNode, options)
                            .then(function(){
                                eachCallback();
                            })
                            .catch(function(error) {
                                eachCallback(error);
                            });
                        };

                        // add items to assignmentNode
                        async.each(subNodeModels, processEachNode, function(err) {
                            if (err) {
                                seriesCallback(err, null);
                            } else {
	                            // All subnodes retrieved, callback to async.series
                                seriesCallback(null, contentNode);
                            }
                        });
                    } else {
                        // No subnodes found, callback to async.series
                        seriesCallback(null, contentNode);
                    }
                }) // contentNodeProvider.query
                .catch(function(error) {
                    reject(error);
                });
            }
        ],
        // Async.series result
        function(err, results){
            if (err) {
                reject(err);
            } else {
                resolve(contentNode);
            }
        });
        

    }.bind(this));

    return promise; 
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