/*****************************************************************************
 * EcoLearnia main entry file
 *
 */

// Load modules
var os = require('os');
var path = require('path');
var Hoek = require('hoek');
var Handlebars = require('handlebars');

var utils = require('./utils');
var DbUtils = require('./dbutils').DbUtils;
var contentManager = require('./contentmanager').getContentManager();

// Declararation of namespace for internal module use
var internals = {

    // Module information
    MODULE: {
        NAME: 'EcoLearnia:Core',
        VERSION: '0.0.1',
    },

    defaults: {
        // Module's relative path's base
        pathBase: '',
        contentPathBase: '/content',
        basePath: path.join(__dirname, '..', 'templates'),
        publicPath: path.join(__dirname, '..', 'public'),
        helpersPath: path.join(__dirname, '..', 'templates', 'helpers'),
        partialsPath: path.join(__dirname, '..', 'templates'),
        indexTemplate: 'index',
        routeTemplate: 'route',
    }
};



/**
 * Route endpoints:
 */
exports.register = function(plugin, options, next) {
    
    console.log(JSON.stringify(options));

    var logger_ = utils.getLogger(internals.MODULE.NAME, options['log']);

	var settings = Hoek.applyToDefaults(internals.defaults, options);
 
    var moduleInfo = {
        name: internals.MODULE.NAME,
        version: internals.MODULE.VERSION,
        hostname: os.hostname()
    };

    DbUtils.connect('mongodb://localhost/ecol_test');

    plugin.views({
        engines: settings.engines || {
            html: {
                module: Handlebars
            }
        },
        path: settings.basePath,
        partialsPath: settings.partialsPath,
        helpersPath: settings.helpersPath
    });

    /**
     * Index web page
     */
    plugin.route({
        path: settings.pathBase + '/index.html',
        method: "GET",
        handler: function(request, reply) {
            
            return reply.view(settings.indexTemplate, serverInfo);
        }
    });

    /**
     * Public web assets
     */
    plugin.route({
        method: 'GET',
        path: settings.pathBase + '/public/{path*}',
        config: {
            handler: {
                directory: {
                    path: settings.publicPath,
                    index: false,
                    listing: false
                }
            },
            plugins: {
                lout: false
            }
        }
    });


    /**
     * API: Repos info
     */
    plugin.route({
        path: settings.pathBase + '/info',
        method: "GET",
        handler: function(request, reply) {
            reply(moduleInfo, 200);
        }
    });

    // Add routes

    /**
     * API: Repos info
     */
    plugin.route({
        path: settings.pathBase + settings.contentPathBase + '/{uuid}',
        method: 'GET',
        handler: function(request, reply) {
            var uuid = request.params.uuid;

            var response = null;
            var status = 201;

            try {
                // @todo - Validate the content
                contentManager.find(uuid)
                .then(function(contentItem){
                    response = contentItem;
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
        }
    });

    /**
     * API: Repos info
     */
    plugin.route({
        path: settings.pathBase + settings.contentPathBase ,
        method: 'GET',
        handler: function(request, reply) {
            var guid = request.params.guid;

            var response = null;
            var status = 201;

            try {
                // @todo - Validate the contentItem
                contentManager.query()
                .then(function(result){
                    response = result;
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
        }
    });

    // Add contentItem
    plugin.route({
        path: settings.pathBase + settings.contentPathBase,
        method: 'POST',
        handler: function(request, reply) {
            var contentItem = request.payload;

            var response = null;
            var status = 201;

            try {
                // @todo - Validate the contentItem
                var promise = contentManager.add(contentItem);
                promise.then(function(newContent){
                    response = newContent;
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
            
        }
    });

    // Retrieve contentItem
    plugin.route({
        path: settings.pathBase + settings.contentPathBase,
        method: 'PUT',
        handler: function(request, reply) {
            var contentItem = request.payload;

            var response = null;
            var status = 201;

            try {
                // @todo - Validate the contentItem
                contentManager.add(contentItem)
                .then(function(newContent){
                    response = newContent;
                })
                .catch(function(error){
                    response = error;
                    status = 500;
                });
            } catch (except) {
                response = except.toString();
                status = 500;
            }
            
            reply(response, status);
        }
    });

    next();
};
 
exports.register.attributes = {
    pkg: require("../package.json")
};

