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
 *  This file includes definition of HapiResource.
 *
 * @author Young Suk Ahn Park
 * @date 2/25/15
 */

var utils = require('./utils');
var Logger = require('./logger').Logger;

var JsonValidator = require('themis');
// Another fast alternative for JSON Schema Validator:
// https://github.com/mafintosh/is-my-json-valid

// Declare internals namespace
var internals = {};

/**
 * @class HapiResource
 *
 * @module utils
 *
 * @classdesc
 *  Object of this class handles the common REST API endpoints:
 *  GET, POST, PUT, DELETE
 *
 * @todo - implement PATCH
 *
 *
 * @param {!string}   basePath - The base path (not including the the DNS)
 * @param {!string}   name  - The name of of this resource
 * @param {!Provider} provider  - The resource provider that provides CRUD functionalites
 * @param {Object=}   criteriaKeyDictionary
 *      For example when router is configured to /parent/{parent}/item/{item}
 *      with the { parent: 'parentUuid', item: 'itemUuid'
 *      at the moment of sending the query to the provider, it will be
 *      { parentUuid: {parent}, itemUuid: {item}
 *
 */
internals.HapiResource = function(basePath, name, provider, criteriaKeyDictionary)
{
    this.logger_ = Logger.getLogger('HapiResource:' + name);

    /**
     * The base path as in http://domain.com/<base_path>
     * @type {string}
     * @private
     */
    this.basePath_ = basePath || '';
    if (this.basePath_.length > 0 && !utils.endsWith(this.basePath_, '/')) {
        this.basePath_ += '/';
    }

    /**
     * Name of this resource, used as identifier
     * @type {!string}
     * @private
     */
    this.name_ = name;

    this.logger_.info({name: name, basePath: this.basePath_},  'Initializing HapiResource');

    /**
     * The underlying persistent store provider
     * @type {!Provider}
     * @private
     */
    this.provider_ = provider;

    /**
     * The mapping used to translate the criteria key
     * @type {Object}
     * @private
     */
    this.criteriaKeyDictionary_ = criteriaKeyDictionary || {};

    /**
     * Reference to the parent resoruce
     * @type {HapiResource=}
     * @private
     */
    this.parentResource_ = null;

    /**
     * Children resources
     * @type {Object<string, HapiResource>=}
     * @private
     */
    this.subResources_ = {};
};

/**
 * Get the name of this resource
 * Get the name of this resource
 * @returns {!string}
 */
internals.HapiResource.prototype.getName = function()
{
    return this.name_;
};

/**
 * Return the provider
 * @returns {!Provider}
 */
internals.HapiResource.prototype.getProvider = function()
{
    return this.provider_;
};

/**
 * Translates the query criteria by changing each of params's name as 
 * specified in the criteriaKeyDictionary_ if exists.
 * Those parameter names that starts with underscore is skipped.
 *
 * @param {Object} object  - the query entries
 * @param {Object} defaultCriteria  - the default criteria
 */
internals.HapiResource.prototype.translateCriteria = function(object, defaultCriteria)
{
    var criteria = defaultCriteria || {};
    for (var property in object) {
        if (object.hasOwnProperty(property)) {
            if (utils.startsWith(property, '_')) {
                continue;
            }
            if (this.criteriaKeyDictionary_.hasOwnProperty(property)) {
                criteria[this.criteriaKeyDictionary_[property]] = object[property];
            } else {
                criteria[property] = object[property];
            }
        }
    }
    /*
    translate(request.params);
    translate(request.query);
    */

    return criteria;
}

/**
 * set the parent resource
 *
 * @param {HapiResource} parentResource  - Reference to the parent (containing)
 *      resource 
 */
internals.HapiResource.prototype.setParent_ = function(parentResource)
{
    this.parentResource_ = parentResource;
};

/**
 * Add a sub resource
 *
 * @param {HapiResource} subResource  - Reference to the nested resource  
 */
internals.HapiResource.prototype.addSubResource = function(subResource)
{
    this.subResources_[subResource.getName()] = subResource;
    subResource.setParent_(this);
};

/**
 * Returns the RESTy context path traversing the parents.
 * E.g. given resource 'activity' with parents 'project', and 'task', it will return
 * project/{projectId}/task/{taskId}/activity/
 *
 * @returns {string}
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
};

/**
 * registerRoute
 *
 * register a single route with custom behavior
 *
 * @param {Object} server  - The Hapi server
 * @param {Object} routeConfig - route configuration
 *      {string} routeConfig.httpVerb - HTTP verb: 'GET', 'POST', etc.
 *      {string} routeConfig.path     - The path that this route maps to
 *      {function(Object)} routeConfig.handler 
 *              - The function that handles the request and returns promise
 *                The promise's success value is an object of {data, status}
 */
internals.HapiResource.prototype.registerRoute = function(server, routeConfig)
{
    // List resources
    server.route({
        method: routeConfig.httpVerb,
        path: this.basePath_ + routeConfig.path,
        handler: function(request, reply) {

            var response = null;
            var status = 200;
            try {
                // Calling the handler
                routeConfig.handler(this.provider_, request)
                .then(function(result){
                    response = result.data;
                    status = result.status;
                    logCompletion(ptr.logger_, 'GET:succeeded', routeConfig.path, status);
                })
                .catch(function(error){
                    response = error;
                    status = 500;
                    logCompletion(ptr.logger_, 'GET:error', routeConfig.path, status, error);
                })
                .finally(function(){
                    reply(response, status);
                });
            } catch (except) {
                response = except.stack;
                status = 500;
                logCompletion(ptr.logger_, 'GET:failed', routeConfig.path, status, response);
                reply(response, status);
            }
        }.bind(this)
    });
};

/**
 * Creates and registers the standard routes
 *
 * @param {Object} server  - The Hapi server
 */
internals.HapiResource.prototype.registerRoutes = function(server)
{
    this.registerRoutesRecursive_(server, this);
};

/**
 * Creates and registers the standard routes for all the ancestors
 *
 * @param {Object} server  - The Hapi server
 * @param {Object} ptr     - Pointer to traverse
 */
internals.HapiResource.prototype.registerRoutesRecursive_ = function(server, ptr)
{
    if (ptr.parentResource_)
    {
        ptr.registerRoutesRecursive_(server, ptr.parentResource_)
    }

    if (ptr.routeRegistered_)
        return;
    ptr.routeRegistered_ = true;

    var contextPath = ptr.getContextPath();

    ptr.logger_.info({contextPath: contextPath}, 'Registering resource routes');

    // List resources
    server.route({
        method: 'GET',
        path: contextPath,
        handler: function(request, reply) {

            var criteria = this.translateCriteria(request.params);
            this.translateCriteria(request.query, criteria);

            // Pagination:
            var options = {                
                sort: {},
                limit: request.query._limit || 50,
                offset: 0,
            };
            if (request.query._page) {
                offset = request.query._page * limit;
            }

            var response = null;
            var status = 201;

            try {
                // @todo - Validate the content
                ptr.provider_.query(criteria, options)
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
                logCompletion(ptr.logger_, 'GET:failed', contextPath, status, response);
                reply(response, status);
            }
        }.bind(this)
    });

    // Retrieve resource
    server.route({
        method: 'GET',
        path: contextPath + '/{id}',
        handler: function(request, reply) {
            var criteria = this.translateCriteria(request.params);
            this.translateCriteria(request.query, criteria);

            var response = null;
            var status = 201;

            var options = {};

            try {
                // @todo - Validate the content
                ptr.provider_.find(criteria, options)
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
                logCompletion(ptr.logger_, 'GET:failed', contextPath, status, response);
                reply(response, status);
            }
        }.bind(this)
    });

    // Add resource
    server.route({
        path: contextPath,
        method: 'POST',
        handler: function(request, reply) {
            var resource = request.payload;

            // Used to populate the resource with contextual ids, i.e, the parent resources' ids 
            var contextIds = this.translateCriteria(request.params);

            var response = null;
            var status = 201;

            try {

                // Populate the resource with contextual ids, i.e, the parent resources' ids 
                if (contextIds) {
                    utils.dotPopulate(resource, contextIds);
                }

                // @todo - Validate the contentItem
                var promise = ptr.provider_.add(resource);
                promise.then(function(resource){
                    response = resource;
                    logCompletion(ptr.logger_, 'POST:succeeded', contextPath, status);
                })
                .catch(function(error){
                    response = error;
                    status = 500;
                    logCompletion(ptr.logger_, 'POST:error', contextPath, status, error);
                })
                .finally(function(){
                    reply(response, status);
                });
            } catch (except) {
                response = except.stack;
                status = 500;
                logCompletion(ptr.logger_, 'POST:failed', contextPath, status, response);
                reply(response, status);
            }
        }.bind(this)
    });

    // Update resource
    // @todo - test pending
    server.route({
        path: contextPath + '/{id}',
        method: 'PUT',
        handler: function(request, reply) {
            var resource = request.payload;

            var criteria = this.translateCriteria(request.params);

            var response = null;
            var status = 200;

            try {
                // @todo - Validate the contentItem
                var promise = ptr.provider_.update(criteria, resource);
                promise.then(function(resource){
                    response = resource;
                    logCompletion(ptr.logger_, 'PUT:succeeded', contextPath, status);
                })
                .catch(function(error){
                    response = error;
                    status = 500;
                    logCompletion(ptr.logger_, 'PUT:error', contextPath, status, error);
                })
                .finally(function(){
                    reply(response, status);
                });
            } catch (except) {
                response = except.stack;
                status = 500;
                logCompletion(ptr.logger_, 'PUT:failed', contextPath, status, response);
                reply(response, status);
            }
        }.bind(this)
    });

    // Delete resource
    server.route({
        path: contextPath + '/{id}',
        method: 'DELETE',
        handler: function(request, reply) {
            var criteria = this.translateCriteria(request.params);

            var response = null;
            var status = 200;

            try {
                // @todo - Validate the contentItem
                var promise = ptr.provider_.remove(contextIds);
                promise.then(function(resource){
                    response = resource;
                    logCompletion(ptr.logger_, 'DELETE:succeeded', contextPath, status);
                })
                .catch(function(error){
                    response = error;
                    status = 500;
                    logCompletion(ptr.logger_, 'DELETE:error', contextPath, status, error);
                })
                .finally(function(){
                    reply(response, status);
                });
            } catch (except) {
                response = except.stack;
                status = 500;
                logCompletion(ptr.logger_, 'DELETE:failed', contextPath, status, response);
                reply(response, status);
            }
        }.bind(this)
    });
};

/**
 * Log for when completed
 * @param logger
 * @param message
 * @param contextPath
 * @param status
 * @param error
 */
function logCompletion(logger, message, contextPath, status, error) {
    var logObj = {
        contextPath: contextPath,
        status: status,
    };
    if (error) {
        Logger.logError(logger, error, message, logObj);
    } else {
        logger.info(logObj, message);
    }
}

module.exports.HapiResource = internals.HapiResource;