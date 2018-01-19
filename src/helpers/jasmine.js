/* global describe it beforeAll beforeEach afterAll afterEach expect fail */

const testbuilder = require('../testbuilder')
const testmybot = require('../testmybot')
const moduleinfo = require('../util/moduleinfo')

module.exports.setupJasmineTestCases = (timeout, matcher) => {
  if (!timeout) timeout = 60000
  if (!(matcher && typeof matcher === 'function')) {
    matcher = (response, tomatch) => {
      expect(response).toContain(tomatch)
    }
  }

  testbuilder.setupTestSuite(
    (testcaseName, testcaseFunction) => {
      it(testcaseName, testcaseFunction, timeout)
    },
    matcher,
    (err) => fail(err),
    testmybot.hears,
    testmybot.says
  )
}

module.exports.setupJasmineTestSuite = (timeout, matcher) => {
  if (!timeout) timeout = 60000

  var packageJson = moduleinfo()

  describe('TestMyBot Test Suite for ' + packageJson.name, () => {
    beforeAll((done) => {
      testmybot.beforeAll().then(done, done.fail)
    }, timeout)

    beforeEach((done) => {
      testmybot.beforeEach().then(done, done.fail)
    }, timeout)

    afterEach((done) => {
      testmybot.afterEach().then(done, done.fail)
    }, timeout)

    afterAll((done) => {
      testmybot.afterAll().then(done, done.fail)
    }, timeout)

    module.exports.setupJasmineTestCases(timeout, matcher)
  })
}

module.exports.generateJUnit = () => {
  const Jasmine = require.main.require('jasmine')
  const JasmineReporters = require.main.require('jasmine-reporters')

  var junitReporter = new JasmineReporters.JUnitXmlReporter({
    savePath: process.cwd(),
    consolidateAll: true
  })

  const jasmine = new Jasmine()
  jasmine.addReporter(junitReporter)
  jasmine.loadConfigFile(process.cwd() + '/spec/support/jasmine.json')
  jasmine.execute()
}
