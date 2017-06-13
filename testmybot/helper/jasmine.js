const testbuilder = require('../lib/testbuilder');
const testmybot = require('../lib/testmybot');

module.exports.setupJasmineTestCases = function(timeout) {
  
  if (!timeout) timeout = 60000;
  
  testbuilder.setupTestSuite(
    (testcaseName, testcaseFunction) => {
      it(testcaseName, testcaseFunction, timeout);
    },
    (response, tomatch) => {
      expect(response).toContain(tomatch);
    },
    (err) => fail(err),
    testmybot.hears,
    testmybot.says
  );
};

module.exports.setupJasmineTestSuite = function(timeout) {

  if (!timeout) timeout = 60000;

  var packageJson = require(process.cwd() + '/package.json');
  
  describe('TestMyBot Test Suite for ' + packageJson.name, function() {
  
    beforeAll(function(done) {
      testmybot.beforeAll().then(done);
    }, timeout);

    beforeEach(function(done) {
      testmybot.beforeEach().then(done);
    }, timeout);

    afterEach(function(done) {
      testmybot.afterEach().then(done);
    }, timeout);
    
    afterAll(function(done) {
      testmybot.afterAll().then(done);
    }, timeout);
  
    module.exports.setupJasmineTestCases(timeout);
  });
};

module.exports.generateJUnit = function() {
  const Jasmine = require.main.require('jasmine');
  const JasmineReporters = require.main.require('jasmine-reporters');

  var junitReporter = new JasmineReporters.JUnitXmlReporter({
    savePath: process.cwd(),
    consolidateAll: false
  });

  const jasmine = new Jasmine();
  jasmine.addReporter(junitReporter);
  jasmine.loadConfigFile(process.cwd() + '/spec/support/jasmine.json');
  jasmine.execute();
};
