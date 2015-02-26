
var when = require('when');
var Promise = require('promise');

// Declare internals namespace

var internals = {};

internals.createWhenPromise = function(func)
{
	return when.promise(func);
}

internals.createSimplePromise = function(func)
{
	return new Promise(func);
}


module.exports.createPromise = internals.createWhenPromise;