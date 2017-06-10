'use strict';

const docker = require('./util/dockercmd');
const log = require('./util/log');

const request = require('request');
const Promise = require('bluebird');
const async = require('async');
const url = require('url');
const tcpPortUsed = require('tcp-port-used');
const io = require('socket.io-client');
const _ = require('lodash');

var config = null;
var msgqueue = null;
var socket = null;

function beforeAll(configToSet, msgqueueToSet) {
  config = configToSet;
  msgqueue = msgqueueToSet;
  
  return new Promise(function(beforeAllResolve, beforeAllReject) {
  
    async.series([
      
      function(dockerImageReady) {
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
        beforeAllResolve();
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
            log.debug('checking port usage (' + config.testendpoint + ') before proceed (to have mocks online)');
 
            tcpPortUsed.check(parseInt(urlparts.port), urlparts.hostname)
            .then(function(inUse) {
                log.debug('port usage (' + config.testendpoint + '): ' + inUse);
                if (inUse) {
                  online = true;
                  callback();
                } else {
                  setTimeout(callback, 2000);
                }
            }, function(err) {
              log.warn('error on port check: ' + err);
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

      function(startupPhaseDone) {
        if (config.startupphase) {
          setTimeout(startupPhaseDone, config.startupphase);
        } else {
          startupPhaseDone();  
        }
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
              } else if (response && response.statusCode === 200) {
                log.debug('chatbot (testmybot) is online!');
                online = true;
                callback();
              } else {
                setTimeout(callback, 2000);
              }
            });
          },
          (err) => endpointOnline(err)
        );
      },
      
      function(socketStartDone) {
        
        if (socket) {
          socket.disconnect();
          socket = null;
        }
        
        socket = io.connect(config.testendpoint);
        socket.on('botsays', function (saysContent) {
          log.debug('socket received botsays event ' + JSON.stringify(saysContent));
          if (saysContent) {
            msgqueue.push(saysContent);
          }
        });
        socket.on('error', function(err) {
          log.error('socket connection error! ' + err);
        });
        socketStartDone();
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
    
      function(socketStopDone) {
        if (socket) {
          socket.disconnect();
          socket = null;
        }
        socketStopDone();
      },
    
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

function hears(msg, from, channel) {
  return new Promise(function(hearsResolve, hearsReject) {
    if (socket) {
      socket.emit('bothears', msg, from, channel);
      hearsResolve();
    } else {
      hearsReject('Socket not online');
    }
  });
}

module.exports = {
  beforeAll: beforeAll,
  afterAll: afterAll,
  beforeEach : beforeEach,
  afterEach: afterEach,
  hears: hears
};