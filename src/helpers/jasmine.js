/* global describe it beforeAll beforeEach afterAll afterEach fail */

const TestMyBot = require('../testmybot')
const moduleinfo = require('../util/moduleinfo')

const defaultTimeout = 60000

module.exports.setupJasmineTestCases = ({ timeout: timeout = defaultTimeout, testcaseSelector, tmb } = {}) => {
  if (!tmb) tmb = new TestMyBot()

  tmb.setupTestSuite(
    (testcaseName, testcaseFunction) => {
      if (testcaseSelector && !testcaseSelector(testcase)) return

      it(testcaseName.header.name, testcaseFunction, timeout)
    },
    null,
    (err) => fail(err)
  )
}

module.exports.setupJasmineTestSuite = ({ timeout: timeout = defaultTimeout, name, testcaseSelector, tmb } = {}) => {
  if (!tmb) tmb = new TestMyBot()
  if (!name) {
    let packageJson = moduleinfo()
    name = 'TestMyBot Test Suite for ' + packageJson.name
  }

  describe(name, () => {
    beforeAll((done) => {
      tmb.beforeAll().then(() => done()).catch(done.fail)
    }, timeout)

    beforeEach((done) => {
      tmb.beforeEach().then(() => done()).catch(done.fail)
    }, timeout)

    afterEach((done) => {
      tmb.afterEach().then(() => done()).catch(done.fail)
    }, timeout)

    afterAll((done) => {
      tmb.afterAll().then(() => done()).catch(done.fail)
    }, timeout)

    module.exports.setupJasmineTestCases({ timeout, testcaseSelector, tmb })
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
