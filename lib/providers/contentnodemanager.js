/*
 * This file is part of the EcoLearnia platform.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * EcoLearnia v0.0.1
 *
 * @fileoverview
 *  This file includes definition of HapiResource.
 *
 * @author Young Suk Ahn Park
 * @date 2/15/15
 */

var uuid = require('node-uuid');
var async = require('async');

var utils = require('../utils/utils');
var promiseutils = require('../utils/promiseutils');
var logger = require('../utils/logger');

var ContentHelper = require('./contenthelper').ContentHelper;
var ContentKind = require('./contenthelper').Kind;
var defaultProvider = require('./defaultprovider');

var contentitemmanager = require('./contentitemmanager');


// Declaration of namespace for internal module use
var internals = {};


internals.managerInstance = null;

internals.ContentNodeManager = function()
{
    this.logger_ = logger.Logger.getLogger('ContentNodeManager');
    this.contentNodeProvider = defaultProvider.createProvider('ContentNode', 'contentnode', { primaryKey: 'uuid'} );
    this.contentItemManager = null;
};

/**
 * Gets the contentItemManager
 */
internals.ContentNodeManager.prototype.getItemManager = function()
{
    if (this.contentItemManager ==  null)
    {
        this.contentItemManager = contentitemmanager.getManager();
    }
    return this.contentItemManager;
}

/**
 * Add a content node
 * @param contentItem
 * @param options
 * @returns {*}
 */
internals.ContentNodeManager.prototype.add = function(contentNode, options)
{
    var self = this;
    var promise = promiseutils.createPromise(function(resolve, reject) {

        var promiseParent = function() {
            if (contentNode.parentUuid) {
                // Retrieve parent
                var parentNodeCriteria = {
                    uuid: contentNode.parentUuid
                }
                return self.contentNodeProvider.find(parentNodeCriteria);
            } else {
                // Nothing to do, just return a proise and resolve it
                return promiseutils.createPromise( function(resolve, reject) {
                    resolve(null);
                });
            }
        }();

        promiseParent.then(function(parentContentNodeModel) {
            var kind = ContentKind.ROOT;
            if (parentContentNodeModel)
            {
                kind = ContentKind.CONTAINER;
                // Reset items (just in case)
                contentNode.items = [];
            }
            ContentHelper.initForCreate(contentNode, null, parentContentNodeModel, kind);

            // Add the the new node as child
            return self.contentNodeProvider.add(contentNode)
        })
        .then(function(newContentNodeModel) {
            resolve(newContentNodeModel);
        })
        .catch(function(error) {
            reject(error);
        });

    }.bind(this));

    return promise;
};


internals.ContentNodeManager.prototype.find = function(criteria, options)
{
    //options.depth = 0;
    //options.fetchItems = false;
    //options.fetchAncestors = false;
    if (options) {
        return this.retrieve(criteria, options);
    } else {
        return this.contentNodeProvider.find(criteria);
    }
};

internals.ContentNodeManager.prototype.findByPK = function(pk, options)
{
    return this.contentNodeProvider.findByPK(pk, options);
};

/**
 * @param {Map.<String, Object>} criteria -  A map of criteria
 */
internals.ContentNodeManager.prototype.query = function(criteria, options)
{
    return this.contentNodeProvider.query(criteria, options);
};

internals.ContentNodeManager.prototype.update = function(criteria, resource, options)
{
    return this.contentNodeProvider.update(criteria, resource, options);
};

internals.ContentNodeManager.prototype.updateModel = function(model)
{
    return this.contentNodeProvider.updateModel(model);
};

/**
 *
 */
internals.ContentNodeManager.prototype.remove = function(criteria, options)
{
    // @todo - Remove in the parent's

    return this.contentNodeProvider.remove(criteria, options);
};


/**
 * Moves a node to another parent
 * PENDING
 * @param {string} uuid - the uuid of the node to move
 * @param {Object} to -   {parent, position}
 */
internals.ContentNodeManager.prototype.changeLocation = function(uuid, to, options)
{
    var self = this;
    var promise = promiseutils.createPromise(function(resolve, reject) {

        if (!to.parentUuid) {
            reject('BadRequest'); // REturn 400
        }

        self.findByPK(uuid, {fetchAncestors: true})
        .then(function(content) {

            var origParentModel;

            // Find the original parent
            self..findByPK(content.parentUuid)
            .then(function(parentNodeModel) {
                origParentModel = parentNodeModel;
                // @todo - change it's position within it's parent

                if (content.parentUuid === to.parentUuid) {
                    resolve(content);
                } else {
                    return self.findByPK(to.parentUuid);
                }
            })
            .then(function(newParentNodeModel) {
                // Attach to the new parent
                //internals.ContentNodeManager.insertSubnodeEntry(newParentNodeModel, content);
    
                return self.getNodeManager().updateModel(newParentNodeModel);
            })
            .then(function(updatedNewParentNodeModel) {
                // Update content's parent reference
                content.parent = updatedNewParentNodeModel._id;
                content.parentUuid = updatedNewParentNodeModel.uuid;

                delete content._id;; // otherwise MongoDB will complain
                return self.update({uuid: content.uuid}, content);
            })
            .then(function(updatedContentModel) {
                // Detach from original parent
                //internals.ContentNodeManager.deleteItemEntry(origParentModel, content.uuid);
                return self.updateModel(origParentModel);
            })
            .then(function(updatedOrigParentModel) {
                // Retrieve new ancestors
                return self.retrieveAncestors(content, {}, 0);
            })
            .then(function(updatedContent) {
                // Return the content with new ancestors
                resolve(updatedContent);
            });
            /* Is this necessary?
            .catch(function (error) {

            });*/
        })
        .catch(function (error) {
            reject(error);
        });
    }.bind(this));

    return promise;
};

/**
 * retrieve
 * Retrieves a node with it's descendants
 *
 * @param {Object} criteria  - Criteria
 * @param {Object} options   -
 *      options.depth - Fetch depth
 *      options.fetchItems - Whether or not to fetch items
 *      options.fetchAncestors - Whether or not to fetch ancestors
 *
 * @return {models.ContentNode}  - The found node with it's descendants
 */
internals.ContentNodeManager.prototype.retrieve = function(criteria, options)
{
    var promise = promiseutils.createPromise(function(resolve, reject) {
        this.contentNodeProvider.find(criteria)
        .then(function(contentNodeModel) {

            // Recursive retrieval
            if (contentNodeModel) {
                var contentNode = contentNodeModel.toJSON();

                // @todo synch both calls

                // Retrieve descendants
                this.retrieveRecursive_(contentNode, options, 0)
                .then(function(result){

                    // Retrieve ancestors if applicable
                    if (options && options.fetchAncestors)
                    {
                        this.retrieveAncestors(result, options, 0)
                        .then(function(result){
                            resolve(result);
                        })
                        .catch(function(error) {
                            reject(error);
                        });
                    } else {
                        resolve(result);
                    }

                }.bind(this))
                .catch(function(error) {
                    reject(error);
                });

            } else {
                // @todo - change to Exception object
                resolve(null);
            }
        }.bind(this))
        .catch(function(error) {
            reject(error);
        });
    }.bind(this));

    return promise;
};


/**
 * retrieveAncestors
 * Recursively retrieves a node's ancestors.
 * The parent property is replaced with the actual parent object.
 *
 * @param {Object} contentNode  - contentNode to retrieve the ancestors
 * @param {Object} options   -
 *      options.depth - Fetch depth
 *      options.fetchItems - Whether or not to fetch items
 *
 * @return {Promise}  - The found node with it's descendants
 *      success: {ContentNode} - same contentNode reference with ancestors
 */
internals.ContentNodeManager.prototype.retrieveAncestors = function(contentNode, options, level)
{
    var promise = promiseutils.createPromise(function(resolve, reject) {

        if (contentNode && contentNode.parentUuid) {
            this.contentNodeProvider.findByPK(contentNode.parentUuid)
            .then(function(parentContentNodeModel) {

                // Recursive retrieval
                if (parentContentNodeModel) {
                    //  Replace the parent (originally uuid) to the actual object
                    var parentContentNode = parentContentNodeModel.toJSON();
                    contentNode.__parentObject = parentContentNode;

                    this.retrieveAncestors(parentContentNode, options, level + 1)
                    .then(function(result){
                        resolve(contentNode);
                    })
                    .catch(function(error) {
                        reject(error);
                    });
                } else {
                    // @todo - change to Exception object
                    reject("Parent NotFound");
                }
            }.bind(this))
            .catch(function(error) {
                reject(error);
            });
        } else {
            resolve(contentNode);
        }
        
    }.bind(this));

    return promise;
};

/**
 * retrieveRecursive_
 * Recursively retrieves a node's descendants
 *
 * @param {Object} contentNode  - contentNode to retrieve the decendants
 * @param {Object} options   -
 *      options.depth - Fetch depth
 *      options.fetchItems - Whether or not to fetch items
 * @param {Object} level   - The current level
 *
 * @return {models.ContentNode}  - The found node with it's descendants
 */
internals.ContentNodeManager.prototype.retrieveRecursive_ = function(contentNode, options, level)
{
    var self = this;
    contentNode.body.subnodes = [];
    // Populate items
    var promise = promiseutils.createPromise(function(resolve, reject) {

        // Serialise the processing of child items and child contentNodeSchema
        // using async.series
        var operationsToSerialize = [];

        // Optionally include items
        if (options && options.fetchItems) {
            operationsToSerialize.push(
                // First serial function: load items
                function processItems(seriesCallback) {
                    if (contentNode.body.items && contentNode.body.items.length > 0)
                    {

                        function processEachItem(contentItemEntry, eachCallback) {
                            // 1. Retrieve the item (without the ancestor)
                            self.getItemManager().findByPK(contentItemEntry.itemUuid, {fetchAncestors: false} )
                            .then(function(contentItemModel){

                                if (contentItemModel) {
                                    contentItemEntry.item = contentItemModel;

                                    eachCallback();
                                } else {
                                    //throw new Error('NotFound');

                                    // Removing item from node
                                    // @todo - update the node?
                                    internals.ContentNodeManager.deleteItemEntry(contentNode, contentItemEntry.itemUuid);
                                    eachCallback();
                                }
                            })
                            .catch(function(error) {
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
                }
            );
        }

        if (options.depth && options.depth > level) {
            // Serial function: load subNodes
            operationsToSerialize.push(
                function processSubNodes(seriesCallback) {
                    var subNodesCriteria = {
                        parent: contentNode._id
                    };

                    self.query(subNodesCriteria)
                    .then(function(subNodeModels){
                        if (subNodeModels) {

                            function processEachNode(contentSubNodeModel, eachCallback) {
                                var contentSubNode = contentSubNodeModel.toJSON();
                                contentNode.body.subnodes.push(contentSubNode);

                                // 4. Recurse
                                self.retrieveRecursive_(contentSubNode, options, level + 1)
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
            );
        }

        async.series(operationsToSerialize,
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
};


/**
 * Insert an item to the node
 * @param {number} position  -  0-based index for the postion to insert
 */
internals.ContentNodeManager.insertItemEntry = function(node, itemModel, position)
{
    // Check for duplicate
    // @todo use some()
    for(var i=0; i < node.body.items.length; i++)
    {
        if (node.body.items[i].itemUuid === itemModel.uuid)
        {
            return node
        }
    }

    var newChild = {
        type: 'item',
        itemUuid: itemModel.uuid,
        item: itemModel._id,
        difficulty: 0.5 // @todo 
    }
    if (position) {
        node.body.items.splice(position, 0, newChild);
    } else {
        node.body.items.push(newChild);
    }

    return node;
}

/**
 * Deletes an item from node
 * @static
 *
 * @param {string} itemUuidToDelete  - The uuid of the item to delete
 *
 * @returns {boolean}  - True if found and deleted, false otherwise
 */
internals.ContentNodeManager.deleteItemEntry = function(node, itemUuidToDelete)
{
    for(var i=0; i < node.body.items.length; i++)
    {
        if (node.body.items[i].itemUuid === itemUuidToDelete)
        {
            node.body.items.splice(i, 1);
            return true;
        }
    }
    return false;
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

module.exports.ContentNodeManager = internals.ContentNodeManager;
module.exports.getManager = internals.getManager;
