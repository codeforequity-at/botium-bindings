const testbuilder = require('../lib/testbuilder');
const testmybot = require('../lib/testmybot');
const path = require('path');

module.exports.setupJasmineTestSuite = function(timeout) {
  
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

module.exports.generateJUnit = function(Jasmine, JasmineReporters) {

  var junitReporter = new JasmineReporters.JUnitXmlReporter({
    savePath: process.cwd(),
    consolidateAll: false
  });

  const jasmine = new Jasmine();
  jasmine.addReporter(junitReporter);
  jasmine.loadConfigFile(process.cwd() + '/spec/support/jasmine.json');
  jasmine.execute();
};
