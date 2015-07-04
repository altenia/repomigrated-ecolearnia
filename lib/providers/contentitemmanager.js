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
 *  This file includes logger class.
 *
 * @author Young Suk Ahn Park
 * @date 2/15/15
 */

var uuid = require('node-uuid');

var promiseutils = require('../utils/promiseutils');
var utils = require('../utils/utils');
var logger = require('../utils/logger');
var DbUtils = require('../utils/dbutils').DbUtils;

var ContentHelper = require('./contenthelper').ContentHelper;
var defaultProvider = require('./defaultprovider');
var contentnodemanager = require('./contentnodemanager');

var contentItemSchema = require('../models/contentitem').getSchema();


// Declaration of namespace for internal module use
var internals = {};


internals.Content = DbUtils.getModel('ContentItem', contentItemSchema);

internals.managerInstance = null;

/**
 * @class ContentItemManager
 *
 * @module providers
 *
 * @classdesc
 *  Object of this class provides CRUD operations to Content Item.
 *
 */
internals.ContentItemManager = function()
{
    this.logger_ = logger.Logger.getLogger('ContentItemManager');
    this.contentItemProvider = defaultProvider.createProvider('ContentItem', 'contentitem', { primaryKey: 'uuid'} );
    this.contentNodeManager = null;
};

/**
 * Gets the contentNodeManager
 */
internals.ContentItemManager.prototype.getNodeManager = function()
{
    if (this.contentNodeManager ==  null)
    {
        this.contentNodeManager = contentnodemanager.getManager();
    }
    return this.contentNodeManager;
}


/**
 * Add a content item
 * @param contentItem
 * @param options
 * @returns {*}
 */
internals.ContentItemManager.prototype.add = function(contentItem, options)
{
    var self = this;
    var promise = promiseutils.createPromise(function(resolve, reject) {
        
        var nodeCriteria = {
            uuid: contentItem.parentUuid
        }
        if (!nodeCriteria.uuid) {
            reject('Parent Uuid not specified');
            return;
        }
        // Items must exist as child of a node
        this.getNodeManager().find(nodeCriteria)
        .then(function(parentContentNodeModel) {
            
            ContentHelper.initForCreate(contentItem, null, parentContentNodeModel, 'item');

            // 1. Add item
            self.contentItemProvider.add(contentItem)
            .then(function(newItem) {

                // 2. Create child Item and update the node
                var newChild = {
                    type: "Item",
                    itemUuid: newItem.uuid,
                    item: newItem._id,
                    difficulty: 0.5 // 
                }
                // @todo insert to a specific position
                parentContentNodeModel.body.items.push(newChild);
                return parentContentNodeModel;
            })
            .then(function(modifiedContentNodeModel) {
                // 3. Update the ContentNode resource which now contains 
                // additional child item 
                return self.getNodeManager().updateModel(modifiedContentNodeModel);
            })
            .then(function(savedContentNodeModel) {
                resolve(savedContentNodeModel);
            })
            .catch(function(error) {
                reject(error);
            });

        })
        .catch(function(nodeError) {
            reject(nodeError);
        });

    }.bind(this));

    return promise; 
};

/**
 *
 * @param {Object} options   -
 *      options.fetchAncestors - Whether or not to fetch ancestors
 */
internals.ContentItemManager.prototype.find = function(criteria, options)
{
    //return this.contentItemProvider.find(criteria, options);
    
    var promise = promiseutils.createPromise(function(resolve, reject) {
        this.contentItemProvider.find(criteria, options)
        .then(function(itemModel) {

            if (itemModel) {
                var contentItem = itemModel.toJSON();

                if (options && options.fetchAncestors) {
                    this.getNodeManager().retrieveAncestors(contentItem, options, 0)
                    .then(function(result){
                        resolve(result);
                    }.bind(this))
                    .catch(function(error) {
                        reject(error);
                    });
                } else {
                    resolve(contentItem);
                }
            } else {
                // @todo - convention: all provides and managers when not
                //  found returns null
                // Not found
                resolve(null);
            }
        }.bind(this))
        .catch(function(error) {
            reject(error);
        });

    }.bind(this));

    return promise; 
};

internals.ContentItemManager.prototype.findByPK = function(pk, options)
{
    var criteria = {};
    criteria[this.contentItemProvider.primaryKey_] = pk;
    return this.find(criteria, options);
};

/**
 * @param {Map.<String, Object>} criteria -  A map of criteria
 */
internals.ContentItemManager.prototype.query = function(criteria, options)
{
    return this.contentItemProvider.query(criteria, options);
};

internals.ContentItemManager.prototype.update = function(criteria, resource, options)
{
    return this.contentItemProvider.update(criteria, resource, options);
};

/**
 * Removes an item and updates it's parents accordinlgy
 * Manual test OK.
 */
internals.ContentItemManager.prototype.remove = function(criteria, options)
{

    var promise = promiseutils.createPromise(function(resolve, reject) {
        // @todo - Remove in the parent's
        this.contentItemProvider.query(criteria, options)
        .then(function(items) {

            // @todo make it synchronous
            for (var i=0; i < items.length; i++)
            {
                var currItem = items[i];
                this.getNodeManager().findByPK(currItem.parentUuid)
                .then(function(parentModel) {

                    if (contentnodemanager.ContentNodeManager.deleteItemEntry(parentModel, currItem.uuid))
                    {
                        parentModel.save(function(error) {
                            if(error) {
                                this.logger_.error({error: error}, 'Error saving updated parent');
                            } else {
                                this.logger_.info('Parent updated');

                                this.contentItemProvider.removeByPK(currItem.uuid, options)
                                .then(function(data){
                                    this.logger_.info('Item removed');
                                }.bind(this))
                                .catch(function(error) {
                                    this.logger_.error({error: error}, 'Error removing item' + currItem.uuid);
                                }.bind(this));
                            }
                        }.bind(this));
                    }
                }.bind(this));
                
            }

            resolve(items.length);
            
        }.bind(this))
        .catch(function(error) {
            reject(error)
        });
    }.bind(this));

    return promise;
};



/**
 * moves a node to another parent
 * @param {string} uuid - the uuid of the node to move
 * @param {Object} to -   {parent, position}
 */
internals.ContentItemManager.prototype.changeLocation = function(uuid, to, options)
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
            self.getNodeManager().findByPK(content.parentUuid)
            .then(function(parentNodeModel) {
                origParentModel = parentNodeModel;
                // @todo - change it's position within it's parent

                if (content.parentUuid === to.parentUuid) {
                    resolve(content);
                } else {
                    return self.getNodeManager().findByPK(to.parentUuid);
                }
            })
            .then(function(newParentNodeModel) {
                // Attach to the new parent
                contentnodemanager.ContentNodeManager.insertItemEntry(newParentNodeModel, content);
    
                return self.getNodeManager().updateModel(newParentNodeModel);
            })
            .then(function(updatedNewParentNodeModel) {
                // Update content's parent reference
                content.parent = updatedNewParentNodeModel._id;
                content.parentUuid = updatedNewParentNodeModel.uuid;

                delete content._id;; // otherwise MongoDB will complain
                return self.contentItemProvider.update({uuid: content.uuid}, content);
            })
            .then(function(updatedContentModel) {
                // Detach from original parent
                contentnodemanager.ContentNodeManager.deleteItemEntry(origParentModel, content.uuid);
                return self.getNodeManager().updateModel(origParentModel);
            })
            .then(function(updatedOrigParentModel) {
                // Retrieve new ancestors
                return self.getNodeManager().retrieveAncestors(content, {}, 0);
            })
            .then(function(contentItem) {
                // Return the content with new ancestors
                resolve(contentItem);
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
 * Factory method
 */
internals.getManager = function()
{
    if (!internals.managerInstance)
    {
        internals.managerInstance = new internals.ContentItemManager();
    }
    return internals.managerInstance;
};

module.exports.getManager = internals.getManager;