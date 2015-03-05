
var uuid = require('node-uuid');
var async = require('async');

var promiseutils = require('../utils/promiseutils');
var exception = require('../utils/exception');
var utils     = require('../utils/utils');
var DbUtils   = require('../utils/dbutils').DbUtils;
var defaultProvider = require('./defaultprovider');

var contentItemSchema = require('../models/contentitem').getSchema();


// Declararation of namespace for internal module use
var internals = {};


internals.Content = DbUtils.getModel('ContentItem', contentItemSchema);

internals.managerInstance = null;

internals.CourseManager = function()
{
    this.contentNodeProvider = defaultProvider.createProvider('ContentNode', 'contentnode', { primaryKey: 'uuid'} );
    this.contentItemProvider = defaultProvider.createProvider('ContentItem', 'contentitem', { primaryKey: 'uuid'} );

    this.assignmentNodeProvider = defaultProvider.createProvider('AssignmentNode', 'assignmentnode', { primaryKey: 'uuid'} );
    this.assignmentItemProvider = defaultProvider.createProvider('AssignmentItem', 'assignmentitem', { primaryKey: 'uuid'} );
    this.courseProvider = defaultProvider.createProvider('Course', 'course', { primaryKey: 'uuid'} );
}


internals.CourseManager.prototype.add = function(course, contextIds)
{
    var self = this;
    var promise = promiseutils.createPromise(function(resolve, reject) {

        if (!course.contentNode) {
            var exception = new Exception('E-BadRequest', 400, 'Missing contentNode');
            reject(exception);
        } else {
            
            var nodeCriteria = {
                uuid: course.contentNode
            }
            this.contentNodeProvider.find(nodeCriteria)
            .then(function(contentNodeModel) {
                
                // Check that the couseNode is of kind 'CourseTemplate'
                course.courseNode = contentNodeModel._id;
                return self.courseProvider.add(course);
            })
            .then(function(courseModel) {
                //   
                self.createCourseStructure_(courseModel)
                .then(function(courseModel) {

                    resolve(courseModel);
                })
                .catch(function(error) {
                    reject(error);
                });

            })
            .catch(function(nodeError) {
                reject(nodeError);
            });
        }

    }.bind(this));

    return promise; 
}


internals.CourseManager.prototype.find = function(criteria, contextIds)
{
    return this.contentItemProvider.find(criteria, contextIds)
}

/**
 * @param {Map.<String, Object>} criteria -  A map of criteria
 */
internals.CourseManager.prototype.query = function(criteria, contextIds)
{
    return this.contentItemProvider.query(criteria, contextIds)
}

internals.CourseManager.prototype.update = function(criteria, contextIds)
{
    return this.contentItemProvider.update(criteria, contextIds)
}

internals.CourseManager.prototype.remove = function(criteria, contextIds)
{
    // Remove in the parent's
    return this.contentItemProvider.remove(criteria, contextIds)
}

/********** Private methos **********/

/**
 * Traverse the tree and construct a new tree under Course
 */
internals.CourseManager.prototype.createCourseStructure_ = function(courseModel)
{
    var self = this;
    var promise = promiseutils.createPromise(function(resolve, reject) {
        var subNodesCriteria = {
            parent = courseModel._id;
        };

        self.contentNodeProvider.query(subNodesCriteria)
        .then(function(subNodeModels){

            if (subNodeModels) {
                subNodeModels.forEach(function(subNodeModel, index, array) {
                    
                    self.createAssignmentNodeStructureRecursive_(subNodeModel)
                    .then(function(assignmentNodeModel){
                        assignmentNodeModel.
                    })
                    .catch(function(error) {
                        reject(error);
                    });
                });
            }
        })
        .catch(function(error) {
            reject(error);
        });

    }.bind(this));

    return promise; 
}

/**
 * Depth -first traversal
 */
internals.CourseManager.prototype.createCourseStructureRecursive_ = function(nodeModel)
{
    var self = this;
    var promise = promiseutils.createPromise(function(resolve, reject) {
        var subNodesCriteria = {
            parent = courseModel._id;
        };

        self.contentNodeProvider.query(subNodesCriteria)
        .then(function(subNodeModels){
            var assignmentNode = nodeModel.toObject({getters: true});

            // Serialse the processing of child items and childe nodes
            async.series([
                // First serial function
                function processItems(seriesCallback) {
                    if (nodeModel.body.items && nodeModel.body.items.length > 0)
                    {
                        assignmentNode = nodeModel.toObject({getters: true});

                        function processEachItem(contentItem, eachCallback) {
                            // 1. Retrieve the contentItem by item
                            // 2. Create an AssignmentItem based on contentItem
                            // 3. Assign assignmentItem.parent = assignmentNode
                            // 4. Save assignmentItem
                        };

                        // add items to assignmentNode
                        async.each(nodeModel.body.items, processEachItem, function(err){
                            if (err) {
                                seriesCallback(err, null);
                            } else {
                                // callback to async.series
                                seriesCallback(null, assignmentNode);
                            }
                        });

                    } else {
                        // callback to async.series
                        seriesCallback(null, assignmentNode);
                    }
                },
                // Second serial function
                function processSubNodes(seriesCallback) {
                    if (subNodeModels) {
                        if (!assignmentNode) {
                            assignmentNode =  = nodeModel.toObject({getters: true});
                        }

                        function processEachNode(contentNodeModel, eachCallback) {
                            // 1. Create a subAssignmentNode based on contentItem
                            var subAssignmentNode = contentNodeModel.toObject({getters: true});
                            // 2. Assign assignmentItem.parent = assignmentNode
                            subAssignmentNode.parent = nodeModel._id;
                            subAssignmentNode.parentUuid = nodeModel.uuid;
                            // 3. Save assignmentItem
                            self.assignmentNodeProvider.add(subAssignmentNode, null)
                            .then(function(subAssignmentNode){
                                eachCallback();
                            })
                            .catch(function(error) {
                                eachCallback(error);
                            });

                        };

                        // add items to assignmentNode
                        async.each(subNodeModels, processEachNode, function(err){
                            if (err) {
                                seriesCallback(err, null);
                            } else {
                                // callback to async.series
                                seriesCallback(null, assignmentNode);
                            }
                        });
                    } else {
                        // callback to async.series
                        seriesCallback(null, assignmentNode);
                    }
                }
            ],
            // Async.series result
            function(err, results){
                if (err) {
                    reject(err);
                } else {
                    resolve(assignmentNode);
                }
            });
            
        })
        .catch(function(error) {
            reject(error);
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
        internals.managerInstance = new internals.CourseManager();
    }
    return internals.managerInstance;
}

module.exports.getManager = internals.getManager;