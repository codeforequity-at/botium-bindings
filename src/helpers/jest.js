/* global describe test beforeAll beforeEach afterAll afterEach */

const BotiumBindings = require('../BotiumBindings')

const setupJestTestCases = ({ testcaseSelector, bb } = {}) => {
  bb = bb || new BotiumBindings()

  bb.setupTestSuite(
    (testcase, testcaseFunction) => {
      if (testcaseSelector && !testcaseSelector(testcase)) return

      test(testcase.header.name, testcaseFunction)
    }
  )
}

const setupJestTestSuite = ({ name, testcaseSelector, bb } = {}) => {
  bb = bb || new BotiumBindings()

  if (!name) {
    let packageJson = bb.getModuleInfo()
    name = 'Botium Test Suite for ' + packageJson.name
  }

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
