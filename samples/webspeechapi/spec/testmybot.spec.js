const bot = require('testmybot');

bot.helper.jasmine().setupJasmineTestSuite(60000, (response, tomatch) => {
  expect(response).toMatch(tomatch)
});