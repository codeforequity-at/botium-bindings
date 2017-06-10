'use strict';

const request = require('request');
const express = require('express');
const https = require('https');
const http = require('http');
const bodyParser = require('body-parser');
const fs = require('fs');
const url = require('url');
const tcpPortUsed = require('tcp-port-used');
const _ = require('lodash');

var publishPort = process.env.TESTMYBOT_FACEBOOK_PUBLISHPORT;
if (publishPort)
  publishPort = parseInt(publishPort);
else
  publishPort = 46199;

var pageid = process.env.TESTMYBOT_FACEBOOK_PAGEID;
if (!pageid)
  pageid = randomInt(1000000000, 9999999999);

var userProfileIdDefault = process.env.TESTMYBOT_FACEBOOK_USERPROFILEIDDEFAULT;
if (!userProfileIdDefault)
  userProfileIdDefault = randomInt(1000000000, 9999999999);

var outputSeq = process.env.TESTMYBOT_FACEBOOK_SEQNOSTART;
if (!outputSeq)
  outputSeq = 1000;

var senddelivery = process.env.TESTMYBOT_FACEBOOK_SENDDELIVERY;
if (senddelivery === undefined)
  senddelivery = true;

var webhookurl = process.env.TESTMYBOT_FACEBOOK_WEBHOOKURL;
if (!webhookurl) {
  var webhookport = process.env.TESTMYBOT_FACEBOOK_WEBHOOKPORT;
  var webhookpath = process.env.TESTMYBOT_FACEBOOK_WEBHOOKPATH;
  var webhookhost = process.env.TESTMYBOT_FACEBOOK_WEBHOOKHOST;
  var webhookprotocol = process.env.TESTMYBOT_FACEBOOK_WEBHOOKPROTOCOL;
  
  if (!webhookport || !webhookhost || !webhookprotocol) {
    console.log('TESTMYBOT_FACEBOOK_WEBHOOKURL env variables not set');
    process.exit(1);
  }
  
  webhookurl = webhookprotocol + '://' + webhookhost + ':' + webhookport + '/';
  if (webhookpath)
    webhookurl += webhookpath;
}

var demomode = (process.env.TESTMYBOT_FACEBOOK_DEMOMODE === 'true');

if (!demomode) {

  var appMock = express();
  appMock.use(bodyParser.json());

  appMock.all('*/me/messenger_profile*', function (req, res) {
    console.log('messenger_profile called');
    res.json({ result: 'success' });
  });
  appMock.all('*/me/thread_settings*', function (req, res) {
    console.log('thread_settings called');
    res.json({ result: 'success' });
  });
  appMock.all('*/subscribed_apps*', function (req, res) {
    console.log('subscribed_apps called');
    res.json({ success: true });
  });
  appMock.all('*/me/messages*', function (req, res) {
    if (req.body) {
      
      var saysContent = {
        orig: req.body,
      };
      
      if (req.body.message && req.body.message.text && !req.body.message.quick_replies) {
        saysContent.messageText = req.body.message.text;
      }
      if (req.body.message) {
        saysContent.message = req.body.message;
      }
      if (req.body.sender_action) {
        saysContent.messageText = req.body.sender_action;
      }
      broadcastBotSays(saysContent);
    }
    
    var ts = getTs();

    var response = {
      recipient_id: userProfileIdDefault,
      message_id: 'mid.' + randomInt(1000000000, 9999999999)
    };

    if (req.body && req.body.recipient && req.body.recipient.id) {
      response.recipient_id = req.body.recipient.id;
    }
    
    res.json(response);
    
    if (senddelivery) {
      hears({
        delivery: {
            mids:[
               response.message_id
            ],									
            watermark: ts
        }
      }, response.recipient_id);
    }
  });

  appMock.all('*', function(req, res) {
    
    var loc = process.env.TESTMYBOT_FACEBOOK_USERPROFILELOCALE;
    if (!loc) loc = 'en_US';
    
    res.json({
      first_name: 'TestMyBot',
      last_name: 'TestMyBot',
      profile_pic: 'http://www.google.com',
      locale: loc,
      timezone: -7,
      gender: 'male'
    });
  });

  var httpsOptions = {
    key: fs.readFileSync('./127.0.0.1.key'),
    cert: fs.readFileSync('./127.0.0.1.cert')
  };

  var serverMock = https.createServer(httpsOptions, appMock).listen(443, '0.0.0.0', function(err) {
    if (err)
      console.log('error listening 443: ' + err);
    else
      console.log('Mock server listening on port 443');
  });
}


var appTest = express();
appTest.use(bodyParser.json());

appTest.get('/', function (req, res) {
  if (demomode) {
    res.status(200).send('demomode online');
    
  } else {
    var urlparts = url.parse(webhookurl);

    tcpPortUsed.check(parseInt(urlparts.port), urlparts.hostname)
    .then(function(inUse) {
        console.log('port usage (' + webhookurl + '): ' + inUse);
        if (inUse) {
          console.log('checking (' + webhookurl + ') for response');
          var options = {
            uri: webhookurl,
            method: 'POST',
            json: { entry: [] }
          };
          request(options, function (err, response, body) {
            if (err) {
              res.status(500).send('testendpoint not yet online');
            } else {
              res.status(200).send('testendpoint online');
            }
          });
          
        } else {
          res.status(500).send('testendpoint not yet online');
        }
    }, function(err) {
      console.log('error on port check: ' + err);
      res.status(500).send('testendpoint not yet online');
    });
  }
});

function hears(msg, from, channel) {

  if (demomode) {
    replyDemo(msg);
    
  } else {

    var ts = getTs();
    
    var msgContainer = {
      object: 'page',
      entry: [
        {
          id: pageid,
          time: ts,
          messaging: [ ]
        }
      ]
    };

    if (_.isString(msg)) {
      msgContainer.entry[0].messaging.push({
        message: {
          text: msg
        }
      });
    } else if (_.isPlainObject(msg)) {
      msgContainer.entry[0].messaging.push(msg);
    } else if (_.isArray(msg)) {
      msgContainer.entry[0].messaging = msg;
    }  

    msgContainer.entry[0].messaging.forEach(function(msg) {

      if (!msg.sender) msg.sender = {};
      if (!msg.sender.id) msg.sender.id = from;
      
      if (!msg.recipient) msg.recipient = {};
      if (!msg.recipient.id) msg.recipient.id = pageid;

      if (!msg.delivery && !msg.timestamp) msg.timestamp = ts;

      if (msg.message) {
        if (!msg.message.mid) msg.message.mid = 'mid.' + randomInt(1000000000, 9999999999);
        if (!msg.message.seq) msg.message.seq = outputSeq++;
      }
      if (msg.read) {
        if (!msg.read.seq) msg.read.seq = outputSeq++;
      }
      if (msg.delivery) {
        if (!msg.delivery.seq) msg.delivery.seq = outputSeq++;
      }
    });

    callWebhook(msgContainer);
  }
}
  
console.log('Test server start on port ' + publishPort);

var serverTest = http.createServer(appTest).listen(publishPort, '0.0.0.0', function(err) {
  if (err)
    console.log('error listening ' + publishPort + ': ' + err);
  else
    console.log('Test server listening on port ' + publishPort);
});

var io = require('socket.io')(serverTest);
io.on('connection', function (socket) {
	socket.on('bothears', function (msg, from, channel) {
		console.log('received message from', from, 'msg', JSON.stringify(msg), 'channel', channel);
		hears(msg, from, channel);
	});
});

function broadcastBotSays(saysContent) {
	io.sockets.emit('botsays', saysContent);
}


function getTs() {
  return (new Date()).getTime();
}

function callWebhook(msg) {
  console.log('callWebhook: ' + JSON.stringify(msg, null, 2));
  
  var options = {
    uri: webhookurl,
    method: 'POST',
    json: msg
  };
  request(options, function (err, response, body) {
    if (err)
      console.log('callWebhook Error: ' + err);
    else
      console.log('callWebhook OK');
  });
}

function replyDemo(msg) {
  var reply = {};
  
  if (msg === 'audio') {
    reply.message = { 
      attachment: {
        type: 'audio',
        payload: {
          url: 'https://archive.org/download/tom_sawyer_librivox/TSawyer_01-02_twain_64kb.mp3'
        }
      }
    };
  } else if (msg === 'file') {
    reply.message = { 
      attachment: {
        type: 'file',
        payload: {
          url: 'http://de.feedbooks.com/book/6498.epub'
        }
      }
    };
  } else if (msg === 'image') {
    reply.message = { 
      attachment: {
        type: 'image',
        payload: {
          url: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/Tom_Sawyer_-_frontispiece.jpg'
        }
      }
    };
  } else if (msg === 'video') {
    reply.message = { 
      attachment: {
        type: 'video',
        payload: {
          url: 'http://www.sample-videos.com/video/mp4/240/big_buck_bunny_240p_30mb.mp4'
        }
      }
    };    

  } else if (msg === 'sender_action') {
    reply.messageText = 'typing_on';

  } else if (msg === 'quick') {
    reply.message = {
      text: "Pick a color:",
      quick_replies: [
        {
          content_type: 'text',
          title: 'Red',
          payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED',
          image_url: 'http://petersfantastichats.com/img/red.png'
        },
        {
          content_type: 'text',
          title: 'Green',
          payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN',
          image_url: 'http://petersfantastichats.com/img/green.png'
        }
      ]
    };

  } else if (msg === 'location') {
    reply.message = {
      text: "Where are you ?",
      quick_replies: [
        {
          content_type: 'location'
        }
      ]
    };

  } else if (msg === 'template buttons') {
    reply.message = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: 'What do you want to do next?',
          buttons: [
            {
              type: 'web_url',
              url: 'https://petersapparel.parseapp.com',
              title: 'Show Website'
            },
            {
              type: 'postback',
              title: 'Start Chatting',
              payload: 'USER_DEFINED_PAYLOAD'
            },
            {
              type: 'phone_number',
              title: 'Call Representative',
              payload: '+15105551234'
            },
            {
              type: 'element_share'
            }            
          ]          
        }
      }
    };
    
  } else if (msg === 'template generic') {
    reply.message = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements:[
             {
              title: 'Welcome to Peter\'s Hats',
              image_url: 'https://petersfancybrownhats.com/company_image.png',
              subtitle: 'We\'ve got the right hat for everyone.',
              default_action: {
                type: 'web_url',
                url: 'https://peterssendreceiveapp.ngrok.io/view?item=103',
                messenger_extensions: true,
                webview_height_ratio: 'tall',
                fallback_url: 'https://peterssendreceiveapp.ngrok.io/'
              },
              buttons: [
                {
                  type: 'web_url',
                  url: 'https://petersfancybrownhats.com',
                  title: 'View Website'
                }, 
                {
                  type: 'postback',
                  title: 'Start Chatting',
                  payload: 'DEVELOPER_DEFINED_PAYLOAD'
                }              
              ]      
            }
          ]
        }
      }
    };
  } else if (msg === 'template list') {
    reply.message = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'list',
          elements: [
            {
              'title': 'Classic T-Shirt Collection',
              'image_url': 'https://peterssendreceiveapp.ngrok.io/img/collection.png',
              'subtitle': 'See all our colors',
              'default_action': {
                'type': 'web_url',
                'url': 'https://peterssendreceiveapp.ngrok.io/shop_collection',
                'messenger_extensions': true,
                'webview_height_ratio': 'tall',
                'fallback_url': 'https://peterssendreceiveapp.ngrok.io/'
              },
              'buttons': [
                {
                  'title': 'View',
                  'type': 'web_url',
                  'url': 'https://peterssendreceiveapp.ngrok.io/collection',
                  'messenger_extensions': true,
                  'webview_height_ratio': 'tall',
                  'fallback_url': 'https://peterssendreceiveapp.ngrok.io/'                        
                }
              ]
            },
            {
              'title': 'Classic White T-Shirt',
              'image_url': 'https://peterssendreceiveapp.ngrok.io/img/white-t-shirt.png',
              'subtitle': '100% Cotton, 200% Comfortable',
              'default_action': {
                'type': 'web_url',
                'url': 'https://peterssendreceiveapp.ngrok.io/view?item=100',
                'messenger_extensions': true,
                'webview_height_ratio': 'tall',
                'fallback_url': 'https://peterssendreceiveapp.ngrok.io/'
              },
              'buttons': [
                {
                  'title': 'Shop Now',
                  'type': 'web_url',
                  'url': 'https://peterssendreceiveapp.ngrok.io/shop?item=100',
                  'messenger_extensions': true,
                  'webview_height_ratio': 'tall',
                  'fallback_url': 'https://peterssendreceiveapp.ngrok.io/'                        
                }
              ]
            },
            {
              'title': 'Classic Blue T-Shirt',
              'image_url': 'https://peterssendreceiveapp.ngrok.io/img/blue-t-shirt.png',
              'subtitle': '100% Cotton, 200% Comfortable',
              'default_action': {
                'type': 'web_url',
                'url': 'https://peterssendreceiveapp.ngrok.io/view?item=101',
                'messenger_extensions': true,
                'webview_height_ratio': 'tall',
                'fallback_url': 'https://peterssendreceiveapp.ngrok.io/'
              },
              'buttons': [
                {
                  'title': 'Shop Now',
                  'type': 'web_url',
                  'url': 'https://peterssendreceiveapp.ngrok.io/shop?item=101',
                  'messenger_extensions': true,
                  'webview_height_ratio': 'tall',
                  'fallback_url': 'https://peterssendreceiveapp.ngrok.io/'                        
                }
              ]                
            },
            {
              'title': 'Classic Black T-Shirt',
              'image_url': 'https://peterssendreceiveapp.ngrok.io/img/black-t-shirt.png',
              'subtitle': '100% Cotton, 200% Comfortable',
              'default_action': {
                'type': 'web_url',
                'url': 'https://peterssendreceiveapp.ngrok.io/view?item=102',
                'messenger_extensions': true,
                'webview_height_ratio': 'tall',
                'fallback_url': 'https://peterssendreceiveapp.ngrok.io/'
              },
              'buttons': [
                {
                  'title': 'Shop Now',
                  'type': 'web_url',
                  'url': 'https://peterssendreceiveapp.ngrok.io/shop?item=102',
                  'messenger_extensions': true,
                  'webview_height_ratio': 'tall',
                  'fallback_url': 'https://peterssendreceiveapp.ngrok.io/'                        
                }
              ]
            }
          ],
          'buttons': [
            {
              'title': 'View More',
              'type': 'postback',
              'payload': 'payload'                        
            }
          ]
        }
      }
    };

        
  } else if (_.isString(msg)) {
    reply.messageText = 'ECHO: ' + msg;
  } else {
    reply.messageText = 'GOT IT (structured message)';
  }
  
  broadcastBotSays(reply);
}

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}