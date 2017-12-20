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

function on(event, listener) {
  if (driver) {
    driver.on(event, listener);
  }
}

function afterAll() {
  let result = Promise.resolve();
  if (container) {
    result = container.Clean();
  }
  container = null;
  driver = null;
  return result;
}

function beforeEach() {
  if (container) {
    return container.Start();
  } else {
    return Promise.reject('container not available');
  }
}

function afterEach() {
  if (container) {
    return container.Stop();
  } else {
    return Promise.resolve();
  }
}

function setupTestSuite(testcaseCb, assertCb, failCb) {
  console.log('setupTestSuite');
  testbuilder.setupTestSuite(testcaseCb, assertCb, failCb, hears, says);
}

function hears(arg) {
  if (container) {
    if (_.isString(arg)) {
      return container.UserSaysText(arg);
    } else {
      return container.UserSays(arg);
    }
  } else {
    return Promise.reject('container not available');
  }
}

function says(channel, timeoutMillis) {
  if (container) {
    return container.WaitBotSays(timeoutMillis);
  } else {
    return Promise.reject('container not available');
  }
}

module.exports = {
  beforeAll: beforeAll,
  afterAll: afterAll,
  beforeEach : beforeEach,
  afterEach: afterEach,
  setupTestSuite: setupTestSuite,
  on: on,
  hears: hears,
  says: says
};