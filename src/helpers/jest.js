/* global describe it beforeAll beforeEach afterAll afterEach fail */

const TestMyBot = require('../testmybot')
const moduleinfo = require('../util/moduleinfo')

module.exports.setupJestTestCases = (tmb, testcaseSelector) => {
  if (!tmb) tmb = new TestMyBot()

  tmb.setupTestSuite(
    (testcaseName, testcaseFunction) => {
      if (!testcaseSelector || testcaseSelector(testcaseName))
        test(testcaseName, testcaseFunction)
    }
  )
}

module.exports.setupJestTestSuite = (tmb, testcaseSelector) => {
  if (!tmb) tmb = new TestMyBot()
  const packageJson = moduleinfo()

  describe('TestMyBot Test Suite for ' + packageJson.name, () => {
    beforeAll((done) => {
      tmb.beforeAll().then(() => done()).catch(done)
    })

    beforeEach((done) => {
      tmb.beforeEach().then(() => done()).catch(done)
    })

    afterEach((done) => {
      tmb.afterEach().then(() => done()).catch(done)
    })

    afterAll((done) => {
      tmb.afterAll().then(() => done()).catch(done)
    })

    module.exports.setupJestTestCases(tmb, testcaseSelector)
  })
}
