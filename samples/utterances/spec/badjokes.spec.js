const fs = require('fs')
const TestMyBot = require('testmybot')

if (!fs.existsSync(__dirname + '/convo/botium-utterances-master')) {
  console.log('Please download botium-utterances package from https://github.com/codeforequity-at/botium-utterances and unpack it to ./spec/convo/botium-utterances-master.')
  process.exit(1)
}
const tmb = new TestMyBot({}, [ './spec/convo/botium-utterances-master/shared', './spec/convo/botium-utterances-master/convos/joke' ])

TestMyBot.helper.jest().setupJestTestSuite({ name: 'Bad Jokes', tmb, testcaseSelector: (n) => n.header.name.startsWith('jokes.get/jokes.feedback.bad') })
