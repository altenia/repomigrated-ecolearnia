var Promise = require('promise');
var uuid = require('node-uuid');

var DbUtils = require('./dbutils').DbUtils;
var contentSchema = require('./models/content').getSchema();


// Declararation of namespace for internal module use
var internals = {}


internals.Content = DbUtils.getModel('Content', contentSchema);

internals.contentManagerInstance = null;

internals.ContentManager = function()
{
	
}

internals.ContentManager.prototype.add = function(content)
{
	// Assign a guid if absent
	if (!content.guid) {
		content.guid = uuid.v4();
	}

	var newContent = new internals.Content(content);

	var promise = new Promise(function(resolve, reject) {
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


internals.ContentManager.prototype.find = function(guid)
{
	var promise = new Promise(function(resolve, reject) {
		internals.Content.findOne({guid: guid}, function(error, content){
			if(error) {
		        reject(error);
		    } else {
		        resolve(content);
		    }
		});
	});

	return promise; 
}


internals.ContentManager.prototype.query = function()
{

}

internals.ContentManager.prototype.update = function(content)
{
	var promise = new Promise(function(resolve, reject) {

		content.save(function(error) {
		    if(error) {
		        reject(error);
		    } else {
		        resolve(content);
		    }
		});
	});

	return promise; 
}

internals.ContentManager.prototype.delete = function(guid)
{
	var promise = new Promise(function(resolve, reject) {
		internals.Content.remove({guid: guid}, function(error, content) {
			if(error) {
		        reject(error);
		    } else {
		        resolve(content);
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