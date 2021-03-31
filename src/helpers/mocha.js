/* global describe it before beforeEach after afterEach */

const BotiumBindings = require('../BotiumBindings')

const defaultTimeout = process.env.BOTIUM_MOCHA_TIMEOUT || 60000

const setupMochaTestCases = ({ timeout = defaultTimeout, testcaseSelector, bb } = {}) => {
  bb = bb || new BotiumBindings()

  bb.setupTestSuite(
    (testcase, testcaseFunction) => {
      if (testcaseSelector && !testcaseSelector(testcase)) return false

      it(testcase.header.name, testcaseFunction).timeout(timeout)
      return true
    }
  )
}

const setupMochaTestSuite = ({ timeout = defaultTimeout, name, testcaseSelector, bb } = {}) => {
  bb = bb || new BotiumBindings()
  name = name || bb.getTestSuiteName()

  describe(name, () => {
    before(function (done) {
      this.timeout(timeout)
      bb.beforeAll().then(() => done()).catch(done)
    })
    beforeEach(function (done) {
      this.timeout(timeout)
      bb.beforeEach().then(() => done()).catch(done)
    })
    afterEach(function (done) {
      this.timeout(timeout)
      bb.afterEach().then(() => done()).catch(done)
    })
    after(function (done) {
      this.timeout(timeout)
      bb.afterAll().then(() => done()).catch(done)
    })

    setupMochaTestCases({ timeout, testcaseSelector, bb })
  })
}

module.exports = {
  setupMochaTestCases,
  setupMochaTestSuite
}
