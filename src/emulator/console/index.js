const TestMyBot = require('../../testmybot');
const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const async = require('async');
const readline = require('readline');

const tmb = new TestMyBot()

module.exports = () => {
  tmb.beforeAll().then(() => { 
    return tmb.beforeEach();
  }).then(function() {
    
    var conversation = [];
    
    tmb.driver.on('MESSAGE_RECEIVEDFROMBOT', (container, msg) => {
      if (msg) {
        if (msg.messageText) {
          console.log(chalk.blue('BOT SAYS ' + (msg.channel ? '(' + msg.channel + '): ' : ': ') + msg.messageText));
          conversation.push({ from: 'bot', msg: msg.messageText, channel: msg.channel });
        } else if (msg.sourceData && msg.sourceData.message) {
          console.log(chalk.blue('BOT SAYS ' + (msg.channel ? '(' + msg.channel + '): ' : ': ')));
          console.log(chalk.blue(JSON.stringify(msg.sourceData.message, null, 2)));
          conversation.push({ from: 'bot', msg: JSON.stringify(msg.sourceData, null, 2), channel: msg.channel });
        }
      }
    });

    clear();
    console.log(
      chalk.yellow(
        figlet.textSync('TestMyBot', { horizontalLayout: 'full' })
      )
    );
    const helpText = 'Enter "#SAVE <conversation name>" to save your conversation into your Testsuite-directory, #EXIT to quit or just a message to send to your Chatbot!';

    console.log(chalk.green('Chatbot online.'));
    console.log(chalk.green(helpText));

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', function(line){
      if (!line) return;
      
      if (line.toLowerCase() === '#exit') {
        
        console.log(chalk.yellow('TestMyBot stopping ...'))
        tmb.afterEach().then(() => tmb.afterAll()).then(() => console.log(chalk.green('TestMyBot stopped'))).then(() => process.exit(0)).catch((err) => console.log(chalk.red(err)));
      
      } else if (line.toLowerCase().startsWith('#save')) {

        const name = line.substr(5).trim();
        if (!name) {
          console.log(chalk.red(helpText));
          return;
        }
        
        try {
          const filename = tmb.convoReader.writeConvo({ header: { name }, conversation})
          console.log(chalk.green('Conversation written to file ' + filename));
        } catch (err) {
          console.log(chalk.red(err));
        }
      } else if (line.startsWith('#')) {
        const channel = line.substr(0, line.indexOf(' '));
        const text = line.substr(line.indexOf(' ') + 1);

        tmb.hears({ messageText: text, sender: 'me', channel: channel });
        conversation.push({ from: 'me', msg: text, channel: channel });
        
      } else {
        tmb.hears({ messageText: line, sender: 'me'});
        conversation.push({ from: 'me', msg: line });
      }
    });
    
  }).catch((err) => console.log(chalk.red(JSON.stringify(err))));
};
