const botkitHelper = require('testmybot/helper/botkit');
const jasmineHelper = require('testmybot/helper/jasmine');

botkitHelper.wireWithBotkit(() => require('./bot')('page_token', 'verify_token'));

jasmineHelper.generateJUnit();
