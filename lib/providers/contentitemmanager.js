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
    this.contentNodeProvider = defaultProvider.createProvider('ContentNode', 'contentnode', { primaryKey: 'uuid'} );
    this.contentItemProvider = defaultProvider.createProvider('ContentItem', 'contentitem', { primaryKey: 'uuid'} );
};

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
        this.contentNodeProvider.find(nodeCriteria)
        .then(function(contentNodeModel) {
            
            contentItem.parent = contentNodeModel._id;
            contentItem.parentUuid = contentNodeModel.uuid;

            // 1. Add item
            if (!contentItem.refName) {
                contentItem.refName = contentItem.uuid || contentItem.metadata.title;
            }
            self.contentItemProvider.add(contentItem)
            .then(function(newItem) {

                // 2. Create child Item and update the node
                var newChild = {
                    type: "Item",
                    itemUuid: newItem.uuid,
                    item: newItem._id,
                    difficulty: 0.5 // 
                }
                contentNodeModel.body.items.push(newChild);
                return contentNodeModel;

            })
            .then(function(modifiedContentNodeModel) {
                // 3. Update the ContentNode resource which now contains 
                // additional child item 
                self.contentNodeProvider.updateModel(modifiedContentNodeModel)
                .then(function(savedContentNodeModel) {
                    resolve(savedContentNodeModel);
                })
                .catch(function(error) {
                    reject(error);
                });     
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


internals.ContentItemManager.prototype.find = function(criteria, options)
{
    return this.contentItemProvider.find(criteria, options);
};

internals.ContentItemManager.prototype.findByPK = function(pk, options)
{
    return this.contentItemProvider.findByPK(pk, options);
};

/**
 * @param {Map.<String, Object>} criteria -  A map of criteria
 */
internals.ContentItemManager.prototype.query = function(criteria, options)
{
    return this.contentItemProvider.query(criteria, options);
};

internals.ContentItemManager.prototype.update = function(criteria, options)
{
    return this.contentItemProvider.update(criteria, options);
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
                this.contentNodeProvider.findByPK(currItem.parentUuid)
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