const path = require('path')
const fs = require('fs')
const async = require('async')
const _ = require('lodash')
const debug = require('debug')('testmybot-readconfig')

let configfile = 'testmybot.json'

function setConfigFile (c) {
  configfile = c
}

function readAndMergeConfig (configToSet) {
  return new Promise((resolve, reject) => {
    var resolvedConfig = {}

    async.series([
      (readDefaultConfigDone) => {
        fs.readFile(path.resolve(__dirname, '../testmybot.default.json'), (err, contents) => {
          if (err) {
            debug('could not read file testmybot.default.json: ' + err)
            readDefaultConfigDone()
          } else {
            var configJson = JSON.parse(contents)
            if (configJson) {
              _.merge(resolvedConfig, configJson)
            }
            readDefaultConfigDone()
          }
        })
      },

      (readConfigDone) => {
        fs.readFile(configfile, (err, contents) => {
          if (err) {
            debug('could not read file testmybot.json: ' + err)
            readConfigDone()
          } else {
            var configJson = JSON.parse(contents)
            if (configJson) {
              _.merge(resolvedConfig, configJson)
            }
            readConfigDone()
          }
        })
      },

      (mergeManualConfigDone) => {
        if (configToSet) {
          _.merge(resolvedConfig, configToSet)
        }
        mergeManualConfigDone()
      }
    ],
    (err) => {
      if (err) reject(err)
      else resolve(resolvedConfig)
    })
  })
}

module.exports = {
  setConfigFile: setConfigFile,
  readAndMergeConfig: readAndMergeConfig
}
