const util = require('util')
const path = require('path')
const debug = require('debug')('botium-bindings-main')

const BotDriver = require('botium-core').BotDriver

module.exports = class BotiumBindings {
  constructor ({ botiumConfig, ...args } = {}) {
    args = Object.assign({}, this.getPackageJsonBotiumSection(), args)
    debug(`Botium Bindings args: ${util.inspect(args)}`)

    this.convodirs = args.convodirs || [ './spec/convo' ]
    this.expandConvos = args.hasOwnProperty('expandConvos') ? args.expandConvos : true
    this.expandUtterancesToConvos = args.hasOwnProperty('expandUtterancesToConvos') ? args.expandUtterancesToConvos : false

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

  beforeAll () {
    return this.driver.Build()
      .then((c) => {
        this.container = c
      })
  }

  afterAll () {
    const result = (this.container && this.container.Clean()) || Promise.resolve()
    this.container = null
    return result
  }

  beforeEach () {
    if (this.container) {
      return this.container.Start()
    } else {
      return Promise.reject(new Error('Botium Initialization failed. Please see error messages above (enable debug logging).'))
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
    if (this.convodirs && this.convodirs.length) {
      this.convodirs.forEach((convodir) => {
        this.compiler.ReadScriptsFromDirectory(convodir)
      })
    }
    if (this.expandConvos) {
      this.compiler.ExpandConvos()
    }
    if (this.expandUtterancesToConvos) {
      this.compiler.ExpandUtterancesToConvos()
      this.compiler.ExpandConvos()
    }
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

          convo.Run(this.container)
            .then(() => {
              debug(`Test Case "${convo.header.name}" ready, calling done function.`)
              testcaseDone()
            })
            .catch((err) => {
              debug(`Test Case "${convo.header.name}" failed: ${util.inspect(err)}`)
              testcaseDone(err)
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
