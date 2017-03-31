'use strict'

const testmybot = require('testmybot');
const convo = require('testmybot/lib/convo');
const io = require('socket.io-client');
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const async = require('async');
const readline = require('readline');
const inquirer = require('inquirer');

var testendpoint = '';

var demomode = (process.env.DEMO === 'true');

var configToSet = {};
if (demomode) {
  configToSet = { 'docker': { 'container': { 'testmybot-fbmock': { 'env': { 'TESTMYBOT_FACEBOOK_DEMOMODE': true } } } } };
}

testmybot.beforeAll(configToSet).then((config) => { 
	testendpoint = config.testendpoint;
	return testmybot.beforeEach();
}).then(function() {
	
	var conversation = [];
	
	var socket = io.connect(testendpoint);
	socket.on('botsays', function (data) {
		if (data) {
		
			if (data.messageText) {
				console.log(chalk.blue('BOT SAYS ' + (data.channel ? '(' + data.channel + '): ' : ': ') + data.messageText));
				conversation.push({ from: 'bot', msg: data.messageText, channel: data.channel });
			} else {
				console.log(chalk.blue('BOT SAYS ' + (data.channel ? '(' + data.channel + '): ' : ': ')));
				console.log(chalk.blue(JSON.stringify(data.message, null, 2)));
				conversation.push({ from: 'bot', msg: JSON.stringify(data.message, null, 2), channel: data.channel });
			}
		}
	});

	clear();
	console.log(
		chalk.yellow(
			figlet.textSync('TestMyBot', { horizontalLayout: 'full' })
		)
	);
	var helpText = 'Enter "#SAVE <conversation name>" to save your conversation into your Testsuite-directory, #EXIT to quit or just a message to send to your Chatbot!';

	console.log(chalk.green('Chatbot online.'));
	console.log(chalk.green(helpText));

	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		terminal: false
	});

	rl.on('line', function(line){
		if (!line) return;
		
		if (line.toLowerCase() === '#exit') {
			
			testmybot.afterEach().then(() => testmybot.afterAll()).then(() => process.exit(0)).catch((err) => console.log(chalk.red(err)));
		
		} else if (line.toLowerCase().startsWith('#save')) {

			var name = line.substr(5).trim();
			if (!name) {
				console.log(chalk.red(helpText));
				return;
			}
				
			convo.writeConvo({ name: name, conversation: conversation}).then(
				(filename) => {
					console.log(chalk.green('Conversation written to file ' + filename));
					conversation = [];
				}).catch(
				(err) => {
					console.log(chalk.red(err));
				});
		} else if (line.startsWith('#')) {
      var channel = line.substr(0, line.indexOf(' '));
      var text = line.substr(line.indexOf(' ') + 1);

			socket.emit('bothears', 'me', text, channel);
			conversation.push({ from: 'me', msg: text, channel: channel });
      
		} else {
			socket.emit('bothears', 'me', line);
			conversation.push({ from: 'me', msg: line });
		}
	});
	
}).catch((err) => console.log(chalk.red(err)));
