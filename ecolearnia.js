var Hapi = require("hapi");
var nconf = require('nconf');

nconf.argv()
       .env()
       .file({ file: './conf/cohevium.conf.json' });

var port = nconf.get('port');
var contentBaseDir = nconf.get('contentBaseDir');
var logConf = nconf.get('log');

var server = new Hapi.Server(port, {
    cors: true
});

server.pack.register([
      { plugin: require("lout") },
      { plugin: require("./index"), options: { contentBaseDir: contentBaseDir, log: logConf}
    }
], function(err) {
    if (err) throw err;
    server.start(function() {
        console.log("Cohevium server started @ " + server.info.uri);
    });
});