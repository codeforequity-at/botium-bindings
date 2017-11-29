'use strict';

const log = require('./util/log');

const fblogin = require('facebook-chat-api');
const Promise = require('bluebird');
const async = require('async');
const _ = require('lodash');

var config = null;
var msgqueue = null;
var fbapi = null;
var fbapiStopListener = null;

function beforeAll(configToSet, msgqueueToSet) {
  config = configToSet;
  msgqueue = msgqueueToSet;
  
  return new Promise(function(beforeAllResolve, beforeAllReject) {
  
    async.series([
      
      function(fbLoginReady) {
        fbapi = null;
        
        log.debug('logging into facebook ' + config.fbdirect.fbuser);
        fblogin({ email: config.fbdirect.fbuser, password: config.fbdirect.fbpassword}, { logLevel: 'warn' }, (err, api) => {
          if(err) {
            fbLoginReady(err);
          } else {
            log.debug('logging into facebook ready');
            fbapi = api;
            fbLoginReady();
          }
        });
      },
      
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
    
      function(fbLogoutReady) {
        if (fbapi) {
          log.debug('logging out of facebook ' + config.fbdirect.fbuser);
          fbapi.logout((err) => {
            log.debug('logging out of facebook ready (' + err + ')');
            fbapi = null;
            fbLogoutReady(err);
          });
        } else {
          fbLogoutReady();
        }
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
      
      function(startListenerDone) {
        if (fbapiStopListener) {
          fbapiStopListener();
          fbapiStopListener = null;
        }
        fbapiStopListener = fbapi.listen((err, event) => {
          if (err) {
            log.error('fbapi Error: ' + err);
          } else if (event.type === 'message') {
            log.debug('fbapi received message ' + JSON.stringify(event));
            if (event.body) {
              msgqueue.push({ orig: event, messageText: event.body });
            }
          } else {
            log.debug('fbapi received ignored event ' + JSON.stringify(event));
          }
        });
        startListenerDone();
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
    
      function(stopListenerDone) {
        if (fbapiStopListener) {
          fbapiStopListener();
          fbapiStopListener = null;
        }
        stopListenerDone();
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
    if (fbapi) {
      fbapi.sendMessage(msg, config.fbdirect.pageid);      
      hearsResolve();
    } else {
      hearsReject('fbapi not online');
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