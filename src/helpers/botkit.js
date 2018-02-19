const _ = require('lodash')

const TestMyBot = require('../testmybot')
const Queue = require('botium-core/src/helpers/Queue')

let controller = null
let msgqueue = null
let bot = null
let timeoutMillisDefault = 5000

/**
 * Setup TestMyBot and wire it with Botkit
 */
TestMyBot.prototype.beforeAll = () => Promise.resolve()
TestMyBot.prototype.afterEach = () => Promise.resolve()
TestMyBot.prototype.afterAll = () => Promise.resolve()
TestMyBot.prototype.hears = (arg) => {
  let message = null
  let postback = null

  if (_.isString(arg)) {
    message = {
      text: arg,
      seq: 1,
      is_echo: false,
      mid: 1
    }
  } else if (arg.messageText) {
    message = {
      text: arg.messageText,
      seq: 1,
      is_echo: false,
      mid: 1
    }
  } else if (arg.sourceData && arg.sourceData.postback) {
    postback = arg.sourceData.postback
  } else if (arg.sourceData) {
    message = {
      text: arg.sourceData,
      seq: 1,
      is_echo: false,
      mid: 1
    }
  } else {
    return Promise.resolve()
  }

  controller.handleWebhookPayload(
    {
      body: {
        entry: [
          {
            messaging: [
              {
                sender: { id: arg.sender },
                recipient: { id: 1 },
                timestamp: 1,
                message: message,
                postback: postback
              }
            ]
          }
        ]
      }
    }, null, bot)
  return Promise.resolve()
}
TestMyBot.prototype.says = (channel, timeoutMillis) => {
  return msgqueue.pop(timeoutMillis || timeoutMillisDefault)
}

module.exports.wireWithBotkit = (beforeEachCallback, _timeoutMillisDefault) => {
  TestMyBot.prototype.beforeEach = () => {
    msgqueue = new Queue()
    if (_timeoutMillisDefault) {
      timeoutMillisDefault = _timeoutMillisDefault
    }

    controller = beforeEachCallback()
    controller.startTicking()

    controller.on('spawned', (worker) => {
      worker.send = (message, cb) => {
        if (message.message && message.message.text) {
          msgqueue.push({ messageText: message.message.text })
        } else {
          msgqueue.push({ sourceData: message })
        }
        if (cb) {
          cb()
        }
      }
    })
    bot = controller.spawn({})

    return Promise.resolve()
  }
}
