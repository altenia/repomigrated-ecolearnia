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
        path: settings.pathBase + settings.contentPathBase + '/{guid}',
        method: 'GET',
        handler: function(request, reply) {
            var guid = request.params.guid;

            var response = null;
            var status = 201;

            try {
                // @todo - Validate the content
                contentManager.find(guid)
                .then(function(content){
                    response = content;
                    reply(response, status);
                })
                .catch(function(error){
                    response = error;
                    status = 500;
                    reply(response, status);
                });
            } catch (except) {
                response = except.stack;
                status = 500;
            }
            console.log('Status:' + status + ' ' + JSON.stringify(response));
        }
    });

    // Add content
    plugin.route({
        path: settings.pathBase + settings.contentPathBase,
        method: 'POST',
        handler: function(request, reply) {
            var content = request.payload;

            var response = null;
            var status = 201;

            try {
                // @todo - Validate the content
                var promise = contentManager.add(content);
                promise.then(function(newContent){
                    response = newContent;
                    reply(response, status);
                })
                .catch(function(error){
                    response = error;
                    status = 500;
                    reply(response, status);
                })
            } catch (except) {
                response = except.stack;
                status = 500;
                reply(response, status);
            }
            
        }
    });

    // Retrieve content
    plugin.route({
        path: settings.pathBase + settings.contentPathBase,
        method: 'PUT',
        handler: function(request, reply) {
            var content = request.payload;

            var response = null;
            var status = 201;

            try {
                // @todo - Validate the content
                contentManager.add(content)
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

