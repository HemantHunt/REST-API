/*
* Server related tasks
* Starting server, seting routes, intializing server ...
*/

//Dependencies
var http = require('http');
var https = require('https');
var StringDecoder = require('string_decoder').StringDecoder;
var url = require('url');
var fs = require('fs');
var handlers = require('./handlers');
var helpers = require('./helpers');
var config = require('./config');



// Container for Server Methods
var server = {};

server.httpServer = http.createServer(function(req,res) {
    server.unifiedServer(req,res);
});

server.httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert' : fs.readFileSync('./https/cert.pem')
};
server.httpsServer = https.createServer(server.httpsServerOptions,function(req,res) {
     server.unifiedServer(req,res);    
});

server.unifiedServer = function(req,res) {
    // Parse the url
    var parsedUrl = url.parse(req.url,true);
    // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');
    // Get query string as an object
    var queryStringObject = parsedUrl.query;
    // Get the method 
    var method = req.method.toLowerCase();
    // Get the headers as an object
    var headers = req.headers;

    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data) {
        buffer += decoder.write(data);
    });
    req.on('end', function() {
        buffer += decoder.end();

        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };
        
        chosenHandler(data,function(statusCode,payload) {
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {};

            var payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log("Returning this response: ",statusCode,payloadString);
        });
    });
};

server.init = function() {
    server.httpServer.listen(config.httpPort,function() {
        console.log('\x1b[36m%s\x1b[0m','The HTTP server is running on port '+config.httpPort)
    });
    server.httpsServer.listen(config.httpsPort,function() {
        console.log('\x1b[32m%s\x1b[0m','The HTTPS server is running on port '+config.httpsPort)
    });
};


server.router = {
    'ping' : handlers.ping,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'cart' : handlers.cart
};

module.exports = server;