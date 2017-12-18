const testmybot = require('./testmybot');

module.exports = testmybot;
module.exports.helper = {
  jasmine: () => require('./helpers/jasmine'),
  mocha: () => require('./helpers/mocha'),
  botkit: () => require('./helpers/botkit')
};
