/* global describe it beforeAll beforeEach afterAll afterEach expect */
const BotiumBindings = require('botium-bindings')
const jasmineHelper = BotiumBindings.helper.jasmine()

const bb = new BotiumBindings()

describe('Botium Sample Conversation Test Suite', function () {
  beforeAll(function (done) {
    bb.beforeAll().then(done)
  }, 120000) // lots of timeout, first docker build could take pretty long

  beforeEach(function (done) {
    bb.beforeEach().then(done)
  }, 60000)

  afterEach(function (done) {
    bb.afterEach().then(done)
  }, 60000)

  afterAll(function (done) {
    bb.afterAll().then(done)
  }, 60000)

  it('should answer to hello', function (done) {
    bb.UserSaysText('hello')

    bb.WaitBotSays().then((msg) => {
      console.log('got Message: ' + JSON.stringify(msg))
      expect(msg && msg.messageText).toMatch(/echo/)
      done()
    }).catch((err) => {
      throw new Error(err)
    })
  }, 10000)

  it('should send a generic payload', function (done) {
    bb.UserSaysText('Generic')

    bb.WaitBotSays().then((msg) => {
      console.log('got Message: ' + JSON.stringify(msg))
      expect(msg && msg.sourceData && msg.sourceData.message && msg.sourceData.message.attachment && msg.sourceData.message.attachment.type).toEqual('template')
      expect(msg && msg.sourceData && msg.sourceData.message && msg.sourceData.message.attachment && msg.sourceData.message.attachment.payload.template_type).toEqual('generic')
      done()
    }).catch((err) => {
      throw new Error(err)
    })
  }, 10000)

  jasmineHelper.setupJasmineTestCases({ timeout: 60000, bb })
})
