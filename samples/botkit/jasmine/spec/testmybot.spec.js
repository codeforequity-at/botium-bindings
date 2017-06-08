const bot = require('testmybot');

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
  
  bot.setupTestSuite(
    (testcaseName, testcaseFunction) => {
      it(testcaseName, testcaseFunction, 60000);
    },
    (response, tomatch) => {
      expect(response).toContain(tomatch);
    },
    (err) => fail(err)
  )
});
 