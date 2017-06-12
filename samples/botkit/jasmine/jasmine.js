const Jasmine = require('jasmine');
const reporters = require('jasmine-reporters');
const botkitHelper = require('testmybot/helper/botkit');

botkitHelper.wireWithBotkit(() => require('./bot')('page_token', 'verify_token'));

/* Define the JUnit XML Reporter for outputing Test Reports as XML */
var junitReporter = new reporters.JUnitXmlReporter({
  savePath: __dirname,
  consolidateAll: false
});

const jasmine = new Jasmine();
jasmine.addReporter(junitReporter);
jasmine.loadConfigFile('./spec/support/jasmine.json');
jasmine.execute();