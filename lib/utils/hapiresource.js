
var Logger = require('./logger').Logger;

// Declare internals namespace

var internals = {};

/**
 *
 * @param basePath
 * @param name
 * @param provider  - The resource provider
 */
internals.HapiResource = function(basePath, name, provider)
{
    this.basePath_ = basePath;
    this.name_ = name;

    this.provider_ = provider;

    this.logger_ = Logger.getLogger('HapiResource:' + name);
};

internals.HapiResource.prototype.initRoutes = function(server)
{
    var contextPath = this.basePath_ + '/' + this.name_;

    this.logger_.info({contextPath: contextPath}, 'Initializing resource routes');

    // List
    server.route({
        method: 'GET',
        path: contextPath,
        config: {
            handler: function(request, reply) {

                var response = null;
                var status = 201;

                try {
                    // @todo - Validate the content
                    this.provider_.query(id)
                    .then(function(resource){
                        response = resource;
                    })
                    .catch(function(error){
                        response = error;
                        status = 500;
                    })
                    .finally(function(){
                        this.logger_.info({contextPath: contextPath}, 'GET resource completed');
                        reply(response, status);
                    });
                } catch (except) {
                    response = except.stack;
                    status = 500;
                    this.logger_.error({contextPath: contextPath}, 'GET resource failed');
                    reply(response, status);
                }
            }.bind(this)
        }
    });

    // Retrieve
    server.route({
        method: 'GET',
        path: contextPath + '/{id}',
        config: {
            handler: function(request, reply) {
                var id = request.params.id;

                var response = null;
                var status = 201;

                try {
                    // @todo - Validate the content
                    this.provider_.find(id)
                    .then(function(resource){
                        response = resource;
                    })
                    .catch(function(error){
                        response = error;
                        status = 500;
                    })
                    .finally(function(){
console.log("-E1:" + JSON.stringify(response));
                        reply(response, status);
                    });
                } catch (except) {
                    response = except.stack;
                    status = 500;
console.log("-E2:" + JSON.stringify(response));
                    reply(response, status);
                }
            }.bind(this)
        }
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
                var promise = this.provider_.add(resource);
                promise.then(function(resource){
                    response = resource;
                })
                .catch(function(error){
                    response = error;
                    status = 500;
                })
                .finally(function(){
console.log("-E:" + JSON.stringify(response));
                    reply(response, status);
                });
            } catch (except) {
                response = except.stack;
                status = 500;
console.log("-E:" + JSON.stringify(except.stack));
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
                var promise = this.provider_.update(resource);
                promise.then(function(resource){
                    response = resource;
                })
                .catch(function(error){
                    response = error;
                    status = 500;
                })
                .finally(function(){
                    this.logger_.info({contextPath: contextPath}, 'PUT resource completed');
                    reply(response, status);
                });
            } catch (except) {
                response = except.stack;
                status = 500;
                this.logger_.error({contextPath: contextPath}, 'PUT resource failed');
                reply(response, status);
            }
        }.bind(this)
    });

};

module.exports.HapiResource = internals.HapiResource;