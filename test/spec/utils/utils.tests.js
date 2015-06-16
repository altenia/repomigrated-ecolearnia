
var expect = require('chai').expect;
var sinon = require('sinon');

var utils = require('../../../lib/utils/utils');


describe('Utils', function () {

	beforeEach(function () {

	});

	describe('Config', function () {	
	
		it('should return property value', function (done) {

			var retval = utils.getConfigProperty('prop1', './conf/test.conf.json');
			expect(retval).to.equal(123);

			retval = utils.getConfigProperty('prop2');
			expect(retval).to.equal('test-prop-val');

			done();
			
		});	
	});
});

