#!/usr/bin/env node
const yargsCmd = require('yargs')
const Mocha = require('mocha')
const debug = require('debug')
const path = require('path')

const outputTypes = [
  'tap',
  'json',
  'xunit',
  'spec',
  'list',
  'html'
]

yargsCmd.usage('TestMyBot CLI\n\nUsage: $0 [options]') // eslint-disable-line
  .help('help').alias('help', 'h')
  .version('version', require('../package.json').version).alias('version', 'V')
  .command('run [output]', 'Run TestMyBot convo files and output test report', (yargs) => {
    yargs.positional('output', {
      describe: 'Output report type, supported: ' + outputTypes.join(),
      default: 'spec'
    })
  }, (argv) => {
    handleOptions(argv)

    if (outputTypes.findIndex((o) => o === argv.output) < 0) {
      yargsCmd.showHelp()
    } else {
      runTestsuite(argv)
    }
  })
  .command('emulator [type]', 'Launch TestMyBot emulator', (yargs) => {
    yargs.positional('type', {
      describe: 'Emulator type, supported: "console", "browser"',
      default: 'console'
    })
  }, (argv) => {
    handleOptions(argv)

    if (argv.type !== 'console' && argv.type !== 'browser') {
      yargsCmd.showHelp()
    } else if (argv.type === 'console') {
      require('../emulator-console')
    } else if (argv.type === 'browser') {
      require('../emulator-browser')
    }
  })
  .option('verbose', {
    alias: 'v',
    describe: 'Enable verbose output',
    default: false
  })
  .option('convos', {
    alias: 'C',
    describe: 'Path to the directory holding your convo files',
    default: './spec/convo'
  })
  .option('config', {
    alias: 'c',
    describe: 'Path to the TestMyBot configuration file (testmybot.json)',
    default: './testmybot.json'
  })
  .demandCommand()
  .argv

function handleOptions (argv) {
  if (argv.verbose) {
    debug.enable('testmybot*,botium*')
  }
  if (argv.convos) {
    require('../src/globals').get().convodir = argv.convos
  }
  if (argv.config) {
    require('../src/globals').get().configfile = argv.config
  }
}

function runTestsuite (argv) {
  const mocha = new Mocha({
    reporter: argv.output
  })
  mocha.addFile(path.resolve(__dirname, 'testmybot.spec.js'))

  mocha.run((failures) => {
    process.on('exit', () => {
      process.exit(failures)
    })
  })
}
