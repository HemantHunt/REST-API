/*
 * Helpers for various tasks
 *
 */

// Dependencies
var config = require('./config');
var https = require('https');
var crypto = require('crypto');
var querystring = require('querystring');
var _data = require('./data');



// Container for all the helpers
var helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
    try{
        var obj = JSON.parse(str);
        return obj;
    } catch(e){
        return {};
    }
};

// Create a SHA256 hash
helpers.hash = function(str){
    if(typeof(str) == 'string' && str.length > 0){
        var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength){
    strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
    if(strLength){
        // Define all the possible characters that could go into a string
        var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        // Start the final string
        var str = '';
        for(i = 1; i <= strLength; i++) {
            // Get a random charactert from the possibleCharacters string
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // Append this character to the string
            str+=randomCharacter;
        }
        // Return the final string
        return str;
    } else {
        return false;
    }
};

// Setup Send Email via mailgun 
helpers.sendEmail = function(email, msg, callback) {
    email = typeof(email) == 'string' && email.trim().length > 0 ? email.trim() : false;
    msg = typeof(msg) == 'string' && msg.trim().length > 0  ? msg.trim() : false;
    if (email && msg) {
        // Configure the request payload
        var payload = {
            'From' : config.mailgun.fromEmail,
            'To' : email,
            'Subject' : 'Invoice',
            'text' : msg
        };
        var stringPayload = querystring.stringify(payload);
        // Configure the request details
        var requestDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.eu.mailgun.net',
            'method' : 'POST',
            'path' : '/v3/domain/'+config.mailgun.fromEmail+'/messages',
            'auth' : 'api:'+config.mailgun.authKey,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload)
            }
        };

        // Instantiate the request object
        var req = https.request(requestDetails,function(res) {
            var status = res.statusCode;
            if (status == 200 || status == 201) {
                callback(false);
            } else {
                callback('Status code returned was ' +status);
            }
        });

        req.on('error',function(e) {
            callback(e);
        });
        req.write(stringPayload);
        req.end();
    } else {
        callback('Given parameters were missing or invalid.');
    }
};


// Setup Stripe payment gatway
helpers.paymentCharge = function(amount,source,callback) {
    amount = typeof(amount) == 'string' && amount.trim().length > 0 ? amount.trim() : false;
    source = typeof(source) == 'string' && source.trim().length > 0 ? source.trim() : false;
    if (amount && source) {
        var payload = {
            'amount': amount,
            'currency': 'usd',
            'source' : source
        }
        var stringPayload = querystring.stringify(payload);
        var paymentDetails = {
            'protocol' : 'https:',
            'hostname' : 'api.stripe.com',
            'method' : 'POST',
            'path' : '/v1/charges',
            'auth' : config.stripe.key,
            'headers' : {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length' : Buffer.byteLength(stringPayload)
            }
        }
         // Instantiate the request object
         var req = https.request(paymentDetails,function(res) {
           
            var status = res.statusCode;
            
            if (status == 200 || status == 201) {
                callback('res ' +res);
            } else {
                callback('Status code returned was ' +status);
            }
        });
    
        req.on('error',function(e) {
            callback(e);
        });
        req.write(stringPayload);
        req.end();
    } else {
        callback('Given parameters are missing.');
    }
};


// Export the module
module.exports = helpers;