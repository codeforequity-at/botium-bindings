'use strict'

const log = require('./util/log');

const path = require('path');
const fs = require('fs');
const Promise = require('bluebird');
const readFile = Promise.promisify(require('fs').readFile);
const async = require('async');
const _ = require('lodash');

function readAndMergeConfig(configToSet) {
  return new Promise(function(getConfigResolve, getConfigReject) {

    var resolvedConfig = {};
  
    async.series([
      
      function(readDefaultConfigDone) {
        readFile(path.resolve(__dirname, '../testmybot.default.json')).then(function(contents) {
          var configJson = JSON.parse(contents);
          if (configJson) {
            _.merge(resolvedConfig, configJson);
          }
          readDefaultConfigDone();
        }).catch(function (err) {
          log.info('could not read file testmybot.default.json: ' + err);
          readDefaultConfigDone();
        });
      },
      
      function(readConfigDone) {
        readFile('testmybot.json').then(function(contents) {
          var configJson = JSON.parse(contents);
          if (configJson) {
            _.merge(resolvedConfig, configJson);
          }
          readConfigDone();
        }).catch(function (err) {
          log.warn('could not read file testmybot.json: ' + err);
          readConfigDone();
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