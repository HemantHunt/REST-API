/*
* Module for all the handlers methods
* Users, Tokens, Cart, Checkout
* 
*/


// Dependencies
var _data = require('./data');
var helpers = require('./helpers');

// Container for handler methods
var handlers = {};

// Ping handler
handlers.ping = function(data,callback) {
    callback(200);
};

// Not found handler
handlers.notFound = function(data,callback) {
    callback(404);
};

// Users handlers
handlers.users = function(data, callback) {
    var acceptableMethods = ['post','get','put','delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data,callback);
    } else {
        callback(405);
    }
};
// User container for user methods
handlers._users = {};

// Users post
// Required email, streetAdd, password
handlers._users.post = function(data, callback) {
    // Check all the required fields
    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
    var streetAdd = typeof(data.payload.streetAdd) == 'string' && data.payload.streetAdd.trim().length > 0 ? data.payload.streetAdd.trim() : false;                 
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

    if (firstName && lastName && email && streetAdd && password && tosAgreement) {
         
        _data.read('users',email,function(err,data) {
            if (err) {
                var hashedPassword = helpers.hash(password);
                if (hashedPassword) {
                    var userObject = {
                        'firstName' : firstName,
                        'lastName' : lastName,
                        'email' : email,
                        'streetAdd' : streetAdd,
                        'hashedPassword' : hashedPassword,
                        'tosAgreement' : true
                    };

                    // Store the user
                    _data.create('users',email,userObject,function(err) {
                        if (!err) {
                            callback(200);      
                        } else {
                            callback(500,{'Error':'Could not create new user.'});
                        }
                    });
                } else {
                    callback(500,{'Error':'Could not hash the password.'});
                }
            } else {
                callback(400,{'Error':'A user with this email already exist.'});
            }
        });
    } else {
        callback(400,{'Error':'Missing required fields for users.'});
    }
};
// Users get
// Required email,token
handlers._users.get = function(data, callback) {
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
    if (email) {
        // Get token from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token,email,function(tokenIsValid) {
            if (tokenIsValid) {
                _data.read('users',email,function(err,data) {
                    if (!err && data) {
                        delete data.hashedPassword;
                        callback(200,data);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(403,{'Error':'Missing required token in header.'});
            }
        });
    } else {
        callback(400,{'Error':'Missing required field.'});
    }
};
// Users put
// Required email, token
handlers._users.put = function(data, callback) {
    // Check for required field
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;

    var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var streetAdd = typeof(data.payload.streetAdd) == 'string' && data.payload.streetAdd.trim().length > 0 ? data.payload.streetAdd.trim() : false;                 
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    if (email) {
        
        if (firstName || lastName || streetAdd || password) {
            // Get token from headers
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

            handlers._tokens.verifyToken(token,email,function(tokenIsValid) {
                if (tokenIsValid) {
                    _data.read('users',email,function(err,userData) {
                        if (!err && userData) {
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (streetAdd) {
                                userData.streetAdd =streetAdd;
                            }
                            if (password) {
                                userData.hashedPassword = helpers.hash(password);
                            }
        
                            _data.update('users',email,userData,function(err) {
                                if (!err) {
                                    callback(200);
                                } else {
                                    callback(500,{'Error':'Could not update the user.'});
                                }
                            });
                        } else {
                            callback(400,{'Error':'Specified user does not exist.'});
                        }
                    });
                } else {
                    callback(400,{'Error':'Missing required token in header.'});
                }
            });
        } else {
            callback(400,{'Error':'Missing fields to update.'});
        }
    } else {
        callback(400,{'Error':'Missing required field.'});
    }
};
// Users delete
// Required email & token
handlers._users.delete = function(data, callback) {
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email.trim() : false;
    if (email) {
        // Get tokens from headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        handlers._tokens.verifyToken(token,email,function(tokenIsValid) {
            if (tokenIsValid) {
                _data.read('users',email,function(err,data) {
                    if (!err && data) {
                        _data.delete('users',email,function(err) {
                            if (!err) {
                                callback(200); 
                            } else {
                                callback(500,{'Error':'Could not delete the specified user.'});
                            }
                        });
                    } else {
                        callback(400,{'Error':'Could not find the specified user.'});
                    }
                });
            } else {
                callback(403,{'Error':'Missing required token in header.'});
            }
        });
    } else {
        callback(400,{'Error':'Missing required field.'});
    }
};

// Tokens handlers
handlers.tokens = function(data, callback) {
    var acceptableMethods = ['post','get','put','delete'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data,callback);
    } else {
        callback(405);
    }
};
// Tokens container for tokens method
handlers._tokens = {};

// Post method for token
// Required email & password
handlers._tokens.post = function(data, callback) {
    var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
    var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if (email && password) {
        // Look up the user who matches the email
        _data.read('users',email,function(err,userData) {
            if (!err && userData) {
                var hashedPassword = helpers.hash(password);
                if (hashedPassword == userData.hashedPassword) {
                    var tokenId = helpers.createRandomString(20);
                    var expires = Date.now() + 1000*60*60;
                    var tokenObject = {
                        'email' : email,
                        'id' : tokenId,
                        'expires' : expires
                    };
                    // Store the token
                    _data.create('tokens',tokenId,tokenObject,function(err) {
                        if (!err) {
                            callback(200,tokenObject);
                        } else {
                            callback(500,{'Error':'Could not create the new token.'});
                        }
                    });

                } else {
                    callback(400,{'Error':'Password did not match the specified user stored password.'});
                }
            } else {
                callback(400,{'Error':'Could not find the specified user.'});
            }
        });
    } else {
        callback(400,{'Error':'Missing required fields.'});
    }
};
// Get method for token
// Required Id
handlers._tokens.get = function(data, callback) {
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if (id) {
        _data.read('tokens',id,function(err,tokenData) {
            if (!err && tokenData) {
                callback(200,tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400,{'Error':'Missing required fields.'});
    }
};
// Put method for token
// Required Id
handlers._tokens.put = function(data, callback) {
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
    if(id && extend){
        // Lookup the existing token
        _data.read('tokens',id,function(err,tokenData){
            if(!err && tokenData){
                // Check to make sure the token isn't already expired
                if(tokenData.expires > Date.now()){
                    // Set the expiration an hour from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    // Store the new updates
                    _data.update('tokens',id,tokenData,function(err){
                        if(!err){
                            callback(200);
                        } else {
                            callback(500,{'Error' : 'Could not update the token\'s expiration.'});
                        }
                    });
                } else {
                    callback(400,{"Error" : "The token has already expired, and cannot be extended."});
                }
            } else {
                callback(400,{'Error' : 'Specified user does not exist.'});
            }
        });
    } else {
        callback(400,{"Error": "Missing required field(s) or field(s) are invalid."});
    }
};
// Delete method for token
// Required token id
handlers._tokens.delete = function(data, callback) {
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    if (id) {
        _data.read('tokens',id,function(err,tokenData) {
            if (!err && tokenData) {
                _data.delete('tokens',id,function(err) {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500,{'Error':'Could not delete the specipied tokens.'});
                    }
                });
            } else {
                callback(400,{'Error':'Could not find the specified token.'});
            }
        });
    } else {
        callback(400,{'Error':'Missing required field.'});
    }
};

// Varify if a given token Id is currently valid.
handlers._tokens.verifyToken = function(id,email,callback) {
    _data.read('tokens',id,function(err,tokenData) {
        if (!err && tokenData) {
            if(tokenData.email == email && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

// Cart handler
handlers.cart = function(data, callback) {
    var acceptableMethods = ['post','get'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._cart[data.method](data,callback);
    } else {
        callback(405);
    }
};
// Cart container for cart methods
handlers._cart = {};

// Cart post method
// Required email
handlers._cart.post = function(data,callback) {
        // Get token and email from headers
        var email = typeof(data.headers.email) == 'string' && data.headers.email.trim().length > 0 ? data.headers.email.trim() : false;
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token,email,function(tokenIsValid) {
            if (tokenIsValid) {
               _data.list('menuItems',(err,listItems)=>{
                if(!err && listItems && listItems.length>0){
                    _data.read('users',email,function(err,userData) {
                        if(!err && userData){

                            var cart=typeof(userData.cart)=='object' && userData.cart instanceof Array ? userData.cart:[];
                            listItems.forEach(productId => {
                                userData.cart=cart;
                                userData.cart.push(productId);
                            });
                            _data.update('users',email,userData,function(err) {
                                if(!err){
                                    callback(200,{'Success':'Items have been added to the card!'})
                                }
                                else{
                                    callback(500,{'Error':'Error occured while updating user data with cart items!'})
                                }
                            });
                        }
                        else{
                            callback(500,{'Error':'The user data is not getting fetched!'});
                        }
                    });
                    
                }
                else{
                    callback(400,{'Error':'There is not any item to add to cart.'})
                }
            })
            } else {
                callback(400,{'Error':'Missing required field.'});
            }
        });
};
// Cart get method 
// Required email
handlers._cart.get = function(data,callback) {
    // Get email and token from headers
    var email = typeof(data.headers.email) == 'string' && data.headers.email.trim().length > 0 ? data.headers.email.trim() : false;
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token,email,function(tokenIsValid) {
        if (tokenIsValid) {
            _data.list('menuItems',function(err, itemNames) {
                    if(!err && itemNames){
                        var allItems='';
                        itemNames.forEach(function(item) {
                          allItems=item+' , '+allItems;
                        });
                        var trimmedItems={
                          "items": allItems.replace(/,\s*$/,'')
                        }
                        callback(200,trimmedItems);
                    }
                    else{
                        callback(404,{'Error':'No items available in menuItems!'});
                    }
                });
        } else {
            callback(403,{'Error':'Missing required token in header.'});
        }
    });
    
};

// Checkout handler
handlers.checkout = function(data,callback) {
    var acceptableMethods = ['post'];
    if (acceptableMethods.indexOf(data.method) > -1) {
        handlers._cart[data.method](data,callback);
    } else {
        callback(405);
    }
};
// Container for checkout methods
handlers._checkout = {};

// Post method for checkout
// Required email
handlers._checkout.post = function(data, callback) {
    // Get email and token from headers
    var email = typeof(data.headers.email) == 'string' && data.headers.email.trim().length > 0 ? data.headers.email.trim() : false;
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    if(email && token) {
        handlers._tokens.verifyToken(token,email,function(tokenIsValid) {
            if (tokenIsValid) {
                _data.read('users',email,function(err,userData) {
                        if(!err && userData) {
                            handlers._checkout.calculateTotal(userData.cart,function(err,amount) {
                                helpers.paymentCharge(amount,config.environment.stripeApi.sourceToken,function(err) {
                                    if(!err){

                                    var body='Hello Customer, Order has been successfully placed and $ #amount# has been debited from your card. Regards, Team Pizza App.'.replace('#amount#',(amount/100).toFixed(2));
                                    //Mail API
                                    helpers.sendEmail(email,body,function(err) {
                                        if(!err) {
                                            handlers._checkout.emptyCart(email,function(err) {
                                                if(!err) {
                                                    callback(200,{'Success':'Order has been placed, Payment successfull, mail sent and basket cleared.'});
                                                }
                                                else{
                                                    callback(500,{'Error':'Error occured while clearing the basket.'})
                                                }
                                            });

                                        }
                                        else{
                                            callback(500,{'Error':'Error occured while sending email to user.'})
                                        }
                                    });
 
 
                                    } else{
                                       callback(500,{'Error':'Error occured while making the transaction to stripe API.'})
                                    }
                                });
                            }); 
                        }
                        else{
                            callback(404,{'Error':'The user with this email id is not found.'})
                        }
                    });
       
            } else {
                callback('Token is not valid.');
            }
        });
    } else {
        callback('Required parameter is missing.');
    }    
};

// Calculate total amount in the cart
handlers._checkout.calculateTotal = function(cart,callback) {
    var totalAmount = 0;
    var counter = 0;
    var len = cart.length;
    cart.forEach(function(item) {
        _data.read('menuItems',item,function(err,data) {
            counter++;
            totalAmount = totalAmount + data.price;
            if (counter == len) {
                callback(false,totalAmount);
            }
        });
    });
};
// Empty cart
handlers._checkout.emptyCart = function(email,callback) {
    _data.read('users',email,userData,function(err) {
        if (!err && userData) {
            _data.update('users',email,userData,function(err) {
                if (!err) {
                    callback(false);
                } else {
                    callback(true);
                }
            });
        } else {
            callback(true);
        }
    });
};


// Exports the handlers module
module.exports = handlers;