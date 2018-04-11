const debug = require('debug')('testmybot-convo')

const globals = require('./globals')

module.exports = class ConvoReader {
  constructor (compiler, convodirs) {
    this.compiler = compiler
    if (convodirs && convodirs.length > 0) {
      this.convodirs = convodirs
    } else {
      this.convodirs = globals.get().convodirs
    }
  }

  readConvos () {
    if (this.convodirs) {
      this.convodirs.forEach((convodir) => {
        this.compiler.ReadScriptsFromDirectory(convodir)
      })
    }
    debug(`ready reading convos (${this.compiler.convos.length}), expanding utterances ...`)
    this.compiler.ExpandConvos()
    debug(`ready expanding utterances, number of test cases: (${this.compiler.convos.length}).`)
    return this.compiler.convos
  }

  readConvo (filename) {
    this.compiler.ReadScript(this.convodirs[0], filename)
    if (this.compiler.convos && this.compiler.convos.length > 0) {
      return this.compiler.convos[this.compiler.convos.length - 1]
    }
  }
}
