#!/usr/bin/env node
const yargsCmd = require('yargs')

yargsCmd
  .usage('TestMyBot CLI\n\nUsage: $0 [options]')
  .help('help').alias('help', 'h')
  .version('version', require('../package.json').version).alias('version', 'V')
  .command('run [output]', 'Run TestMyBot convo files and output test report', (yargs) => {
    yargs.positional('output', {
      describe: 'Output report type, supported: "csv", "junit"',
      default: 'csv'
    })
  }, (argv) => {
    if (argv.verbose) {
      process.env.DEBUG = 'true'
    }

    if (argv.output !== 'csv' && argv.output !== 'junit') {
      yargsCmd.showHelp()
    } else {
      console.log(argv.output)
    }
  })
  .command('emulator [type]', 'Launch TestMyBot emulator', (yargs) => {
    yargs.positional('type', {
      describe: 'Emulator type, supported: "console", "browser"',
      default: 'console'
    })
  }, (argv) => {
    if (argv.verbose) {
      process.env.DEBUG = 'true'
    }
    
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
  .option('out', {
    alias: 'o',
    describe: 'Path to the output directory',
    default: './'
  })
  .option('outfile', {
    alias: 'O',
    describe: 'Filename for the output report',
    default: 'testmybot.out.[csv|xml]'
  })  
  .demandCommand()
  .argv
