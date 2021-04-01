/* global describe it beforeAll beforeEach afterAll afterEach fail */

const BotiumBindings = require('../BotiumBindings')

const defaultTimeout = process.env.BOTIUM_JASMINE_TIMEOUT || 60000

const setupJasmineTestCases = ({ timeout = defaultTimeout, testcaseSelector, bb } = {}) => {
  bb = bb || new BotiumBindings()

  bb.setupTestSuite(
    (testcase, testcaseFunction) => {
      if (testcaseSelector && !testcaseSelector(testcase)) return false

      it(
        testcase.header.name,
        (done) => {
          testcaseFunction((err) => {
            if (err) {
              fail(err)
            }
            done()
          })
        },
        timeout)
      return true
    },
    null,
    (err) => fail(err)
  )
}

const setupJasmineTestSuite = ({ timeout = defaultTimeout, name, testcaseSelector, bb } = {}) => {
  bb = bb || new BotiumBindings()
  name = name || bb.getTestSuiteName()

  describe(name, () => {
    beforeAll((done) => {
      bb.beforeAll().then(() => done()).catch(done.fail)
    }, timeout)

    beforeEach((done) => {
      bb.beforeEach().then(() => done()).catch(done.fail)
    }, timeout)

    afterEach((done) => {
      bb.afterEach().then(() => done()).catch(done.fail)
    }, timeout)

    afterAll((done) => {
      bb.afterAll().then(() => done()).catch(done.fail)
    }, timeout)

    setupJasmineTestCases({ timeout, testcaseSelector, bb })
  })
}

module.exports = {
  setupJasmineTestCases,
  setupJasmineTestSuite
}
