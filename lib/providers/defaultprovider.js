

var lodash = require('lodash');
var uuid = require('node-uuid');

var promiseutils = require('../utils/promiseutils');
var DbUtils = require('../utils/dbutils').DbUtils;


// Declaration of namespace for internal module use
var internals = {};


/**
 * Limitation, the primaryKey property must reside in the rool level
 */
internals.DefaultProvider = function(modelName, schema, config)
{
	this.modelName = modelName;
	this.Model_ = DbUtils.getModel(modelName, schema);

	if (config) {
		this.primaryKey_ = config.primaryKey || '_id'; // eg. uuid
		this.autoSetPkIfEmpty_ = config.autoSetPkIfEmpty || true;
	}
}

internals.DefaultProvider.prototype.add = function(resource, options)
{
	// Assign a uuid if absent
	if (this.autoSetPkIfEmpty_ && !resource[this.primaryKey_]) {
		resource[this.primaryKey_] = uuid.v4();
	}

	var promise = promiseutils.createPromise(function(resolve, reject) {

		var resourceModel = new this.Model_(resource);

		resourceModel.save(function(error){
		    if(error) {
		        reject(error);
		    } else {
		        resolve(resourceModel);
		    }
		});
	}.bind(this));

	return promise; 
}


internals.DefaultProvider.prototype.find = function(criteria, options)
{
console.log("--c: " + JSON.stringify(criteria));

	var promise = promiseutils.createPromise(function(resolve, reject) {
		this.Model_.findOne(criteria, function(error, result){
console.log("--query-E: " + JSON.stringify(error));
console.log("--query-R: " + JSON.stringify(result));
			if(error) {
		        reject(error);
		    } else {
		        resolve(result);
		    }
		});
	}.bind(this));

	return promise; 
}


internals.DefaultProvider.prototype.findByPK = function(pk)
{
	var criteria = {};
	criteria[this.primaryKey_] = pk;

	return this.find(criteria);
}

/**
 * @param {Map.<String, Object>} criteria -  A map of criteria
 *        Uses Mongoose's dot notation for the property path
 * @param {Object} options
 *		options.sort, 
 *		options.offset, 
 *		options.limit
 */
internals.DefaultProvider.prototype.query = function(criteria, options)
{
console.log("--query: " + JSON.stringify(criteria));
	options = options || {};
	var offset = options.offset || 0;
	var limit  = options.limit || 20;
	// @todo - pagination
	var promise = promiseutils.createPromise(function(resolve, reject) {
		this.Model_.find(criteria)
    		.skip(offset)
			.limit(limit)
    		.exec(function(error, result) {
	    			if(error) {
			        reject(error);
			    } else {
			        resolve(result);
			    }
			});

		/*
		this.Model_.find(criteria, function(error, result){
console.log("--query-E: " + JSON.stringify(error));
console.log("--query-R: " + JSON.stringify(result));
			if(error) {
		        reject(error);
		    } else {
		        resolve(result);
		    }
		});
		*/
	}.bind(this));

	return promise; 
}

internals.DefaultProvider.prototype.update = function(criteria, resource, options)
{
	var promise = promiseutils.createPromise(function(resolve, reject) {

		/*
		this.find(criteria)
		.then(function(resourceModel){

			if (resourceModel) {
				// @todo - test pending
				return this.updateModel(resourceModel);
			} else {
				resolve(null);
			}
		}.bind(this))
		.catch(function(error){
			reject(error);
		});
		*/

		// http://stackoverflow.com/questions/7267102/how-do-i-update-upsert-a-document-in-mongoose
		this.Model_.findOneAndUpdate(criteria, resource, {upsert:false}, function(error, doc){
		    if (error) {
		    	reject(error);
		    } else {
		    	resolve(doc);
		    }
		});
	}.bind(this));

	return promise; 
}


internals.DefaultProvider.prototype.updateModel = function(resourceModel, options)
{
	var promise = promiseutils.createPromise(function(resolve, reject) {

		resourceModel.save(function(error) {
		    if(error) {
		        reject(error);
		    } else {
		        resolve(resourceModel);
		    }
		});
	}.bind(this));

	return promise; 
}

/**
 * remove
 * 
 * Removes a resource
 */
internals.DefaultProvider.prototype.remove = function(criteria, options)
{
	var promise = promiseutils.createPromise(function(resolve, reject) {
		this.Model_.remove(criteria, function(error, result) {
			if(error) {
		        reject(error);
		    } else {
		        resolve(result);
		    }
		});
	}.bind(this));

	return promise; 
}


/**
 * removeByPK
 * 
 * Removes a resource by PrimaryKey
 */
internals.DefaultProvider.prototype.removeByPK = function(pk, options)
{
	var criteria = {};
	criteria[this.primaryKey_] = pk;

	return this.remove(criteria);
}


/**
 * Factory method
 */
internals.createProvider = function(modelName, schema, config)
{
	var schemaObj = null;
	if (lodash.isObject(schema)) {
		schemaObj = schema;
	} else if (lodash.isString(schema)){
		schemaObj = require('../models/' + schema).getSchema();
	}

	return new internals.DefaultProvider(modelName, schemaObj, config);
}

module.exports.createProvider = internals.createProvider;