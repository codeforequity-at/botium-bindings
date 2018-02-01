/* global describe it before beforeEach after afterEach */

const expect = require('chai').expect
const TestMyBot = require('../testmybot')
const moduleinfo = require('../util/moduleinfo')

module.exports.setupMochaTestCases = (timeout, matcher, tmb) => {
  if (!tmb) tmb = new TestMyBot()

  if (!timeout) timeout = 60000
  if (!(matcher && typeof matcher === 'function')) {
    matcher = (response, tomatch, msg) => {
      expect(response).to.include(tomatch, msg)
    }
  }

  tmb.setupTestSuite(
    (testcaseName, testcaseFunction) => {
      it(testcaseName, testcaseFunction).timeout(timeout)
    },
    matcher,
    (err) => {
      expect.fail(null, null, err)
    }
  )
}

module.exports.setupMochaTestSuite = (timeout, matcher, tmb) => {
  if (!tmb) tmb = new TestMyBot()

  if (!timeout) timeout = 60000

  var packageJson = moduleinfo()

  describe('TestMyBot Test Suite for ' + packageJson.name, () => {
    before(function (done) {
      this.timeout(timeout)
      tmb.beforeAll().then(() => done()).catch(done)
    })
    beforeEach(function (done) {
      this.timeout(timeout)
      tmb.beforeEach().then(() => done()).catch(done)
    })
    afterEach(function (done) {
      this.timeout(timeout)
      tmb.afterEach().then(() => done()).catch(done)
    })
    after(function (done) {
      this.timeout(timeout)
      tmb.afterAll().then(() => done()).catch(done)
    })

    module.exports.setupMochaTestCases(timeout, matcher, tmb)
  })
}
