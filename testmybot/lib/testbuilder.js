'use strict';

const log = require('./util/log');
const convo = require('./convo');

const async = require('async');
const _ = require('lodash');

function setupTestSuite(testcaseCb, assertCb, failCb, hears, says) {
  
  var testcaseConvos = convo.readConvosSync();
 
  testcaseConvos.forEach(function(testcaseConvo) {
    log.info('adding test case ' + testcaseConvo.name + ' (file: ' + testcaseConvo.filename + ')');
    
    testcaseCb(testcaseConvo.name, function(testcaseDone) {
      log.info('running testcase ' + testcaseConvo.name);
      
      convo.readConvo(testcaseConvo.filename).then(
        (testcase) => {
          
          async.eachSeries(testcase.conversation,
            (convomsg, convomsgDone) => {
              
              if (convomsg.from === 'me') {
                log.debug(testcase.name + ': hears ' + convomsg.msg);
                hears(convomsg.msg, convomsg.from, convomsg.channel).then(convomsgDone).catch(convomsgDone);
              } else if (convomsg.from === 'bot') {
                log.debug(testcase.name + ': wait for says (channel: ' + convomsg.channel + ')');
                says(convomsg.channel).then((saysmsg) => {
                  if (saysmsg.messageText) {
                    log.debug(testcase.name + ': says ' + saysmsg.messageText);

										var response = saysmsg.messageText.split(/\r?\n/).map((line) => line.trim()).join(' ').trim();
										var tomatch = convomsg.msg.split(/\r?\n/).map((line) => line.trim()).join(' ').trim();
                    assertCb(response, tomatch);
                  } else {
                    log.debug(testcase.name + ': says ' + JSON.stringify(saysmsg));

                    compareObject(assertCb, failCb, saysmsg, convomsg.msg);
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

function compareObject(assertCb, failCb, result, expected) {

  if (expected === null || expected === undefined)
    return;
  
  if (_.isObject(expected)) {
    _.forOwn(expected, function(value, key) { 
      
      if (result.hasOwnProperty(key)) {
        compareObject(assertCb, failCb, result[key], expected[key]);
      } else {
        failCb('missing property: ' + key);
      }
    });
  } else {
    assertCb(result, expected);  
  }
}

module.exports = {
  setupTestSuite: setupTestSuite
};