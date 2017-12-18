const mockery = require('mockery');
const _ = require('lodash');

const tmb = require('../testmybot');
const testbuilder = require('../testbuilder');
const Queue = require('botium-core/src/helpers/Queue');

let controller = null;
let msgqueue = null;
let bot = null;

/**
 * Setup TestMyBot and wire it with Botkit
 */

let tmbMock = {
  beforeAll: () => Promise.resolve(),
  afterEach: () => Promise.resolve(),
  afterAll: () => Promise.resolve(),
  hears: (arg) => {
    let message = null;
    let postback = null;
    
    if (_.isString(arg)) {
      message = {
        text: arg,
        seq: 1,
        is_echo: false,
        mid: 1
      };
    } else if (arg.messageText) {
      message = {
        text: arg.messageText,
        seq: 1,
        is_echo: false,
        mid: 1
      };
    } else if (arg.sourceData && arg.sourceData.postback) {
      postback = arg.sourceData.postback;
    } else if (arg.sourceData) {
      message = {
        text: arg.sourceData,
        seq: 1,
        is_echo: false,
        mid: 1
      };      
    } else {
      return Promise.resolve();
    }
    
    controller.handleWebhookPayload(
    {
      body: {
        entry: [
          {
            messaging: [
              {
                sender: { id: arg.sender },
                recipient: { id: 1 },
                timestamp: 1,
                message: message,
                postback: postback
              }
            ]
          }
        ]
      }
    }, null, bot);
    return Promise.resolve();
  },
  says: (channel, timeoutMillis) => {
    return msgqueue.pop(timeoutMillis);
  }
};
tmbMock = Object.assign(tmb, tmbMock);

mockery.registerMock('testmybot', tmbMock);    
mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false
});

module.exports.wireWithBotkit = function(beforeEachCallback) {
  tmb.beforeEach = () => {
    console.log('tmb.beforeEach');
    msgqueue = new Queue()

    controller = beforeEachCallback();
    controller.startTicking();

    controller.on('spawned', function(worker) {
      worker.send = function(message, cb) {
        if (message.message && message.message.text) {
          msgqueue.push({ messageText: message.message.text });
        } else {
          msgqueue.push({ sourceData: message });
        }
        if (cb) {
          cb();
        }
      };
    });
    bot = controller.spawn({});
    
    return Promise.resolve();
  };
};
