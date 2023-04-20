const util = require('util')
const path = require('path')
const promiseRetry = require('promise-retry')
const debug = require('debug')('botium-bindings-main')
const { reportUsage } = require('./metrics')

const { BotDriver, RetryHelper } = require('botium-core')

module.exports = class BotiumBindings {
  constructor ({ botiumConfig, ...args } = {}) {
    args = Object.assign({}, this.getPackageJsonBotiumSection(), args)
    debug(`Botium Bindings args: ${util.inspect(args)}`)

    this.convodirs = args.convodirs || ['./spec/convo']
    this.expandConvos = Object.prototype.hasOwnProperty.call(args, 'expandConvos') ? args.expandConvos : true
    this.expandUtterancesToConvos = Object.prototype.hasOwnProperty.call(args, 'expandUtterancesToConvos') ? args.expandUtterancesToConvos : false
    this.expandScriptingMemoryToConvos = Object.prototype.hasOwnProperty.call(args, 'expandScriptingMemoryToConvos') ? args.expandScriptingMemoryToConvos : false

    this.driver = new BotDriver(botiumConfig && botiumConfig.Capabilities, botiumConfig && botiumConfig.Sources, botiumConfig && botiumConfig.Envs)
    this.compiler = this.driver.BuildCompiler()
    this.container = null
  }

  getPackageJsonBotiumSection () {
    try {
      return require(path.resolve(process.cwd(), 'package.json')).botium || {}
    } catch (e) {
    }
    return {}
  }

  getTestSuiteName () {
    try {
      const botiumJson = require(process.env.BOTIUM_CONFIG || path.resolve(process.cwd(), 'botium.json'))
      return botiumJson.botium.Capabilities.PROJECTNAME
    } catch (e) {
    }
    let packageJson = null
    try {
      packageJson = require(path.resolve(process.cwd(), 'package.json'))
      return 'Botium Test Suite for ' + packageJson.name
    } catch (e) {
    }
    return 'Botium Test Suite'
  }

  async beforeAll () {
    this.container = await this.driver.Build()
  }

  async afterAll () {
    if (this.container) {
      await this.container.Clean()
    }
    this.container = null
  }

  async beforeEach () {
    if (this.container) {
      await this.container.Start()
    } else {
      throw new Error('Botium Initialization failed. Please see error messages above (enable debug logging).')
    }
  }

  async afterEach () {
    if (this.container) {
      await this.container.Stop()
    }
  }

  wrapBotiumError (err) {
    if (err.cause && err.cause.prettify) {
      return new Error(err.message + '\r\n' + err.cause.prettify())
    } else {
      return new Error(err.message)
    }
  }

  setupTestSuite (testcaseCb, assertCb, failCb) {
    if (this.convodirs && this.convodirs.length) {
      this.convodirs.forEach((convodir) => {
        this.compiler.ReadScriptsFromDirectory(convodir)
      })
    }
    if (this.expandUtterancesToConvos) {
      this.compiler.ExpandUtterancesToConvos()
    }
    if (this.expandScriptingMemoryToConvos) {
      this.compiler.ExpandScriptingMemoryToConvos()
    }
    if (this.expandConvos || this.expandUtterancesToConvos || this.expandScriptingMemoryToConvos) {
      this.compiler.ExpandConvos()
    }

    const usageMetrics = {
      metric: 'testexecution',
      connector: `${this.compiler.caps.CONTAINERMODE}`,
      projectname: `${this.compiler.caps.PROJECTNAME}`,
      convoCount: this.compiler.convos.length,
      convoStepCount: this.compiler.convos.reduce((sum, convo) => sum + convo.conversation.length, 0),
      partialConvoCount: Object.keys(this.compiler.partialConvos).length,
      utterancesRefCount: Object.keys(this.compiler.utterances).length,
      utterancesCount: Object.keys(this.compiler.utterances).reduce((sum, uttName) => sum + this.compiler.utterances[uttName].utterances.length, 0),
      scriptingMemoriesCount: this.compiler.scriptingMemories.length
    }
    reportUsage(usageMetrics)

    debug(`ready reading convos and utterances, number of test cases: (${this.compiler.convos.length}).`)

    if (assertCb) {
      this.compiler.scriptingEvents.assertBotResponse = assertCb
    }
    if (failCb) {
      this.compiler.scriptingEvents.fail = failCb
    }

    this.compiler.convos.forEach((convo) => {
      debug(`adding test case ${convo.header.toString()}`)
      testcaseCb(convo, (testcaseDone) => {
        if (this.container) {
          debug(`running testcase${convo.header.toString()}`)

          const retryHelper = new RetryHelper(this.container.caps, 'CONVO')
          promiseRetry(async (retry, number) => {
            try {
              await convo.Run(this.container)
            } catch (err) {
              if (retryHelper.shouldRetry(err)) {
                debug(`Running Convo "${convo.header.name}" trial #${number} failed, retry activated`)
                await this.container.Stop()
                await this.container.Start()
                debug(`Restarting container for Convo "${convo.header.name}" trial #${number} completed successfully.`)
                retry(err)
              } else {
                debug(`Running Convo "${convo.header.name}" trial #${number} failed finally`)
                throw err
              }
            }
          }, retryHelper.retrySettings)
            .then(() => {
              debug(`Test Case "${convo.header.name}" ready, calling done function.`)
              testcaseDone()
            })
            .catch((err) => {
              debug(`Test Case "${convo.header.name}" failed: ${util.inspect(err)}`)
              testcaseDone(this.wrapBotiumError(err))
            })
        } else {
          testcaseDone(new Error('Botium Initialization failed. Please see error messages above (enable debug logging).'))
        }
      })
    })
  }

  UserSaysText (...args) {
    if (this.container) {
      return this.container.UserSaysText(...args)
    } else {
      return Promise.reject(new Error('Botium Initialization failed. Please see error messages above (enable debug logging).'))
    }
  }

  UserSays (...args) {
    if (this.container) {
      return this.container.UserSays(...args)
    } else {
      return Promise.reject(new Error('Botium Initialization failed. Please see error messages above (enable debug logging).'))
    }
  }

  WaitBotSays (...args) {
    if (this.container) {
      return this.container.WaitBotSays(...args)
    } else {
      return Promise.reject(new Error('Botium Initialization failed. Please see error messages above (enable debug logging).'))
    }
  }

  WaitBotSaysText (...args) {
    if (this.container) {
      return this.container.WaitBotSaysText(...args)
    } else {
      return Promise.reject(new Error('Botium Initialization failed. Please see error messages above (enable debug logging).'))
    }
  }
}
