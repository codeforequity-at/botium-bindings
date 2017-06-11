const bot = require('testmybot');
const botHelper = require('testmybot/helper/jasmine');

describe('TestMyBot Sample Conversation Test Suite', function() {

  beforeAll(function(done) {
    bot.beforeAll().then(done);
  }, 180000);

  beforeEach(function(done) {
    bot.beforeEach().then(done);
  }, 180000);

  afterEach(function(done) {
    bot.afterEach().then(done);
  }, 180000);
  
  afterAll(function(done) {
    bot.afterAll().then(done);
  }, 180000);

  botHelper.setupJasmineTestSuite(60000);
});
 