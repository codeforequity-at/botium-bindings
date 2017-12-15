'use strict';

const log = require('./util/log');
const readConfig = require('./readconfig');
const testbuilder = require('./testbuilder');
const BotDriver = require('botium-core').BotDriver;

const Promise = require('bluebird');
const async = require('async');
const _ = require('lodash');

var config = { };
var driver = null;
var container = null;

function beforeAll(configToSet) {
  return new Promise(function(beforeAllResolve, beforeAllReject) {
  
    async.series([
      
      function(readConfigDone) {
        readConfig.readAndMergeConfig(configToSet).then(function(resolvedConfig) {
          config = resolvedConfig;
          readConfigDone();
        }).catch(function(err) {
          readConfigDone(err);
        });
      },
      
      function(containerReady) {
        log.debug(JSON.stringify(config, null, 2));
				
				driver = new BotDriver()
					.setCapabilities(config.botium.Capabilities)
					.setEnvs(config.botium.Envs)
					.setSources(config.botium.Sources);

				driver.Build()
					.then((c) => {
						container = c;
						containerReady();
					})
					.catch(containerReady);
      },
    ],
    function(err) {
      if (err)
        beforeAllReject(err);
      else
        beforeAllResolve(config);
    });
  });
  
}

function afterAll() {
	return container.Clean();
}

function beforeEach() {
	return container.Start();
}

function afterEach() {
  return container.Stop();
}

function setupTestSuite(testcaseCb, assertCb, failCb) {
  testbuilder.setupTestSuite(testcaseCb, assertCb, failCb, hears, says);
}

function hears(arg) {
  if (_.isString(arg)) {
    return container.UserSaysText(arg);
  } else {
    return container.UserSays(arg);
  }
}

function says(channel, timeoutMillis) {
  return container.WaitBotSays(timeoutMillis);
}

module.exports = {
  beforeAll: beforeAll,
  afterAll: afterAll,
  beforeEach : beforeEach,
  afterEach: afterEach,
  setupTestSuite: setupTestSuite,
  hears: hears,
  says: says
};