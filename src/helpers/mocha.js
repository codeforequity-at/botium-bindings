/* global describe it before beforeEach after afterEach */

const expect = require('chai').expect
const addContext = require('mochawesome/addContext');
const TestMyBot = require('../testmybot')
const moduleinfo = require('../util/moduleinfo')

module.exports.setupMochaTestCases = (timeout, matcher, tmb) => {
  if (!tmb) tmb = new TestMyBot()

  if (!timeout) timeout = 60000

  tmb.setupTestSuite(
    (testcaseName, testcaseFunction) => {
      it(testcaseName, function (testcaseDone) {
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
          addContext(this,  { title: 'Conversation Log', value: messageLog.join('\n') })
          tmb.driver.eventEmitter.removeListener('MESSAGE_SENTTOBOT', listenerMe)
          tmb.driver.eventEmitter.removeListener('MESSAGE_RECEIVEDFROMBOT', listenerBot)

          testcaseDone(err)
        })
      }).timeout(timeout)
    },
    matcher,
    (err) => {
      expect.fail(null, null, err)
    },
    addContext
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
