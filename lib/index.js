/*****************************************************************************
 * EcoLearnia main entry file
 *
 */

// Load modules
var os = require('os');
var path = require('path');
var Hoek = require('hoek');
var Handlebars = require('handlebars');

var utils = require('./utils/utils');
var Logger = require('./utils/logger').Logger;
var DbUtils = require('./utils/dbutils').DbUtils;
var HapiResource = require('./utils/hapiresource').HapiResource;

var contentItemManager = require('./providers/contentitemmanager').getManager();

var defaultProvider = require('./providers/defaultprovider');

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

    var logger_ = Logger.getLogger(internals.MODULE.NAME);

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

    var contentNodeProvider = defaultProvider.createProvider('ContentNode', 'contentnode', { primaryKey: 'uuid'} );

    var criteriaKeyDictionary = {
        id: 'uuid'
    }
    var contentNodeResource = new HapiResource(settings.pathBase, 'node', contentNodeProvider, criteriaKeyDictionary);

    var criteriaKeyDictionary = {
        id: 'uuid'
    }
    var contentItemResource = new HapiResource(null, 'item', contentItemManager, criteriaKeyDictionary);
    contentNodeResource.addSubResource(contentItemResource);

    // Initialize routes for this resource
    contentItemResource.registerRoutes(plugin);

    next();
};
 
exports.register.attributes = {
    pkg: require("../package.json")
};

