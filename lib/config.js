


var environments = {};

environments.staging = {
    'httpPort' : 3000,
    'httpsPort' : 3001,
    'envName' : 'staging',
    'hashingSecret' : 'thisIsASecret',
    'mailgun' : {
        'fromEmail' : 'sandbox291b6514f346459f90917536bda86ec6.mailgun.org',
        'authKey' : 'ed495c83343db9e1a2e1308bcc290cb4-e438c741-ec4ff57e'
    },
    'stripe' : {
        'key' : 'sk_test_51IBm2YIEirfRzZgl9LUzxu42qrSa3lPTCCYA0aUa46l57l3ptjbdt7bfTpujhOzSaNGZdd95X7j0kyQHuT5z0l5g00Daxn3m1m',
        'sourceToken':'tok_visa'
    }
};

environments.production = {
    'httpPort' : 5000,
    'httpsPort' : 5001,
    'envName' : 'production',
    'hashingSecret' : 'thisIsASecret',
    'mailgun' : {
        'fromEmail' : '',
        'authKey' : ''
    },
    'stripe' : {
        'key' : '',
        'sourceToken':''
    }
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;