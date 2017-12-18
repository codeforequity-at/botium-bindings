const testmybot = require('./testmybot');

module.exports = testmybot;
module.exports.helper = {
  jasmine: () => require('./helper/jasmine'),
  mocha: () => require('./helper/mocha'),
  botkit: () => require('./helper/botkit')
};
