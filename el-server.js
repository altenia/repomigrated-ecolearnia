var Hapi = require("hapi");
var utils = require('./lib/utils/utils');

var port = utils.getConfigProperty('port');
var logConf = utils.getConfigProperty('log');

var server = new Hapi.Server();
server.connection(
    { 
      port: port, 
      labels: 'main',
      routes: { cors: true } 
    }
  );

server.register([
      { register: require("lout") },
      { register: require("./index"), options: { log: logConf} }
], function(err) {
    if (err) throw err;
    server.start(function() {
        console.log("EcoLearnia server started @ " + server.info.uri);
    });
});