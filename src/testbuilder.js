'use strict';

const log = require('./util/log');
const convo = require('./convo');

const util = require('util');
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
                log.debug(testcase.name + ': user says ' + convomsg.msg);
                if (_.isString(convomsg.msg)) {
                  hears({ messageText: convomsg.msg, sender: convomsg.from, channel: convomsg.channel }).then(() => convomsgDone()).catch(convomsgDone);
                } else {
                  hears({ sourceData: convomsg.msg, sender: convomsg.from, channel: convomsg.channel }).then(() => convomsgDone()).catch(convomsgDone);
                }
              } else if (convomsg.from === 'bot') {
                log.debug(testcase.name + ': wait for bot says (channel: ' + convomsg.channel + ')');
                says(convomsg.channel, 5000).then((saysmsg) => {
                  if (saysmsg && saysmsg.messageText) {
                    log.debug(testcase.name + ': bot says ' + saysmsg.messageText);

										var response = saysmsg.messageText.split(/\r?\n/).map((line) => line.trim()).join(' ').trim();
										var tomatch = convomsg.msg.split(/\r?\n/).map((line) => line.trim()).join(' ').trim();
                    assertCb(response, tomatch);
                  } else if (saysmsg && saysmsg.sourceData) {
                    log.debug(testcase.name + ': bot says ' + JSON.stringify(saysmsg.sourceData));

                    compareObject(assertCb, failCb, saysmsg.sourceData, convomsg.msg);
                  } else {
                    log.debug(testcase.name + ': bot says nothing');
                    
                    failCb('bot says nothing');
                  }
                  convomsgDone();
                }).catch((err) => {
                  convomsgDone(err);
                });
              }
            },
            (err) => {
              if (err) {
                log.info(testcase.name + ' failed: ' + util.inspect(err));
                testcaseDone(err);
              } else {
								log.info(testcase.name + ' ready, calling done function.');
								testcaseDone();
							}
            });
        }, 
        (err) => {
          log.info(testcaseConvo.name + ' failed reading ' + testcaseConvo.filename + ': ' + err);
          testcaseDone(err);
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
