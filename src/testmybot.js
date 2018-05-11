const util = require('util')
const async = require('async')
const _ = require('lodash')
const debug = require('debug')('testmybot-main')

const BotDriver = require('botium-core').BotDriver

const readConfig = require('./readconfig')
const ConvoReader = require('./convo')
const globals = require('./globals')

module.exports = class TestMyBot {
  constructor (configToSet = {}, convodirs = [], configfile = null) {
    this.config = readConfig(configToSet, configfile)
    debug(JSON.stringify(this.config, null, 2))

    this.driver = new BotDriver()
      .setCapabilities(this.config.botium.Capabilities)
      .setEnvs(this.config.botium.Envs)
      .setSources(this.config.botium.Sources)

    this.compiler = this.driver.BuildCompiler()
    this.convoReader = new ConvoReader(this.compiler, convodirs)
    this.container = null
  }

  _callHook (hookName, arg) {
    if (globals.get().hooks[hookName]) {
      debug(`calling testmybot hook ${hookName}`)
      globals.get().hooks[hookName](this, arg)
    }
  }

  beforeAll () {
    this._callHook('beforeAllPre')

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
    this._callHook('afterAllPre')

    let result = Promise.resolve()
    if (this.container) {
      result = this.container.Clean()
    }
    this.container = null
    return result
  }

  beforeEach () {
    this._callHook('beforeEachPre')
    if (this.container) {
      return this.container.Start()
    } else {
      return Promise.reject(new Error('Botium Initialization failed. Please see error messages above (enable debug logging).'))
    }
  }

  afterEach () {
    this._callHook('afterEachPre')
    if (this.container) {
      return this.container.Stop()
    } else {
      return Promise.resolve()
    }
  }

  setupTestSuite (testcaseCb, assertCb, failCb) {
    const convos = this.convoReader.readConvos()

    if (assertCb) {
      this.compiler.scriptingEvents.assertBotResponse = assertCb
    }
    if (failCb) {
      this.compiler.scriptingEvents.fail = failCb
    }

    convos.forEach((convo) => {
      debug('adding test case ' + convo.header.toString())
      testcaseCb(convo, (testcaseDone) => {
        if (this.container) {
          debug('running testcase ' + convo.header.toString())

          convo.Run(this.container)
            .then(() => {
              debug('Test Case "' + convo.header.name + '" ready, calling done function.')
              testcaseDone()
            })
            .catch((err) => {
              debug('Test Case "' + convo.header.name + '" failed: ' + util.inspect(err))
              testcaseDone(err)
            })
        } else {
          testcaseDone(new Error('Botium Initialization failed. Please see error messages above (enable debug logging).'))
        }
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
      return Promise.reject(new Error('Botium Initialization failed. Please see error messages above (enable debug logging).'))
    }
  }

  says (channel, timeoutMillis) {
    if (this.container) {
      return this.container.WaitBotSays(channel, timeoutMillis)
    } else {
      return Promise.reject(new Error('Botium Initialization failed. Please see error messages above (enable debug logging).'))
    }
  }
}
