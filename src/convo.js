const slug = require('slug')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

const globals = require('./globals')

module.exports = class ConvoReader {
  constructor (compiler, convodir) {
    this.compiler = compiler
    this.convodir = convodir
    if (!this.convodir) {
      this.convodir = globals.get().convodir
    }
  }

  readConvos () {
    this.compiler.ReadScriptsFromDirectory(this.convodir)
    this.compiler.ExpandConvos()
    return this.compiler.convos
  }

  readConvo (filename) {
    this.compiler.ReadScript(this.convodir, filename)
    if (this.compiler.convos && this.compiler.convos.length > 0) {
      return this.compiler.convos[this.compiler.convos.length - 1]
    }
  }

  writeConvo (convo, errorIfExists) {
    if (!convo.filename) {
      convo.filename = slug(convo.header.name)
    }
    if (!convo.filename.endsWith('.convo.txt')) {
      convo.filename += '.convo.txt'
    }
    const filename = path.resolve(this.convodir, convo.filename)

    if (errorIfExists) {
      try {
        fs.accessSync(filename, fs.constants.R_OK)
        throw new Error(filename + ' already exists')
      } catch (err) {
      }
    }
    mkdirp.sync(this.convodir)

    const scriptData = this.compiler.Decompile([ convo ], 'SCRIPTING_FORMAT_TXT')

    fs.writeFileSync(filename, scriptData)

    return filename
  }
}
