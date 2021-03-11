/*
*  Module for manipulating Data
*  Creating, Reading, Updating & Deleting File. 
*/


// Dependencies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

var lib = {};

// Set Base directory
lib.baseDir = path.join(__dirname,'/../.data/');

// Method for creating a file
lib.create = function(dir,file,data,callback) {
    fs.open(lib.baseDir+dir+'/'+file+'.json','wx',function(err, fileDescriptor) {
        if (!err && fileDescriptor) {
            // Convert data to string
            var stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor,stringData,function(err) {
                if (!err) {
                    fs.close(fileDescriptor,function(err) {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Error closing new file.');
                        }
                    });
                } else {
                    callback('Error writing new file');
                }
            });
        } else {
            callback('Could not create new file.');
        }
    });
};

// Method for reading a file 
lib.read = function(dir,file,callback) {
    fs.readFile(lib.baseDir+dir+'/'+file+'.json','utf8',function(err,data) {
        if (!err && data) {
            var parsedData = helpers.parseJsonToObject(data);
            callback(false,parsedData);
        } else {
            callback(err,data);
        }
    });
};

// Method for updating a file 
lib.update = function(dir,file,data,callback) {
    fs.open(lib.baseDir+dir+'/'+file+'.json','r+',function(err,fileDescriptor) {
        if (!err && fileDescriptor) {
            var stringData = JSON.stringify(data);
            fs.ftruncate(fileDescriptor,function(err) {
                if (!err) {
                    fs.writeFile(fileDescriptor,stringData,function(err) {
                        if (!err) {
                            fs.close(fileDescriptor,function(err) {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback('Could not colose the file.');
                                }
                            });
                        } else {
                            callback('Error writing file.');
                        }
                    });
                } else {
                    callback('Error tuncating file.');
                }
            });
        } else {
            callback('Could not open file for updating.');
        }
    });
};

// Method for deleting a file
lib.delete = function(dir,file,callback) {
    fs.unlink(lib.baseDir+dir+'/'+file+'.json','r+',function(err,fileDescriptor) {
        if (!err && fileDescriptor) {
            var stringData = JSON.stringify(data);
            fs.writeFile(fileDescriptor,stringData,function(err) {
                if (!err) {
                    fs.close(fileDescriptor,function(err) {
                        if (!err) {
                            callback(false);
                        } else {
                            callback('Could not close file.');
                        }
                    });
                } else {
                    callback('Error writing file.');
                }
            });
        } else {
            callback('Could not open for writing.');
        }
    });
};

// List all file name in a directory
lib.list = function(dir,callback) {
    fs.readdir(lib.baseDir+dir+'/',function(err,data) {
        if (!err && data && data.length > 0) {
            var trimmedFileNames = [];
            data.forEach(function(fileName) {
                trimmedFileNames.push(fileName.replace('.json',''));
            });
        } else {
            callback(err,data);
        }
    });
};


// Exports lib module
module.exports = lib;