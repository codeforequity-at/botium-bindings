'use strict';

const docker = require('./util/dockercmd');
const log = require('./util/log');
const readConfig = require('./readconfig');

const request = require('request');
const Promise = require('bluebird');
const async = require('async');
const url = require('url');
const tcpPortUsed = require('tcp-port-used');
const _ = require('lodash');

var config = { };

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
      
      function(dockerImageReady) {
        log.debug(JSON.stringify(config, null, 2));
        docker.setupContainer(config).then(function() {
          dockerImageReady();
        }).catch(function(err) {
          dockerImageReady(err);
        });
      }
      
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
  return new Promise(function(afterAllResolve, afterAllReject) {
    async.series([

      function(teardownContainerDone) {
        docker.teardownContainer().then(function() {
          teardownContainerDone();
        }).catch(function(err) {
          teardownContainerDone(err);
        });
      }
    ],
    function(err) {
      if (err)
        afterAllReject(err);
      else
        afterAllResolve();
    });     
  });
}

function beforeEach() {
  return new Promise(function(beforeEachResolve, beforeEachReject) {

    async.series([
      
      function(startMockupsDone) {
        docker.startContainer((spec) => spec.imagename !== 'testmybot').then(function() {
          startMockupsDone();
        }).catch(function(err) {
          startMockupsDone(err);
        });
      },
      
      function(mockupOnline) {
        var urlparts = url.parse(config.testendpoint);
        
        var online = false;
        async.until(
          () => online, 
          (callback) => {
            console.log('checking port usage (' + config.testendpoint + ') before proceed (to have mocks online)');
 
            tcpPortUsed.check(parseInt(urlparts.port), urlparts.hostname)
            .then(function(inUse) {
                console.log('port usage (' + config.testendpoint + '): ' + inUse);
                if (inUse) {
                  online = true;
                  callback();
                } else {
                  setTimeout(callback, 2000);
                }
            }, function(err) {
              console.log('error on port check: ' + err);
              setTimeout(callback, 2000);
            });
          },
          (err) => mockupOnline(err)
        );
      },
      
      function(startContainerDone) {
        docker.startContainer((spec) => spec.imagename === 'testmybot').then(function() {
          startContainerDone();
        }).catch(function(err) {
          startContainerDone(err);
        });
      },
      
      function(endpointOnline) {
        var online = false;
        async.until(
          () => online, 
          (callback) => {
            var options = {
              uri: config.testendpoint,
              method: 'GET'
            };
            log.debug('checking if chatbot (testmybot) is online ...');
            request(options, function (err, response, body) {
              if (err) {
                setTimeout(callback, 2000);
              } else {
                log.debug('chatbot (testmybot) is online!');
                online = true;
                callback();
              }
            });            
          },
          (err) => endpointOnline(err)
        );
      }      
      
    ],
    function(err) {
      if (err)
        beforeEachReject(err);
      else
        beforeEachResolve();
    });     
  });
}

function afterEach() {
  return new Promise(function(afterEachResolve, afterEachReject) {

    async.series([
      function(stopContainerDone) {
        docker.stopContainer().then(function() {
          stopContainerDone();
        }).catch(function(err) {
          stopContainerDone(err);
        });
      }
    ],
    function(err) {
      if (err)
        afterEachReject(err);
      else
        afterEachResolve();
    });     
  });
}

function hears(msg, channelId) {
  log.debug('hears: ' + JSON.stringify(msg, null, 2));
 
  var options = {
    uri: config.testendpoint + '/bothears',
    method: 'POST',
    json: { msg: msg, channelId: channelId }
  };
  request(options, function (err, response, body) {
    if (err)
      log.error('hears Error: ' + err);
    else
      log.debug('hears OK');
  });
}

function says(channelId, timeoutMillis) {
  return new Promise(function(saysResolve, saysReject) {
    
    if (!timeoutMillis) 
      timeoutMillis = config.defaultsaytimeout;

    var r;
    
    var timeoutRequest = async.timeout(function(callback) {
      
      var endpoint = config.testendpoint + '/botsays';
      if (channelId)
        endpoint += '?channelId=' + channelId;

      log.debug('says wait for ' + endpoint);
      
      var options = {
        uri: endpoint,
        method: 'GET',
        json: true
      };
      r = request(options, function (err, response, body) {
        if (err) {
          callback(err);
        } else {
          callback(null, body);
        }
      });
    }, timeoutMillis);
      
    timeoutRequest(function(err, body) {
      if (err && err.code === 'ETIMEDOUT') {
        if (r && r.abort) r.abort();
        saysReject('nothing said in time');
      } else if (err) {
        saysReject('says error: ' + err);
      } else {
        saysResolve(body);
      }
      r = null;
    });
  });
}

module.exports = {
  beforeAll: beforeAll,
  afterAll: afterAll,
  beforeEach : beforeEach,
  afterEach: afterEach,
  hears: hears,
  says: says
};