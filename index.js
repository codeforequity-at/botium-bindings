const testmybot = require('./src/testmybot')

module.exports = testmybot

module.exports.globals = () => require('./src/globals').get()

module.exports.helper = {
  jasmine: () => require('./src/helpers/jasmine'),
  jest: () => require('./src/helpers/jest'),
  mocha: () => require('./src/helpers/mocha'),
  botkit: () => require('./src/helpers/botkit')
}
