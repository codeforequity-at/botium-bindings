/**
 * Setup TestMyBot and wire it with Botkit
 */
 
var tmbLocal = require('../lib/testmybot-local');

module.exports.wireWithBotkit = function(beforeEachCallback) {

  var msgqueue = null;
  
  tmbLocal.beforeAll = function(configToSet, msgqueueToSet) {
    msgqueue = msgqueueToSet;
    return Promise.resolve();
  };
  
  tmbLocal.beforeEach = function() {
    var controller = beforeEachCallback();
    controller.startTicking();

    controller.on('spawned', function(worker) {
      worker.send = function(message, cb) {
        if (message.text)
          msgqueue.push({ messageText: message.text });
        else
          msgqueue.push({ message: message });
        if (cb) cb();
      };
    });

    var bot = controller.spawn({});
    
    tmbLocal.hears = function(msg, from, channel) {
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
      
      controller.handleWebhookPayload(
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
      }, null, bot);
      return Promise.resolve();
    };    
    return Promise.resolve();
  };
};
