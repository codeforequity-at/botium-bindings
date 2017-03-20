'use strict';

const docker = require('./util/dockercmd');
const log = require('./util/log');
const readConfig = require('./readconfig');
const convo = require('./convo');
const MsgQueue = require('./msgqueue');

const request = require('request');
const Promise = require('bluebird');
const async = require('async');
const url = require('url');
const tcpPortUsed = require('tcp-port-used');
const io = require('socket.io-client');
const _ = require('lodash');

var channelIdDefault = randomInt(1000000000, 9999999999);

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

var config = { };
var socket = null;
var msgqueue = null;

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
        
        msgqueue = new MsgQueue();
        
        socket = io.connect(config.testendpoint);
        socket.on('botsays', function (saysContent) {
          log.debug('socket received botsays event ' + JSON.stringify(saysContent));
          if (saysContent && msgqueue) {
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
        msgqueue = null;
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

function hears(msg, channelId) {
  if (!channelId) channelId = channelIdDefault;
  
  return new Promise(function(hearsResolve, hearsReject) {
    if (socket) {
      socket.emit('bothears', channelId, msg);
      hearsResolve();
    } else {
      hearsReject('Socket not online');
    }
  });
}

function says(channelId, timeoutMillis) {
  if (!channelId) channelId = channelIdDefault;
  
  return new Promise(function(saysResolve, saysReject) {
    
    if (!timeoutMillis) 
      timeoutMillis = config.defaultsaytimeout;

    var timeoutRequest = async.timeout(function(callback) {
      msgqueue.registerListener(
        (msg) => {
          callback(null, msg);
        },
        channelId);
    }, timeoutMillis);
      
    timeoutRequest(function(err, body) {
      if (err && err.code === 'ETIMEDOUT') {
        saysReject('nothing said in time');
      } else if (err) {
        saysReject('says error: ' + err);
      } else {
        saysResolve(body);
      }
    });
  });
}

function setupTestSuite(testcaseCb, assertCb, failCb) {
  
  var testcaseFiles = convo.getConvoFilesSync();
 
  testcaseFiles.forEach(function(testcaseFile) {
    log.info('adding test case file ' + testcaseFile);
    
    testcaseCb(testcaseFile, function(testcaseDone) {
      log.info('running testcase ' + testcaseFile);
      
      convo.readConvo(testcaseFile).then(
        (testcase) => {
          
          async.eachSeries(testcase.conversation,
            (convomsg, convomsgDone) => {
              
              if (convomsg.from === 'me') {
                log.debug(testcase.name + ': hears ' + convomsg.msg);
                hears(convomsg.msg).then(convomsgDone).catch(convomsgDone);
              } else if (convomsg.from === 'bot') {
                log.debug(testcase.name + ': wait for says ');
                says().then((saysmsg) => {
                  if (saysmsg.messageText) {
                    log.debug(testcase.name + ': says ' + saysmsg.messageText);
                    assertCb(saysmsg.messageText, convomsg.msg);
                  } else {
                    log.debug(testcase.name + ': says ' + JSON.stringify(saysmsg.message));
                    assertCb(JSON.stringify(saysmsg.message), JSON.stringify(convomsg.msg));
                  }
                  convomsgDone();
                }).catch((err) => {
                  convomsgDone(err);
                });
              }
            },
            (err) => {
              if (err) {
                log.info(testcase.name + ' failed: ' + err);
                failCb(err); 
              }
              log.info(testcase.name + ' ready, calling done function.');
              testcaseDone();
            });

        }, 
        (err) => {
          failCb(err);
        });
    });
  });
}

module.exports = {
  beforeAll: beforeAll,
  afterAll: afterAll,
  beforeEach : beforeEach,
  afterEach: afterEach,
  setupTestSuite: setupTestSuite,
  hears: hears,
  says: says,
  
};