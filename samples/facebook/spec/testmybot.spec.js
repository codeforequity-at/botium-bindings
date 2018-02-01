const TestMyBot = require('testmybot')
const jasmineHelper = TestMyBot.helper.jasmine();

const tmb = new TestMyBot()

describe('TestMyBot Sample Conversation Test Suite', function() {

  beforeAll(function(done) {
    tmb.beforeAll().then(done);
  }, 120000); //lots of timeout, first docker build could take pretty long

  beforeEach(function(done) {
    tmb.beforeEach().then(done);
  }, 60000);

  afterEach(function(done) {
    tmb.afterEach().then(done);
  }, 60000);
  
  afterAll(function(done) {
    tmb.afterAll().then(done);
  }, 60000);

  it('should answer to hello', function(done) {
    
    tmb.hears('hello');
    
    tmb.says().then((msg) => {
      console.log('got Message: ' + JSON.stringify(msg));
      expect(msg && msg.messageText).toMatch(/echo/);
      done();
    }).catch((err) => {
      throw new Error(err);
    });
  }, 10000);

  it('should send a generic payload', function(done) {
    
    tmb.hears('Generic');
    
    tmb.says().then((msg) => {
      console.log('got Message: ' + JSON.stringify(msg));
      expect(msg && msg.sourceData && msg.sourceData.message && msg.sourceData.message.attachment && msg.sourceData.message.attachment.type).toEqual('template');
      expect(msg && msg.sourceData && msg.sourceData.message && msg.sourceData.message.attachment && msg.sourceData.message.attachment.payload.template_type).toEqual('generic');
      done();
    }).catch((err) => {
      throw new Error(err);
    });
  }, 10000);

  jasmineHelper.setupJasmineTestCases(60000, null, tmb);
});