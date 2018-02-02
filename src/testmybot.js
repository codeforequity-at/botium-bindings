const util = require('util')
const async = require('async')
const _ = require('lodash')
const debug = require('debug')('testmybot-main')

const BotDriver = require('botium-core').BotDriver

const readConfig = require('./readconfig')
const ConvoReader = require('./convo')

module.exports = class TestMyBot {
  constructor (configToSet = {}) {
    this.config = readConfig(configToSet)
    debug(JSON.stringify(this.config, null, 2))

    this.driver = new BotDriver()
      .setCapabilities(this.config.botium.Capabilities)
      .setEnvs(this.config.botium.Envs)
      .setSources(this.config.botium.Sources)

    this.convoReader = new ConvoReader(this.driver.BuildCompiler())
    this.container = null
  }

  beforeAll () {
    return new Promise((resolve, reject) => {
      async.series([
        (containerReady) => {
          this.driver.Build()
            .then((c) => {
              this.container = c
              containerReady()
            })
            .catch(containerReady)
        }
      ],
      (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  afterAll () {
    let result = Promise.resolve()
    if (this.container) {
      result = this.container.Clean()
    }
    this.container = null
    return result
  }

  beforeEach () {
    if (this.container) {
      return this.container.Start()
    } else {
      return Promise.reject(new Error('container not available'))
    }
  }

  afterEach () {
    if (this.container) {
      return this.container.Stop()
    } else {
      return Promise.resolve()
    }
  }

  setupTestSuite (testcaseCb, assertCb, failCb) {
    const convos = this.convoReader.readConvos()

    convos.forEach((convo) => {
      debug('adding test case ' + convo.header.name + ' (file: ' + convo.filename + ')')
      testcaseCb(convo.header.name, (testcaseDone) => {
        debug('running testcase ' + convo.header.name)

        convo.Run(this.container, assertCb, failCb)
          .then(() => {
            debug(convo.header.name + ' ready, calling done function.')
            testcaseDone()
          })
          .catch((err) => {
            debug(convo.header.name + ' failed: ' + util.inspect(err))
            testcaseDone(err)
          })
      })
    })
  }

  hears (arg) {
    if (this.container) {
      if (_.isString(arg)) {
        return this.container.UserSaysText(arg)
      } else {
        return this.container.UserSays(arg)
      }
    } else {
      return Promise.reject(new Error('container not available'))
    }
  }

  says (channel, timeoutMillis) {
    if (this.container) {
      return this.container.WaitBotSays(channel, timeoutMillis)
    } else {
      return Promise.reject(new Error('container not available'))
    }
  }
}
