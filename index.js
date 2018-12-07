module.exports = require('./src/BotiumBindings')

module.exports.helper = {
  jasmine: () => require('./src/helpers/jasmine'),
  jest: () => require('./src/helpers/jest'),
  mocha: () => require('./src/helpers/mocha')
}
