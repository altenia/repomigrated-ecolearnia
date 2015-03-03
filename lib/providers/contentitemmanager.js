var promiseutils = require('../utils/promiseutils');
var uuid = require('node-uuid');

var utils = require('../utils/utils');
var DbUtils = require('../utils/dbutils').DbUtils;
var defaultProvider = require('./defaultprovider');

var contentItemSchema = require('../models/contentitem').getSchema();


// Declararation of namespace for internal module use
var internals = {};


internals.Content = DbUtils.getModel('ContentItem', contentItemSchema);

internals.managerInstance = null;

internals.ContentItemManager = function()
{
    this.contentNodeProvider = defaultProvider.createProvider('ContentNode', 'contentnode', { primaryKey: 'uuid'} );
    this.contentItemProvider = defaultProvider.createProvider('ContentItem', 'contentitem', { primaryKey: 'uuid'} );
}

internals.ContentItemManager.prototype.add = function(contentItem, contextIds)
{
    var self = this;
    var promise = promiseutils.createPromise(function(resolve, reject) {
        
        var nodeCriteria = {
            uuid: contextIds.parentUuid
        }
        this.contentNodeProvider.find(nodeCriteria)
        .then(function(contentNodeModel) {
            
            contentItem.parent = contentNodeModel._id;
            contentItem.parentUuid = contentNodeModel.uuid;

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
}


internals.ContentItemManager.prototype.find = function(criteria, contextIds)
{
    return this.contentItemProvider.find(criteria, contextIds)
}

/**
 * @param {Map.<String, Object>} criteria -  A map of criteria
 */
internals.ContentItemManager.prototype.query = function(criteria, contextIds)
{
    return this.contentItemProvider.query(criteria, contextIds)
}

internals.ContentItemManager.prototype.update = function(criteria, contextIds)
{
    return this.contentItemProvider.update(criteria, contextIds)
}

internals.ContentItemManager.prototype.remove = function(criteria, contextIds)
{
    // Remove in the parent's
    return this.contentItemProvider.remove(criteria, contextIds)
}

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
}

module.exports.getManager = internals.getManager;