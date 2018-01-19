/* global describe it before beforeEach after afterEach */

const expect = require('chai').expect
const testbuilder = require('../testbuilder')
const testmybot = require('../testmybot')
const moduleinfo = require('../util/moduleinfo')

module.exports.setupMochaTestCases = (timeout, matcher) => {
  if (!timeout) timeout = 60000
  if (!(matcher && typeof matcher === 'function')) {
    matcher = (response, tomatch, msg) => {
      expect(response).to.include(tomatch, msg)
    }
  }

  testbuilder.setupTestSuite(
    (testcaseName, testcaseFunction) => {
      it(testcaseName, testcaseFunction).timeout(timeout)
    },
    matcher,
    (err) => {
      expect.fail(null, null, err)
    },
    testmybot.hears,
    testmybot.says
  )
}

module.exports.setupMochaTestSuite = (timeout, matcher) => {
  if (!timeout) timeout = 60000

  var packageJson = moduleinfo()

  describe('TestMyBot Test Suite for ' + packageJson.name, () => {
    before(function (done) {
      this.timeout(timeout)
      testmybot.beforeAll().then(() => done()).catch(done)
    })
    beforeEach(function (done) {
      this.timeout(timeout)
      testmybot.beforeEach().then(() => done()).catch(done)
    })
    afterEach(function (done) {
      this.timeout(timeout)
      testmybot.afterEach().then(() => done()).catch(done)
    })
    after(function (done) {
      this.timeout(timeout)
      testmybot.afterAll().then(() => done()).catch(done)
    })

    module.exports.setupMochaTestCases(timeout, matcher)
  })
}
