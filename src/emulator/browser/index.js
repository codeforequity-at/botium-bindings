const TestMyBot = require('../../testmybot');
const moduleinfo = require('../../util/moduleinfo')
const path = require('path')
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const request = require('request');
const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const opn = require('opn');
const url = require('url');
const readline = require('readline');

const tmb = new TestMyBot()

module.exports = () => {
  const idePort = process.env.PORT || 3000;
  const appIde = express();
  const server = http.createServer(appIde);

  const io = require('socket.io')(server);
  io.on('connection', function (socket) {
    socket.on('bothears', function (msg, from, channel) {
      console.log('received message from', from, 'msg', JSON.stringify(msg), 'channel', channel);
      tmb.hears({ messageText: msg, sender: from, channel: channel });
    });
  });

  clear();
  console.log(
    chalk.yellow(
      figlet.textSync('TestMyBot', { horizontalLayout: 'full' })
    )
  );
  console.log(chalk.yellow('TestMyBot booting ... '));
  
  server.listen(idePort, function(err) {
    if (err) {
      console.log(chalk.red('error listening ' + idePort + ': ' + err));
      process.exit(0);
    }
    else {
      tmb.beforeAll().then(() => {
        tmb.driver.on('MESSAGE_RECEIVEDFROMBOT', (container, msg) => {
          if (msg) {
            io.sockets.emit('botsays', msg);    
          }
        });
        
        console.log(chalk.green('TestMyBot Browser Emulator listening on port ' + idePort));
        console.log(chalk.green('Enter "#EXIT" to quit!'));
        
        opn('http://127.0.0.1:' + idePort).catch((err) => console.log(chalk.yellow('Starting browser not possible (' + err + '), please connect manually')));
        
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
          terminal: false
        });
        
        rl.on('line', function(line){
          if (!line) return;
          
          if (line.toLowerCase() === '#exit') {
            console.log(chalk.yellow('TestMyBot stopping ...'))
            tmb.afterAll().then(() => console.log(chalk.green('TestMyBot stopped'))).then(() => process.exit(0)).catch((err) => console.log(chalk.red(err)));
          }
        });        
        
      }).catch((err) => console.log(chalk.red(JSON.stringify(err))));
    }
  });

  appIde.set('view engine', 'ejs');
  appIde.set('views', __dirname + '/views');

  appIde.use(bodyParser.json());

  appIde.use("/public", express.static(__dirname + '/public'));

  appIde.get('/', function (req, res) {
    const data = {
      module: moduleinfo(),
      config: {
      }
    };
    res.render('index', data);
  });

  const router = express.Router();

  router.route('/startdocker')
    .post(function(req, res) {
      tmb.afterEach().then(() => tmb.beforeEach()).then(function() {
        res.json({ success: true });
      }).catch(function (err) {
        console.log(err);
        
        res.json({ success: false, error: err });
      });
    });

  router.route('/testcases')
    .post(function(req, res) {
      if (!req.body.header || !req.body.header.name)
        return res.json({ success: false, error: 'Name not specified' });
      if (!req.body.conversation)
        return res.json({ success: false, error: 'Conversation not specified' });

      try {
        const filename = tmb.convoReader.writeConvo(req.body, true);
        return res.json({ success: true, filename: filename });
      } catch (err) {
        console.log('writeConvo error: ' + err);
        return res.json({ success: false, error: err });
      }
    }).get(function(req, res) {
      try {
        const convos = tmb.convoReader.readConvos()
        return res.json(convos);
      } catch (err) {        
        console.log('readConvos error: ' + err);
        return res.json({ success: false, error: err });
      }
    });

  router.route('/testcases/:filename')
    .get(function(req, res) {
      try {
        const convo = tmb.convoReader.readConvo(req.params.filename)
        return res.json(convo)
      } catch (err) {
        console.log('readConvo error: ' + err);
        return res.json({ success: false, error: err });
      }
    }).put(function(req, res) {
      if (!req.body.header || !req.body.header.name)
        return res.json({ success: false, error: 'Name not specified' });
      if (!req.body.filename)
        return res.json({ success: false, error: 'Filename not specified' });
      if (!req.body.conversation)
        return res.json({ success: false, error: 'Conversation not specified' });
      
      try {
        const filename = tmb.convoReader.writeConvo(req.body, false)
        return res.json({ success: true, filename: filename })
      } catch (err) {
        console.log('writeConvo error: ' + err);
        return res.json({ success: false, error: err });
      }
    });
      
  appIde.use('/api', router);
};