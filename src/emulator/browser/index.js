const testmybot = require('../../testmybot');
const convo = require('../../convo');
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


module.exports = () => {
  const idePort = process.env.PORT || 3000;
  const appIde = express();
  const server = http.createServer(appIde);

  const io = require('socket.io')(server);
  io.on('connection', function (socket) {
    socket.on('bothears', function (msg, from, channel) {
      console.log('received message from', from, 'msg', JSON.stringify(msg), 'channel', channel);
      testmybot.hears({ messageText: msg, sender: from, channel: channel });
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
      testmybot.beforeAll().then(() => {
        testmybot.on('MESSAGE_RECEIVEDFROMBOT', (container, msg) => {
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
            testmybot.afterAll().then(() => console.log(chalk.green('TestMyBot stopped'))).then(() => process.exit(0)).catch((err) => console.log(chalk.red(err)));
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
    let packageJson = {
      name: 'TestMyBot module',
      version: 'unknown'
    };
    try {
      packageJson = require(path.resolve(process.cwd(), 'package.json'));
    } catch (e) {
    }
    const data = {
      module: packageJson,
      config: {
      }
    };
    res.render('index', data);
  });

  const router = express.Router();

  router.route('/startdocker')
    .post(function(req, res) {
      testmybot.afterEach().then(() => testmybot.beforeEach()).then(function() {
        res.json({ success: true });
      }).catch(function (err) {
        console.log(err);
        
        res.json({ success: false, error: err });
      });
    });

  router.route('/testcases')
    .post(function(req, res) {
      if (!req.body.name)
        return res.json({ success: false, error: 'Name not specified' });
      if (!req.body.conversation)
        return res.json({ success: false, error: 'Conversation not specified' });
      
      convo.writeConvo(req.body, true).then(
        (filename) => {
          res.json({ success: true, filename: filename });
        }).catch(
        (err) => {
          console.log('writeConvo error: ' + err);
          return res.json({ success: false, error: err });
        });    

    }).get(function(req, res) {
      
      convo.readConvos().then(
        (convos) => {
          res.json(convos);
        }).catch(
        (err) => {
          console.log('readConvos error: ' + err);
          return res.json({ success: false, error: err });
        }); 
    });

  router.route('/testcases/:filename')
    .get(function(req, res) {
      convo.readConvo(req.params.filename).then(
        (convo) => {
          res.json(convo);
        }).catch(
        (err) => {
          console.log('readConvo error: ' + err);
          return res.json({ success: false, error: err });
        }); 

    }).put(function(req, res) {
      if (!req.body.name)
        return res.json({ success: false, error: 'Name not specified' });
      if (!req.body.filename)
        return res.json({ success: false, error: 'Filename not specified' });
      if (!req.body.conversation)
        return res.json({ success: false, error: 'Conversation not specified' });
      
      convo.writeConvo(req.body, false).then(
        (filename) => {
          res.json({ success: true, filename: filename });
        }).catch(
        (err) => {
          console.log('writeConvo error: ' + err);
          return res.json({ success: false, error: err });
        });    
    });
      
  appIde.use('/api', router);
};