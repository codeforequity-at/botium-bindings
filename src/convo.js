const slug = require('slug')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const debug = require('debug')('testmybot-convo')

const globals = require('./globals')

const allowedSuffices = ['.convo.txt', '.xlsx']

module.exports = class ConvoReader {
  constructor (compiler, convodir) {
    this.compiler = compiler
    this.convodir = convodir
    if (!this.convodir) {
      this.convodir = globals.get().convodir
    }
  }

  readConvos () {
    const filenames = fs.readdirSync(this.convodir).filter((filename) => allowedSuffices.find((suffix) => filename.endsWith(suffix)))
    debug(`readConvos(${this.convodir}) found filenames: ${filenames}`)
    const convos = []
    filenames.forEach((filename) => {
      const scriptData = fs.readFileSync(path.resolve(this.convodir, filename))
      const scriptConvos = this.compiler.Compile(scriptData)
      if (scriptConvos) {
        scriptConvos.forEach((scriptConvo) => {
          scriptConvo.filename = filename
          if (!scriptConvo.header.name) {
            scriptConvo.header.name = filename
          }
          convos.push(scriptConvo)
        })
      }
    })
    return convos
  }

  readConvo (filename) {
    const scriptData = fs.readFileSync(path.resolve(this.convodir, filename))
    const scriptConvos = this.compiler.Compile(scriptData)
    if (scriptConvos && scriptConvos.length > 0) {
      scriptConvos[0].filename = filename
      if (!scriptConvos[0].header.name) {
        scriptConvos[0].header.name = filename
      }
      return scriptConvos[0]
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

    const scriptData = this.compiler.Decompile([ convo ])

    fs.writeFileSync(filename, scriptData)

    return filename
  }
}
