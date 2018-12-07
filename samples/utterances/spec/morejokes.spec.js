const fs = require('fs')
const path = require('path')
const BotiumBindings = require('botium-bindings')

if (!fs.existsSync(path.resolve(__dirname, 'convo/botium-utterances-master'))) {
  console.log('Please download botium-utterances package from https://github.com/codeforequity-at/botium-utterances and unpack it to ./spec/convo/botium-utterances-master.')
  process.exit(1)
}
const bb = new BotiumBindings({ convodirs: [ './spec/convo/botium-utterances-master/shared', './spec/convo/botium-utterances-master/convos/joke' ] })

BotiumBindings.helper.jest().setupJestTestSuite({ name: 'Good Jokes', bb, testcaseSelector: (n) => n.header.name.startsWith('jokes.get/jokes.get.more') })
