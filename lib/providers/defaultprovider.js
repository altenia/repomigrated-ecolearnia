

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
	this.Model_ = DbUtils.getModel(modelName, schema);

	if (config) {
		this.primaryKey_ = config.primaryKey || '_id'; // eg. uuid
		this.autoSetPkIfEmpty_ = config.autoSetPkIfEmpty || true;
	}
}

internals.DefaultProvider.prototype.add = function(resource, contextIds)
{
	// Assign a uuid if absent
	if (this.autoSetPkIfEmpty_ && !resource[this.primaryKey_]) {
		resource[this.primaryKey_] = uuid.v4();
	}

	var promise = promiseutils.createPromise(function(resolve, reject) {

		var resourceModel = new this.Model_(resource);

		// Populate the resource with contextual ids, i.e, the parent resources' ids 
		if (contextIds) {
			utils.dotPopulate(resource, contextIds);
		}

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


internals.DefaultProvider.prototype.find = function(criteria, contextIds)
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


internals.DefaultProvider.prototype.findByPK = function(pk, contextIds)
{
	var criteria = {};
	criteria[this.primaryKey_] = pk;

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

/**
 * @param {Map.<String, Object>} criteria -  A map of criteria
 *        Uses Mongoose's dot notation for the property path
 */
internals.DefaultProvider.prototype.query = function(criteria, contextIds)
{
console.log("--query: " + JSON.stringify(criteria));
	var promise = promiseutils.createPromise(function(resolve, reject) {
		this.Model_.find(criteria, function(error, result){
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

internals.DefaultProvider.prototype.update = function(criteria, resource, contextIds)
{
	var promise = promiseutils.createPromise(function(resolve, reject) {

		this.find(criteria)
		.then(function(resourceModel){

			if (resourceModel) {
				// @todo - pending
				return updateModel(resourceModel);
			} else {
				resolve(null);
			}
		})
		.catch(function(error){
			reject(error);
		});

	}.bind(this));

	return promise; 
}


internals.DefaultProvider.prototype.updateModel = function(resourceModel)
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

internals.DefaultProvider.prototype.remove = function(pk, contextIds)
{
	var criteria = {};
	criteria[this.primaryKey_] = pk;

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