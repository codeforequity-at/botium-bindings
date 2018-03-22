const fs = require('fs');
const bot = require('testmybot');

if (!fs.existsSync(__dirname + '/convo/botium-utterances-master')) {
  console.log('Please download botium-utterances package from https://github.com/codeforequity-at/botium-utterances and unpack it to ./spec/convo/botium-utterances-master. Then remove all folders from "convos" subdirectory except "jokes".')
  process.exit(1)
}

bot.helper.jest().setupJestTestSuite(null, (n) => n.startsWith("jokes.get/jokes.feedback.good"));
