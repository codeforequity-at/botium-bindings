const readConfig = require('./readconfig')
const testbuilder = require('./testbuilder')
const BotDriver = require('botium-core').BotDriver

const async = require('async')
const _ = require('lodash')
const debug = require('debug')('testmybot-main')

var config = { }
var driver = null
var container = null

function beforeAll (configToSet) {
  return new Promise((resolve, reject) => {
    async.series([
      (readConfigDone) => {
        readConfig.readAndMergeConfig(configToSet).then((resolvedConfig) => {
          config = resolvedConfig
          readConfigDone()
        }).catch((err) => {
          readConfigDone(err)
        })
      },

      (containerReady) => {
        debug(JSON.stringify(config, null, 2))

        driver = new BotDriver()
          .setCapabilities(config.botium.Capabilities)
          .setEnvs(config.botium.Envs)
          .setSources(config.botium.Sources)

        driver.Build()
          .then((c) => {
            container = c
            containerReady()
          })
          .catch(containerReady)
      }
    ],
    (err) => {
      if (err) reject(err)
      else resolve(config)
    })
  })
}

function on (event, listener) {
  if (driver) {
    driver.on(event, listener)
  }
}

function afterAll () {
  let result = Promise.resolve()
  if (container) {
    result = container.Clean()
  }
  container = null
  driver = null
  return result
}

function beforeEach () {
  if (container) {
    return container.Start()
  } else {
    return Promise.reject(new Error('container not available'))
  }
}

function afterEach () {
  if (container) {
    return container.Stop()
  } else {
    return Promise.resolve()
  }
}

function setupTestSuite (testcaseCb, assertCb, failCb) {
  testbuilder.setupTestSuite(testcaseCb, assertCb, failCb, hears, says)
}

function hears (arg) {
  if (container) {
    if (_.isString(arg)) {
      return container.UserSaysText(arg)
    } else {
      return container.UserSays(arg)
    }
  } else {
    return Promise.reject(new Error('container not available'))
  }
}

function says (channel, timeoutMillis) {
  if (container) {
    return container.WaitBotSays(channel, timeoutMillis)
  } else {
    return Promise.reject(new Error('container not available'))
  }
}

module.exports = {
  beforeAll: beforeAll,
  afterAll: afterAll,
  beforeEach: beforeEach,
  afterEach: afterEach,
  setupTestSuite: setupTestSuite,
  on: on,
  hears: hears,
  says: says
}
