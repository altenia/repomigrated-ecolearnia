
var expect = require('chai').expect;
var sinon = require('sinon');

var utils = require('../../../lib/utils/utils');


// Library under test
//var courseManager = require('../../providers/coursemanager').getManager();


describe('CourseManager', function () {

	beforeEach(function () {

	});

	describe('Initialize', function () {	
	
		it.skip('should add', function () {
			expect(testProvider.modelName,'modelName' ).to.equal('TestFunctional');
			expect(testProvider.primaryKey_).to.equal('uuid');
			expect(testProvider.Model_).to.not.null;
		});
	});

	describe('CRUD operations', function () {
		it.skip('should create', function (done) {
			done();
		});
	});
});

