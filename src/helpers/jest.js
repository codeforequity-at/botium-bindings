/* global describe test beforeAll beforeEach afterAll afterEach */

const TestMyBot = require('../testmybot')
const moduleinfo = require('../util/moduleinfo')

module.exports.setupJestTestCases = ({ testcaseSelector, tmb } = {}) => {
  if (!tmb) tmb = new TestMyBot()

  tmb.setupTestSuite(
    (testcase, testcaseFunction) => {
      if (testcaseSelector && !testcaseSelector(testcase)) return

      test(testcase.header.name, testcaseFunction)
    }
  )
}

module.exports.setupJestTestSuite = ({ name, testcaseSelector, tmb } = {}) => {
  if (!tmb) tmb = new TestMyBot()
  if (!name) {
    let packageJson = moduleinfo()
    name = 'TestMyBot Test Suite for ' + packageJson.name
  }

  describe(name, () => {
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

    module.exports.setupJestTestCases({ tmb, testcaseSelector })
  })
}
