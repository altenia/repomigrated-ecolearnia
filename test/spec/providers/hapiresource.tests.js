
var expect = require('chai').expect;
var sinon = require('sinon');

var utils = require('../../../lib/utils/utils');


// Library under test
var HapiResource = require('../../../lib/utils/hapiresource').HapiResource;

utils.loadConfig('./conf/test.conf.json');


describe('HapiResource', function () {

	var hapiResource;

	beforeEach(function () {
		hapiResource = new HapiResource('/test', 'test', contentNodeManager, { param: 'newparam'});
	});

	describe('Initialize', function () {	
	
		it.skip('should add', function () {
			expect(testProvider.modelName,'modelName' ).to.equal('TestFunctional');
			expect(testProvider.primaryKey_).to.equal('uuid');
			expect(testProvider.Model_).to.not.null;
		});
	});

	describe('Accessors', function () {
		it.skip('should getName', function (done) {
			done();
		});
		it.skip('should getProvider', function (done) {
			done();
		});
		it.skip('should translateCriteria', function (done) {
			done();
		});
		it.skip('should setParent_', function (done) {
			done();
		});
		it.skip('should addSubResource', function (done) {
			done();
		});
		it.skip('should getContextPath', function (done) {
			done();
		});
	});

	describe('Operations', function () {
		it.skip('should registerRoute', function (done) {
			done();
		});
		it.skip('should registerRoutes', function (done) {
			done();
		});
		it.skip('should registerRoutesRecursive_', function (done) {
			done();
		});
	});
});

