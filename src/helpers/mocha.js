/* global describe it before beforeEach after afterEach */

const expect = require('chai').expect
const addContext = require('mochawesome/addContext')
const TestMyBot = require('../testmybot')
const moduleinfo = require('../util/moduleinfo')

const defaultTimeout = 60000

const setupMochaTestCases = ({ timeout: timeout = defaultTimeout, testcaseSelector, tmb } = {}) => {
  if (!tmb) tmb = new TestMyBot()

  tmb.setupTestSuite(
    (testcase, testcaseFunction) => {
      if (testcaseSelector && !testcaseSelector(testcase)) return

      it(testcase.header.name, function (testcaseDone) {
        const messageLog = []
        const listenerMe = (container, msg) => {
          messageLog.push('#me: ' + msg.messageText)
        }
        const listenerBot = (container, msg) => {
          messageLog.push('#bot: ' + msg.messageText)
        }
        tmb.driver.on('MESSAGE_SENTTOBOT', listenerMe)
        tmb.driver.on('MESSAGE_RECEIVEDFROMBOT', listenerBot)

        testcaseFunction((err) => {
          addContext(this, { title: 'Conversation Log', value: messageLog.join('\n') })
          tmb.driver.eventEmitter.removeListener('MESSAGE_SENTTOBOT', listenerMe)
          tmb.driver.eventEmitter.removeListener('MESSAGE_RECEIVEDFROMBOT', listenerBot)

          testcaseDone(err)
        })
      }).timeout(timeout)
    },
    null,
    (err) => {
      expect.fail(null, null, err)
    }
  )
}

const setupMochaTestSuite = ({ timeout: timeout = defaultTimeout, name, testcaseSelector, tmb } = {}) => {
  if (!tmb) tmb = new TestMyBot()
  if (!name) {
    let packageJson = moduleinfo()
    name = 'TestMyBot Test Suite for ' + packageJson.name
  }

  describe(name, () => {
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

    setupMochaTestCases({ timeout, testcaseSelector, tmb })
  })
}

module.exports = {
  setupMochaTestCases,
  setupMochaTestSuite
}
