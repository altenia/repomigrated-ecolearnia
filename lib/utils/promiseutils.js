
var Bluebird = require('bluebird');
var when = require('when');
var Promise = require('promise');

// Declare internals namespace
var internals = {};

internals.createBluebirdPromise = function(func)
{
	return new Bluebird(func);
}

internals.createWhenPromise = function(func)
{
	return when.promise(func);
}

internals.createSimplePromise = function(func)
{
	return new Promise(func);
}

module.exports.createPromise = internals.createBluebirdPromise;