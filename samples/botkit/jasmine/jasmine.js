const Jasmine = require('jasmine');
const reporters = require('jasmine-reporters');
const Promise = require('bluebird');

var junitReporter = new reporters.JUnitXmlReporter({
  savePath: __dirname,
  consolidateAll: false
});

var tmb = require('testmybot/lib/testmybot-local');
var runner = null;
var msgqueue = null;

tmb.beforeAll = function(configToSet, msgqueueToSet) {
  msgqueue = msgqueueToSet;
  return Promise.resolve();
};
tmb.beforeEach = function() {
  runner = require('./bot')('page_token', 'verify_token');
  runner.bot.send = function(message, cb) {
    console.log('bot.send: ' + JSON.stringify(message));
    
    if (message.text)
      msgqueue.push({ messageText: message.text });
    else
      msgqueue.push({ message: message });
    if (cb) cb();
  };
  return Promise.resolve();
};
tmb.hears = function(msg, from, channel) {
  console.log('bot.hears: ' + JSON.stringify(msg));
  
  var message = null;
  var postback = null;
  
  if (msg.postback) {
    postback = msg.postback;
  } else {
    message = {
      text: msg,
      seq: 1,
      is_echo: false,
      mid: 1
    };
  }
  
  runner.controller.handleWebhookPayload(
  {
    body: {
      entry: [
        {
          messaging: [
            {
              sender: { id: from },
              recipient: { id: 1 },
              timestamp: 1,
              message: message,
              postback: postback
            }
          ]
        }
      ]
    }
  }, null, runner.bot);
  return Promise.resolve();
};

const jasmine = new Jasmine();
jasmine.addReporter(junitReporter);
jasmine.loadConfigFile('./spec/support/jasmine.json');
jasmine.execute();