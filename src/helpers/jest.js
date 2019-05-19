/* global describe test it beforeAll beforeEach afterAll afterEach */

const BotiumBindings = require('../BotiumBindings')

const setupJestTestCases = ({ testcaseSelector, bb } = {}) => {
  bb = bb || new BotiumBindings()

  let testCount = 0
  bb.setupTestSuite(
    (testcase, testcaseFunction) => {
      if (testcaseSelector && !testcaseSelector(testcase)) return false

      testCount++
      test(testcase.header.name, testcaseFunction)
      return true
    }
  )
  if (testCount === 0) {
    it.skip('skip empty test suite', () => {})
  }
}

const setupJestTestSuite = ({ name, testcaseSelector, bb } = {}) => {
  bb = bb || new BotiumBindings()
  name = name || bb.getTestSuiteName()

  describe(name, () => {
    beforeAll((done) => {
      bb.beforeAll().then(() => done()).catch(done)
    })

    beforeEach((done) => {
      bb.beforeEach().then(() => done()).catch(done)
    })

    afterEach((done) => {
      bb.afterEach().then(() => done()).catch(done)
    })

    afterAll((done) => {
      bb.afterAll().then(() => done()).catch(done)
    })

    setupJestTestCases({ bb, testcaseSelector })
  })
}

module.exports = {
  setupJestTestCases,
  setupJestTestSuite
}
