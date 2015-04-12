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

var contentNodeManager = require('./providers/contentnodemanager').getManager();
var contentItemManager = require('./providers/contentitemmanager').getManager();

var courseManager = require('./providers/coursemanager').getManager();

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

    var criteriaKeyDictionary1 = {
        id: 'uuid'
    };

    // nodes: /<base>/nodes/{nodesId}
    var contentNodeResource = new HapiResource(settings.pathBase, 'nodes', contentNodeManager, criteriaKeyDictionary1);

    // replace the find with retrieve for full descendant retrieval
    contentNodeResource.getProvider().find = contentNodeResource.getProvider().retrieve;

    var criteriaKeyDictionary2 = {
        id: 'uuid',
        nodesId: 'parentUuid'
    };

    // Sub-nodes: /<base>/nodes/{nodesId}/subnodes
    var contentSubNodeResource = new HapiResource(null, 'subnodes', contentNodeManager, criteriaKeyDictionary2);
    contentNodeResource.addSubResource(contentSubNodeResource);

    // items: /<base>/nodes/{nodesId}/items
    var contentItemResource = new HapiResource(null, 'items', contentItemManager, criteriaKeyDictionary2);
    contentNodeResource.addSubResource(contentItemResource);

    // Register routes for this resource
    contentSubNodeResource.registerRoutes(plugin);

    // Register routes for this resource
    contentItemResource.registerRoutes(plugin);


    // Courses: /<base>/courses/{coursesId}
    var courseResource = new HapiResource(settings.pathBase, 'courses', courseManager, criteriaKeyDictionary1);

    var courseCriteriaKeyDic2 = {
        id: 'uuid',
        coursesId: 'courseUuid'
    };

    // AssignmentNodes: /<base>/courses/{coursesId}/nodes/{nodesId}
    var assignmentNodeResource = new HapiResource(null, 'nodes', courseManager.getAssignmentNodeProvider(), courseCriteriaKeyDic2);
    courseResource.addSubResource(assignmentNodeResource);

    var courseCriteriaKeyDic2 = {
        id: 'uuid',
        coursesId: 'courseUuid',
        nodesId: 'parentUuid'
    };
    // AssignmentItems: /<base>/courses/{coursesId}/nodes/{nodesId}/items/{id}
    var assignmentItemResource = new HapiResource(null, 'items', courseManager.getAssignmentItemProvider(), courseCriteriaKeyDic2);
    assignmentNodeResource.addSubResource(assignmentItemResource);

    assignmentNodeResource.registerRoutes(plugin);
    assignmentItemResource.registerRoutes(plugin);


    next();
};
 
exports.register.attributes = {
    pkg: require("../package.json")
};

