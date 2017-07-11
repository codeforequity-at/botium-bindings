'use strict';

const log = require('./util/log');
const slash = require('./slash');

const async = require('async');
const _ = require('lodash');

function setupSlashTestSuite(testcaseCb, assertCb, failCb, slashs, slashresponse) {
  
  var testcaseSlashs = slash.readSlashsSync();
 
  testcaseSlashs.forEach(function(testcaseSlash) {
    log.info('adding test case ' + testcaseSlash.name + ' (file: ' + testcaseSlash.filename + ')');
    
    testcaseCb(testcaseSlash.name, function(testcaseDone) {
      log.info('running testcase ' + testcaseSlash.name);
      
      slash.readSlash(testcaseSlash.filename).then(
        (testcase) => {
          
          async.eachSeries(testcase.conversation,
            (slashmsg, slashmsgDone) => {
              
              if (slashmsg.from === 'me') {
                log.debug(testcase.name + ': slashs ' + slashmsg.msg);
                slashs(slashmsg.msg, slashmsg.from, slashmsg.channel).then(slashmsgDone).catch(slashmsgDone);
              } else if (slashmsg.from === 'bot') {
                log.debug(testcase.name + ': wait for slashresponse (channel: ' + slashmsg.channel + ')');
                slashresponse(slashmsg.channel).then((slashresponsemsg) => {
                  if (slashresponsemsg.messageText) {
                    log.debug(testcase.name + ': slashresponse ' + slashresponsemsg.messageText);

		    var response = slashresponsemsg.messageText.split(/\r?\n/).map((line) => line.trim()).join(' ').trim();
		    var tomatch = slashmsg.msg.split(/\r?\n/).map((line) => line.trim()).join(' ').trim();
                    assertCb(response, tomatch);
                  } else {
                    log.debug(testcase.name + ': slashresponse ' + JSON.stringify(slashresponsemsg));

                    compareObject(assertCb, failCb, slashresponsemsg, slashmsg.msg);
                  }
                  slashmsgDone();
                }).catch((err) => {
                  slashmsgDone(err);
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
  setupSlashTestSuite: setupSlashTestSuite
};
