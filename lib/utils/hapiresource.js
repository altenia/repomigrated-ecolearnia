
var utils = require('./utils');
var Logger = require('./logger').Logger;

// Declare internals namespace

var internals = {};

/**
 *
 * @param {!string}   basePath
 * @param {!string}   name
 * @param {!Provider} provider  - The resource provider
 * @param {Object=}   criteriaKeyDictionary
 */
internals.HapiResource = function(basePath, name, provider, criteriaKeyDictionary)
{

    this.logger_ = Logger.getLogger('HapiResource:' + name);

    this.basePath_ = basePath || '';
    if (this.basePath_.length > 0 && !utils.endsWith(this.basePath_, '/')) {
        this.basePath_ += '/';
    }

    this.name_ = name;

    this.logger_.info({name: name, basePath: this.basePath_},  'Initializing HapiResource');

    this.provider_ = provider;
    this.criteriaKeyDictionary_ = criteriaKeyDictionary || {};

    this.parentResource_ = null;
    this.subResources_ = {};
    
};

internals.HapiResource.prototype.getName = function() {
    return this.name_;
}

/**
 * Translates the query criteria from by changing each of params's name as 
 * specified in the criteriaKeyDictionary_.
 * Those parameter names that starts with underscore is skipped.
 * @param {Object} params  - Resource that will be 
 */
internals.HapiResource.prototype.translateQueryCriteria = function(request)
{
    var criteria = {};

    var self = this;
    function translate(object) {
        for (var property in object) {
            if (object.hasOwnProperty(property)) {
                if (utils.startsWith(property, '_')) {
                    continue;
                }
                if (self.criteriaKeyDictionary_.hasOwnProperty(property)) {
                    criteria[self.criteriaKeyDictionary_[property]] = object[property];
                } else {
                    criteria[property] = object[property];
                }
            }
        }
    };
    translate(request.params);
    translate(request.query);

    return criteria;
}

/**
 * @param {HapiResource} parentResource  - Resource that will be 
 */
internals.HapiResource.prototype.setParent_ = function(parentResource)
{
    this.parentResource_ = parentResource;
}

/**
 * @param {HapiResource} subResource  - Resource that will be 
 */
internals.HapiResource.prototype.addSubResource = function(subResource)
{
    this.subResources_[subResource.getName()] = subResource;
    subResource.setParent_(this);
}

/**
 * Returns the RESTy context path traversing the parents.
 * E.g. given resource 'activity' with parents 'project', and 'task', it will return
 * project/{projectId}/task/{taskId}/activity/
 */
internals.HapiResource.prototype.getContextPath = function()
{
    var paths = [];

    var ptr = this; // iterator
    while(ptr.parentResource_)
    {
        paths.unshift(ptr.parentResource_.basePath_ + ptr.parentResource_.getName() 
            + '/{' + ptr.parentResource_.getName()+ 'Id}/');
        ptr = ptr.parentResource_;
    }
    paths.push(this.basePath_ + this.getName());
    return '/' + paths.join('');
}


/**
 * Creates and registers the standard routes
 *
 * @param {Object} server  - The Hapi server
 */
internals.HapiResource.prototype.registerRoutes = function(server)
{
    this.registerRoutesRecursive_(server, this);
}

/**
 * Creates and registers the standard routes
 *
 * @param {Object} server  - The Hapi server
 */
internals.HapiResource.prototype.registerRoutesRecursive_ = function(server, ptr)
{
    if (ptr.parentResource_)
    {
        ptr.registerRoutesRecursive_(server, ptr.parentResource_)
    }

    var contextPath = ptr.getContextPath();

    ptr.logger_.info({contextPath: contextPath}, 'Registering resource routes');

    // List
    server.route({
        method: 'GET',
        path: contextPath,
        handler: function(request, reply) {

            var criteria = this.translateQueryCriteria(request);

            var response = null;
            var status = 201;

            try {
                // @todo - Validate the content
                ptr.provider_.query(criteria)
                .then(function(resource){
                    response = resource;
                    logCompletion(ptr.logger_, 'GET:succeeded', contextPath, status);
                })
                .catch(function(error){
                    response = error;
                    status = 500;
                    logCompletion(ptr.logger_, 'GET:error', contextPath, status, error);
                })
                .finally(function(){
                    reply(response, status);
                });
            } catch (except) {
                response = except.stack;
                status = 500;
                logCompletion(ptr.logger_, 'GET:failed', contextPath, status, error);
                reply(response, status);
            }
        }.bind(this)
    });

    // Retrieve
    server.route({
        method: 'GET',
        path: contextPath + '/{id}',
        handler: function(request, reply) {
            var criteria = this.translateQueryCriteria(request);

            var response = null;
            var status = 201;

            try {
                // @todo - Validate the content
                ptr.provider_.find(criteria)
                .then(function(resource){
                    response = resource;
                    if (!response) {
                        status = 404;
                    }
                    logCompletion(ptr.logger_, 'GET:succeeded', contextPath, status);
                })
                .catch(function(error){
                    response = error;
                    status = 500;
                    logCompletion(ptr.logger_, 'GET:error', contextPath, status, error);
                })
                .finally(function(){
                    reply(response, status);
                });
            } catch (except) {
                response = except.stack;
                status = 500;
                logCompletion(ptr.logger_, 'GET:failed', contextPath, status, error);
                reply(response, status);
            }
        }.bind(this)
    });

    // Add contentItem
    server.route({
        path: contextPath,
        method: 'POST',
        handler: function(request, reply) {
            var resource = request.payload;

            var response = null;
            var status = 201;

            try {
                // @todo - Validate the contentItem
                var promise = ptr.provider_.add(resource);
                promise.then(function(resource){
                    response = resource;
                    logCompletion(ptr.logger_, 'GET:succeeded', contextPath, status);
                })
                .catch(function(error){
                    response = error;
                    status = 500;
                    logCompletion(ptr.logger_, 'GET:error', contextPath, status, error);
                })
                .finally(function(){
                    reply(response, status);
                });
            } catch (except) {
                response = except.stack;
                status = 500;
                logCompletion(ptr.logger_, 'GET:failed', contextPath, status, error);
                reply(response, status);
            }
        }.bind(this)
    });

    // Add contentItem
    server.route({
        path: contextPath + '/{id}',
        method: 'PUT',
        handler: function(request, reply) {
            var resource = request.payload;

            var response = null;
            var status = 201;

            try {
                // @todo - Validate the contentItem
                var promise = ptr.provider_.update(resource);
                promise.then(function(resource){
                    response = resource;
                    logCompletion(ptr.logger_, 'GET:succeeded', contextPath, status);
                })
                .catch(function(error){
                    response = error;
                    status = 500;
                    logCompletion(ptr.logger_, 'GET:error', contextPath, status, error);
                })
                .finally(function(){
                    reply(response, status);
                });
            } catch (except) {
                response = except.stack;
                status = 500;
                logCompletion(ptr.logger_, 'GET:failed', contextPath, status, error);
                reply(response, status);
            }
        }.bind(this)
    });

};

function logCompletion(logger, message, contextPath, status, error) {
    var logObj = {
        contextPath: contextPath,
        status: status,
    };
    if (error) {
        Logger.logCompletion(logger, error, message, logObj);
    } else {
        logger.info(logObj, message);
    }
}

module.exports.HapiResource = internals.HapiResource;