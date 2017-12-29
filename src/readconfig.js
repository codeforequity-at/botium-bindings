'use strict'

const log = require('./util/log');

const path = require('path');
const fs = require('fs');
const async = require('async');
const _ = require('lodash');

function readAndMergeConfig(configToSet) {
  return new Promise(function(getConfigResolve, getConfigReject) {

    var resolvedConfig = {};
  
    async.series([
      
      function(readDefaultConfigDone) {
        fs.readFile(path.resolve(__dirname, '../testmybot.default.json'), (err, contents) => {
          if (err) {
            log.info('could not read file testmybot.default.json: ' + err);
            readDefaultConfigDone();
          } else {
            var configJson = JSON.parse(contents);
            if (configJson) {
              _.merge(resolvedConfig, configJson);
            }
            readDefaultConfigDone();
          }
        });
      },
      
      function(readConfigDone) {
        fs.readFile('testmybot.json', (err, contents) => {
          if (err) {
            log.warn('could not read file testmybot.json: ' + err);
            readConfigDone();
          } else {
            var configJson = JSON.parse(contents);
            if (configJson) {
              _.merge(resolvedConfig, configJson);
            }
            readConfigDone();
          }
        });
      },
      
      function(mergeManualConfigDone) {
        if (configToSet) {
          _.merge(resolvedConfig, configToSet);
        }
        mergeManualConfigDone();
      }
      
    ],
    function(err) {
      if (err)
        getConfigReject(err);
      else
        getConfigResolve(resolvedConfig);
    });
  });     
}

module.exports = {
  readAndMergeConfig: readAndMergeConfig
};