var promiseutils = require('../utils/promiseutils');
var uuid = require('node-uuid');

var DbUtils = require('../utils/dbutils').DbUtils;
var contentNodeSchema = require('../models/contentnode').getSchema();


// Declararation of namespace for internal module use
var internals = {};


internals.Content = DbUtils.getModel('ContentNode', contentNodeSchema);

internals.contentManagerInstance = null;

internals.ContentNodeManager = function()
{
	
}

internals.ContentNodeManager.prototype.add = function(contentItem)
{
	// Assign a uuid if absent
	if (!contentItem.uuid) {
		contentItem.uuid = uuid.v4();
	}

	var newContent = new internals.Content(contentItem);

	var promise = promiseutils.createPromise(function(resolve, reject) {
		newContent.save(function(error){
		    if(error) {
		        reject(error);
		    } else {
		        resolve(newContent);
		    }
		});
	});

	return promise; 
}


internals.ContentNodeManager.prototype.find = function(criteria)
{
	var promise = promiseutils.createPromise(function(resolve, reject) {
		internals.Content.findOne(criteria, function(error, result){
console.log("*E*" + JSON.stringify(error));
console.log("*R*" + JSON.stringify(result));
			if(error) {
		        reject(error);
		    } else {
		        resolve(result);
		    }
		});
	});

	return promise; 
}

/**
 * @param {Map.<String, Object>} criteria -  A map of criteria
 */
internals.ContentNodeManager.prototype.query = function(criteria)
{
	var promise = promiseutils.createPromise(function(resolve, reject) {
		internals.Content.find(null, function(error, result){
			if(error) {
		        reject(error);
		    } else {
		        resolve(result);
		    }
		});
	});

	return promise; 
}

internals.ContentNodeManager.prototype.update = function(contentItem)
{
	var promise = promiseutils.createPromise(function(resolve, reject) {

		contentItem.save(function(error) {
		    if(error) {
		        reject(error);
		    } else {
		        resolve(contentItem);
		    }
		});
	});

	return promise; 
}

internals.ContentNodeManager.prototype.delete = function(uuid)
{
	var promise = promiseutils.createPromise(function(resolve, reject) {
		internals.Content.remove({uuid: uuid}, function(error, contentItem) {
			if(error) {
		        reject(error);
		    } else {
		        resolve(contentItem);
		    }
		});
	});

	return promise; 
}

/**
 * Factory method
 */
internals.getManager = function()
{
	if (!internals.contentManagerInstance)
	{
		internals.contentManagerInstance = new internals.ContentNodeManager();
	}
	return internals.contentManagerInstance;
}

module.exports.getManager = internals.getManager;