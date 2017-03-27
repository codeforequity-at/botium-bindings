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

var publishPort = process.env.TESTMYBOT_SLACK_PUBLISHPORT;
if (publishPort)
  publishPort = parseInt(publishPort);
else
  publishPort = 46199;

var userIdDefault = 'U' + randomInt(1000000000, 9999999999);
var userNameDefault = process.env.TESTMYBOT_SLACK_USERNAME;
if (!userNameDefault)
  userNameDefault = 'TestmybotUser';

var userIdMap = {};
userIdMap['me'] = userIdDefault;
userIdMap[userNameDefault] = userIdDefault;
var userNameMap = {};
userNameMap[userIdDefault] = 'me';

var botIdDefault = 'B' + randomInt(1000000000, 9999999999);
var botNameDefault = process.env.TESTMYBOT_SLACK_BOTNAME;
if (!botNameDefault)
  botNameDefault = 'testmybot';

var teamIdDefault = 'T' + randomInt(1000000000, 9999999999);
var teamNameDefault = process.env.TESTMYBOT_SLACK_TEAMNAME;
if (!teamNameDefault)
  teamNameDefault = 'TestmybotTeam';

var dmChannelIdDefault = 'D' + randomInt(1000000000, 9999999999);

var pubChannelIdDefault = 'C' + randomInt(1000000000, 9999999999);
var pubChannelNameDefault = process.env.TESTMYBOT_SLACK_CHANNELNAME;
if (!pubChannelNameDefault)
  pubChannelNameDefault = '#general';

var channelIdMap = {};
channelIdMap[pubChannelNameDefault] = pubChannelIdDefault;
var channelNameMap = {};
channelNameMap[pubChannelIdDefault] = pubChannelNameDefault;
channelNameMap[dmChannelIdDefault] = '#private';

var authToken = process.env.TESTMYBOT_AUTH_TOKEN;

var apiAppId = process.env.TESTMYBOT_APPID;
if (!apiAppId)
  apiAppId = 'AXXXXXXXXX';

var accessToken = 'xoxp-XXXXXXXX-XXXXXXXX-XXXXX';
var accessTokenBot = 'xoxb-XXXXXXXXXXXX-TTTTTTTTTTTTTT';


var eventurl = process.env.TESTMYBOT_SLACK_EVENTURL;
if (!eventurl) {
  var eventport = process.env.TESTMYBOT_SLACK_EVENTPORT;
  var eventpath = process.env.TESTMYBOT_SLACK_EVENTPATH;
  var eventhost = process.env.TESTMYBOT_SLACK_EVENTHOST;
  var eventprotocol = process.env.TESTMYBOT_SLACK_EVENTPROTOCOL;
  
  if (!eventport || !eventhost || !eventprotocol) {
    console.log('TESTMYBOT_SLACK_EVENTURL env variables not set');
    process.exit(1);
  }
  
  eventurl = eventprotocol + '://' + eventhost + ':' + eventport + '/';
  if (eventpath)
    eventurl += eventpath;
}
var oauthurl = process.env.TESTMYBOT_SLACK_OAUTHURL;
if (!oauthurl) {
  var oauthport = process.env.TESTMYBOT_SLACK_OAUTHPORT;
  var oauthpath = process.env.TESTMYBOT_SLACK_OAUTHPATH;
  var oauthhost = process.env.TESTMYBOT_SLACK_OAUTHHOST;
  var oauthprotocol = process.env.TESTMYBOT_SLACK_OAUTHPROTOCOL;
  
  if (!oauthport || !oauthhost || !oauthprotocol) {
    console.log('TESTMYBOT_SLACK_OAUTHURL env variables not set');
    process.exit(1);
  }
  
  oauthurl = oauthprotocol + '://' + oauthhost + ':' + oauthport + '/';
  if (oauthpath)
    oauthurl += oauthpath;
}

var demomode = (process.env.TESTMYBOT_SLACK_DEMOMODE === 'true');

if (!demomode) {

  var appMock = express();
  appMock.use(bodyParser.json());
  appMock.use(bodyParser.urlencoded({ extended: true }));
  
  appMock.post('/api/oauth.access', function(req, res) {
    console.log('/api/oauth.access: ' + JSON.stringify(req.body));
    
    res.json({
      access_token: accessToken,
      scope: 'read',
      team_name: teamIdDefault,
      team_id: teamIdDefault,
      incoming_webhook: {
        url: 'http://slack.com/incomingWebhook',
        channel: pubChannelNameDefault,
        configuration_url: 'http://slack.com/incomingWebhook'
      },
      bot: {
        bot_user_id: botIdDefault,
        bot_access_token: accessTokenBot
      }
    });
  });  
  
  appMock.post('/api/auth.test', function(req, res) {
    console.log('/api/auth.test: ' + JSON.stringify(req.body));
    
    if (req.body.token === accessTokenBot) {
      res.json({
        ok: true,
        url: 'https://myteam.slack.com/',
        team: teamNameDefault,
        user: botNameDefault,
        team_id: teamIdDefault,
        user_id: botIdDefault
      });
    } else {
      res.json({
        ok: true,
        url: 'https://myteam.slack.com/',
        team: teamNameDefault,
        user: userNameDefault,
        team_id: teamIdDefault,
        user_id: userIdDefault
      });
    }
  });  

  appMock.post('/api/im.open', function(req, res) {
    console.log('/api/im.open: ' + JSON.stringify(req.body));
    
    res.json({
      ok: true,
      channel: {
        id: dmChannelIdDefault
      }
    });
  });
  
  appMock.post('/api/channels.list', function(req, res) {
    res.json({
      ok: true,
      channels: [
        {
          id: pubChannelIdDefault,
          name: pubChannelNameDefault,
          created: getTs(),
          creator: userIdDefault,
          is_archived: false,
        }
      ]
    });    
  });
  
  appMock.post('/api/chat.postMessage', function(req, res) {
    console.log('/api/chat.postMessage: ' + JSON.stringify(req.body));
    
    var saysContent = {
      orig: req.body,
    };
    
    if (req.body.text) {
      saysContent.messageText = req.body.text;
    }
    saysContent.message = req.body;
    if (req.body.channel) {
      if (channelNameMap[req.body.channel])
        saysContent.channelId = channelNameMap[req.body.channel];
      else
        saysContent.channelId = req.body.channel;
    }
    broadcastBotSays(saysContent);    
    
    res.json({
      ok: true,
      ts: getTs(),
      channel: req.body.channel,
      message: req.body
    });
  });   
  
  appMock.all('/incomingWebhook', function(req, res) {

  });  
  
  
  appMock.all('*', function(req, res) {
    console.log('*: ' + req.body);
    
    res.json({
      ok: true
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
    var urlparts = url.parse(oauthurl);

    tcpPortUsed.check(parseInt(urlparts.port), urlparts.hostname)
    .then(function(inUse) {
        console.log('port usage (' + oauthurl + '): ' + inUse);
        if (inUse) {
          console.log('checking (' + oauthurl + ') for response');
          var options = {
            uri: oauthurl,
            method: 'GET',
            qs: { code: 'C123123123', state: 'C123123123' }
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

    if (channel) {
      if (channelIdMap[channel]) {
        channel = channelIdMap[channel];
      }
    }
    if (!channel)
      channel = dmChannelIdDefault;
  
    if (from) {
      if (userIdMap[from]) {
        from = userIdMap[from];
      }
    }
    if (!from)
      from = userIdDefault;
  
  
    var ts = getTs();
    
    var eventContainer = {
      token: authToken,
      team_id: teamIdDefault,
      api_app_id: apiAppId,
      type: 'event_callback',
      authed_users: [
        from
      ],
      event_id: ts
    };

    if (_.isString(msg)) {
      eventContainer.event = {
        type: 'message',
        text: msg
      };
    } else if (_.isPlainObject(msg)) {
      eventContainer.event = msg;
    }
    
    if (eventContainer.event.text) {
      eventContainer.event.text = eventContainer.event.text.replace('@' + botNameDefault, '<@' + botIdDefault + '|' + botNameDefault + '>');
    }

    if (!eventContainer.event.user) eventContainer.event.user = from;
    if (!eventContainer.event.channel) eventContainer.event.channel = channel;
    if (!eventContainer.event.ts) eventContainer.event.ts = ts;

    callWebhook(eventContainer);
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
	socket.on('bothears', function (from, msg, channel) {
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
    uri: eventurl,
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

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}