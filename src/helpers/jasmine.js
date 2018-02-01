/* global describe it beforeAll beforeEach afterAll afterEach expect fail */

const TestMyBot = require('../testmybot')
const moduleinfo = require('../util/moduleinfo')

module.exports.setupJasmineTestCases = (timeout, matcher, tmb) => {
  if (!tmb) tmb = new TestMyBot()

  if (!timeout) timeout = 60000
  if (!(matcher && typeof matcher === 'function')) {
    matcher = (response, tomatch) => {
      expect(response).toContain(tomatch)
    }
  }

  tmb.setupTestSuite(
    (testcaseName, testcaseFunction) => {
      it(testcaseName, testcaseFunction, timeout)
    },
    matcher,
    (err) => fail(err)
  )
}

module.exports.setupJasmineTestSuite = (timeout, matcher, tmb) => {
  if (!tmb) tmb = new TestMyBot()

  if (!timeout) timeout = 60000

  var packageJson = moduleinfo()

  describe('TestMyBot Test Suite for ' + packageJson.name, () => {
    beforeAll((done) => {
      tmb.beforeAll().then(done, done.fail)
    }, timeout)

    beforeEach((done) => {
      tmb.beforeEach().then(done, done.fail)
    }, timeout)

    afterEach((done) => {
      tmb.afterEach().then(done, done.fail)
    }, timeout)

    afterAll((done) => {
      tmb.afterAll().then(done, done.fail)
    }, timeout)

    module.exports.setupJasmineTestCases(timeout, matcher, tmb)
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
