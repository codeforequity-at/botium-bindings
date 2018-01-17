const path = require('path')
const expect = require.main.require('chai').expect;
const testbuilder = require('../testbuilder');
const testmybot = require('../testmybot');

module.exports.setupMochaTestCases = function(timeout, matcher) {

  if (!timeout) timeout = 60000;
  if (!(matcher && typeof matcher === 'function')) matcher = (response, tomatch, msg) => {
      expect(response).to.include(tomatch, msg);
  };

  testbuilder.setupTestSuite(
    (testcaseName, testcaseFunction) => {
      it(testcaseName, testcaseFunction).timeout(timeout);
    },
    matcher,
    (err) => {
			expect.fail(null, null, err);
		},
    testmybot.hears,
    testmybot.says
  );
};

module.exports.setupMochaTestSuite = function(timeout, matcher) {

  if (!timeout) timeout = 60000;

  var packageJson = require(path.resolve(process.cwd(), 'package.json'));
  
  describe('TestMyBot Test Suite for ' + packageJson.name, function() {
  
    before(function(done) {
      this.timeout(timeout);
      testmybot.beforeAll().then(() => done()).catch(done);
    });
    beforeEach(function(done) {
      this.timeout(timeout);
      testmybot.beforeEach().then(() => done()).catch(done);
    });
    afterEach(function(done) {
      this.timeout(timeout);
      testmybot.afterEach().then(() => done()).catch(done);
    });
    after(function(done) {
      this.timeout(timeout);
      testmybot.afterAll().then(() => done()).catch(done);
    });
  
    module.exports.setupMochaTestCases(timeout, matcher);
  });
};
