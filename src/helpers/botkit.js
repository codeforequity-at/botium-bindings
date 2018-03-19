const util = require('util')
const _ = require('lodash')
const debug = require('debug')('testmybot-botkit')

const globals = require('../globals')

/**
 * Setup TestMyBot and wire it with Botkit
 */
module.exports.wireWithBotkit = (beforeEachCallback) => {
  globals.get().configToSet = {
    botium: {
      Capabilities: {
        CONTAINERMODE: 'inprocess'
      }
    }
  }

  let controller = null
  let bot = null

  globals.get().hooks.beforeAllPre = (tmb) => {
    tmb.driver.on('MESSAGE_SENTTOBOT', (container, mockMsg) => {
      let message = null
      let postback = null

      if (_.isString(mockMsg)) {
        message = {
          text: mockMsg,
          seq: 1,
          is_echo: false,
          mid: 1
        }
      } else if (mockMsg.messageText) {
        message = {
          text: mockMsg.messageText,
          seq: 1,
          is_echo: false,
          mid: 1
        }
      } else if (mockMsg.sourceData && mockMsg.sourceData.postback) {
        postback = mockMsg.sourceData.postback
      } else if (mockMsg.sourceData) {
        message = {
          text: mockMsg.sourceData,
          seq: 1,
          is_echo: false,
          mid: 1

        }
      } else {
        return Promise.resolve()
      }
      debug(`MESSAGE_SENTTOBOT injecting message from testmybot (${util.inspect(mockMsg)}) into botkit: ${util.inspect(message)}`)

      controller.handleWebhookPayload(
        {
          body: {
            entry: [
              {
                messaging: [
                  {
                    sender: { id: mockMsg.sender },
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
    })
  }

  globals.get().hooks.beforeEachPre = (tmb) => {
    controller = beforeEachCallback()
    controller.startTicking()

    controller.on('spawned', (worker) => {
      worker.send = (message, cb) => {
        const mockMsg = { sourceData: message }
        if (message.message && message.message.text) {
          mockMsg.messageText = message.message.text
        }
        debug(`worker.send injecting message from botkit (${util.inspect(message)}) into testmybot: ${util.inspect(mockMsg)}`)
        tmb.container.InjectBotSays(mockMsg)
        if (cb) {
          cb()
        }
      }
    })
    bot = controller.spawn({})
  }
}
