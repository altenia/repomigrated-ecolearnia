var promiseutils = require('./utils/promiseutils');
var uuid = require('node-uuid');

var DbUtils = require('./dbutils').DbUtils;
var contentNodeSchema = require('./models/contentnode').getSchema();
var contentItemSchema = require('./models/contentitem').getSchema();


// Declararation of namespace for internal module use
var internals = {}


internals.Content = DbUtils.getModel('ContentItem', contentItemSchema);

internals.contentManagerInstance = null;

internals.ContentManager = function()
{
	
}

internals.ContentManager.prototype.add = function(contentItem)
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
//console.log('** ' + JSON.stringify(newContent));
		        resolve(newContent);
		    }
		});
	});

	return promise; 
}


internals.ContentManager.prototype.find = function(uuid)
{
	var promise = promiseutils.createPromise(function(resolve, reject) {
		internals.Content.findOne({uuid: uuid}, function(error, result){
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
internals.ContentManager.prototype.query = function(criteria)
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

internals.ContentManager.prototype.update = function(contentItem)
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

internals.ContentManager.prototype.delete = function(uuid)
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
internals.getContentManager = function()
{
	if (!internals.contentManagerInstance)
	{
		internals.contentManagerInstance = new internals.ContentManager();
	}
	return internals.contentManagerInstance;
}

module.exports.getContentManager = internals.getContentManager;