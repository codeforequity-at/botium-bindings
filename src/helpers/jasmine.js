const testbuilder = require('../testbuilder');
const testmybot = require('../testmybot');

module.exports.setupJasmineTestCases = function(timeout, matcher) {
  
  if (!timeout) timeout = 60000;
  if (!(matcher && typeof matcher === 'function')) matcher = (response, tomatch) => {
    expect(response).toContain(tomatch);
  };

  testbuilder.setupTestSuite(
    (testcaseName, testcaseFunction) => {
      it(testcaseName, testcaseFunction, timeout);
    },
    matcher,
    (err) => fail(err),
    testmybot.hears,
    testmybot.says
  );
};

module.exports.setupJasmineTestSuite = function(timeout, matcher) {

  if (!timeout) timeout = 60000;

  var packageJson = require(process.cwd() + '/package.json');
  
  describe('TestMyBot Test Suite for ' + packageJson.name, function() {
  
    beforeAll(function(done) {
      testmybot.beforeAll().then(done, done.fail);
    }, timeout);

    beforeEach(function(done) {
      testmybot.beforeEach().then(done, done.fail);
    }, timeout);

    afterEach(function(done) {
      testmybot.afterEach().then(done, done.fail);
    }, timeout);
    
    afterAll(function(done) {
      testmybot.afterAll().then(done, done.fail);
    }, timeout);
  
    module.exports.setupJasmineTestCases(timeout, matcher);
  });
};

module.exports.generateJUnit = function() {
  const Jasmine = require.main.require('jasmine');
  const JasmineReporters = require.main.require('jasmine-reporters');

  var junitReporter = new JasmineReporters.JUnitXmlReporter({
    savePath: process.cwd(),
    consolidateAll: true
  });

  const jasmine = new Jasmine();
  jasmine.addReporter(junitReporter);
  jasmine.loadConfigFile(process.cwd() + '/spec/support/jasmine.json');
  jasmine.execute();
};
