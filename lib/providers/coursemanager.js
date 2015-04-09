
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

internals.CourseManager.prototype.getAssignmentNodeProvider = function()
{
    return this.assignmentNodeProvider;
}

internals.CourseManager.prototype.getAssignmentItemProvider = function()
{
    return this.assignmentItemProvider;
}


internals.CourseManager.prototype.add = function(course, contextIds)
{
    var self = this;
    var promise = promiseutils.createPromise(function(resolve, reject) {

        if (!course.contentNodeUuid) {
            var exception = new exception.Exception('BadRequest', 400, 'Missing contentNodeUuid');
            reject(exception);
        } else {
            
            var contentNodeCriteria = {
                uuid: course.contentNodeUuid
            }
            this.contentNodeProvider.find(contentNodeCriteria)
            .then(function(contentNodeModel) {

                if (!contentNodeModel) {
                    var exception = new exception.Exception('NotFound', 404, 'ContentNode not found.');
                    reject(exception);
                } else {
                    var contentNode = contentNodeModel.toObject({ getters: true });
                
                    // Check that the couseNode is of kind 'CourseTemplate'
                    course.contentNode = contentNodeModel._id;
                    course.contentNodeUuid = contentNodeModel.uuid;
                    if (!course.learningArea) {
                        course.learningArea = contentNode.metadata.learningArea;
                    }
                    if (!course.title) {
                        course.title = contentNode.metadata.title;
                    }
console.log("** 1 - Creating course");
                    return self.courseProvider.add(course);
                }
            })
            .then(function(courseModel) {
                //   
console.log("** 2 - createCourseStructure_");
                self.createCourseStructure_(courseModel)
                .then(function(courseModel) {

console.log("** 2.1 - createCourseStructure_:completed, returning");
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
    return this.courseProvider.find(criteria, contextIds)
}

/**
 * @param {Map.<String, Object>} criteria -  A map of criteria
 */
internals.CourseManager.prototype.query = function(criteria, contextIds, sort, offset, limit)
{
    return this.courseProvider.query(criteria, contextIds, sort, offset, limit)
}

internals.CourseManager.prototype.update = function(criteria, contextIds)
{
    return this.courseProvider.update(criteria, contextIds)
}

internals.CourseManager.prototype.remove = function(criteria, contextIds)
{
    // Remove in the parent's
    return this.courseProvider.remove(criteria, contextIds)
}

/********** Private methos **********/

/**
 * Traverse the tree and construct a new tree under Course
 */
internals.CourseManager.prototype.createCourseStructure_ = function(courseModel)
{
    var self = this;
    var promise = promiseutils.createPromise(function(resolve, reject) {
        // Retrieve children of the course's contentNode
        var subContentNodesCriteria = {
            parent: courseModel.contentNode
        };

console.log("** 3 - Retrieving subNodes");
        self.contentNodeProvider.query(subContentNodesCriteria)
        .then(function(subNodeModels){

            // Ther MUST be some SubNodes from course,
            // Otherwise the course is pointing
            if (subNodeModels) {
                // @todo: Make this sequential
console.log("** 3.1 - subNodeModels.forEach[" + subNodeModels.length +"]");
                subNodeModels.forEach(function(subNodeModel, index, array) {
                    
                    // Create the AssignmentNode counterpart
                    var assignmentNode = subNodeModel.toObject({getters: true});
console.log("** 3.1.0 - on subNodeMode[" + subNodeModel.uuid + "]");
                    assignmentNode._id = null;
                    assignmentNode.uuid = null;
                    assignmentNode.copiedFrom = subNodeModel._id;
                    assignmentNode.course = courseModel._id;
                    assignmentNode.courseUuid = courseModel.uuid;
                    assignmentNode.parent = courseModel._id;
                    assignmentNode.parentUuid = courseModel.uuid;
                    
                    self.assignmentNodeProvider.add(assignmentNode)
                    .then(function(assignmentNodeModel){
console.log("** 3.1.1 - createCourseStructureRecursive_");
                        return self.createCourseStructureRecursive_(subNodeModel, assignmentNodeModel);
                    })
                    .then(function(assignmentNodeModel){
console.log("** 3.1.2 - createCourseStructureRecursive_:completed");
                        // done
                    })
                    .catch(function(error) {
                        reject(error);
                    });
                });
console.log("** 3.2 - subNodeModels.forEach:completed, returning");
                resolve(courseModel);
            } else {
                // No Assignments found!!
                resolve(courseModel);
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
 * @param {Object} contentNodeModel  - the contentNode model
 * @param {Object} assignmentNodeModel  - the assignmentNode associated to the contentNode
 */
internals.CourseManager.prototype.createCourseStructureRecursive_ = function(contentNodeModel, assignmentNodeModel)
{
    var self = this;
    var promise = promiseutils.createPromise(function(resolve, reject) {
        var assignmentNode = contentNodeModel.toObject({getters: true});

console.log("** 4 - Handle a subNode");
        // Serialse the processing of child items and childe nodes
        async.series([
            // First serial function
            function processItems(seriesCallback) {
                if (contentNodeModel.body.items && contentNodeModel.body.items.length > 0)
                {
console.log("** 4.1 - Iterating " + contentNodeModel.body.items.length + " items");

                    function processEachItem(contentItemEntry, eachCallback) {
                        // 1. Retrieve the contentItem by item
                        self.contentItemProvider.findByPK(contentItemEntry.itemUuid)
                        .then(function(contentItemModel){

                            if (contentItemModel) {

                                // 2. Create an AssignmentItem based on contentItemModel
                                var subAssignmentItem =  contentItemModel.toObject({getters: true});
                                subAssignmentItem._id = null;
                                subAssignmentItem.uuid = null;
                                subAssignmentItem.copiedFrom = contentItemModel._id;
                                subAssignmentItem.course = assignmentNodeModel.course;
                                subAssignmentItem.courseUuid = assignmentNodeModel.courseUuid;

                                // 3. Assign assignmentItem.parent = assignmentNodeModel._id
                                subAssignmentItem.parent = assignmentNodeModel._id;
                                subAssignmentItem.parentUuid = assignmentNodeModel.uuid;
                                
                                // 4. Save assignmentItem
                                return self.assignmentItemProvider.add(subAssignmentItem, null)
                            } else {
                                // @todo - throw 404
                                throw new Error('NotFound');
                            }
                        })
                        .then(function(subAssignmentItemModel){
console.log("** 4.1.1 - Added item:" + subAssignmentItemModel._id);
                            eachCallback();
                        })
                        .catch(function(error) {
console.log("** 4.1.2 - Add item falied: " + JSON.stringify(error));
                            eachCallback(error);
                        });


                    };

                    // add items to assignmentNodeModel
                    async.each(contentNodeModel.body.items, processEachItem, function(err){
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
                var subNodesCriteria = {
                    parent: contentNodeModel._id
                };

                self.contentNodeProvider.query(subNodesCriteria)
                .then(function(subNodeModels){
                    if (subNodeModels) {

console.log("** 4.2 - Iterating subnodes");

                        function processEachNode(contentSubNodeModel, eachCallback) {

                            // 1. Create a subAssignmentNode based on contentItem
                            var subAssignmentNode = contentSubNodeModel.toObject({getters: true});
                            subAssignmentNode.uuid = null; // remove the contentNode's uuid so it is autogenerated
                            subAssignmentNode.course = assignmentNodeModel.course;
                            subAssignmentNode.courseUuid = assignmentNodeModel.courseUuid;
                            subAssignmentNode.copiedFrom = contentSubNodeModel._id;

                            // 2. Assign assignmentItem.parent = assignmentNode
                            subAssignmentNode.parent = subAssignmentNode._id;
                            subAssignmentNode.parentUuid = subAssignmentNode.uuid;

                            // 3. Save assignmentItem

console.log("** 4.2.1 - Adding assignment of contentNode " + subAssignmentNode);
                            self.assignmentNodeProvider.add(subAssignmentNode, null)
                            .then(function(subAssignmentNode){

                                // 4. Recurse
                                self.createCourseStructureRecursive_(contentSubNodeModel, subAssignmentNode)
                                .then(function(){
console.log("** 4.2.1 - Added item:" + subAssignmentItemModel._id);
                                    eachCallback();
                                })
                                .catch(function(error) {
console.log("** 4.1.1 - Added item:" + subAssignmentItemModel._id);
                                    eachCallback(error);
                                });

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
                resolve(assignmentNode);
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
        internals.managerInstance = new internals.CourseManager();
    }
    return internals.managerInstance;
}

module.exports.getManager = internals.getManager;