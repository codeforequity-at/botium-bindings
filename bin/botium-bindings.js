#!/usr/bin/env node
const yargsCmd = require('yargs')

const handleConfig = (argv) => {
  argv.verbose = argv.v = process.env.BOTIUM_VERBOSE === '1' || argv.verbose

  if (argv.verbose) {
    require('debug').enable('botium*')
  }

  return true
}

const wrapHandler = (builder) => {
  const origHandler = builder.handler
  builder.handler = (argv) => {
    if (handleConfig(argv)) {
      origHandler(argv)
    }
  }
  return builder
}

yargsCmd.usage('Botium Bindings\n\nUsage: $0 [options]') // eslint-disable-line
  .help('help').alias('help', 'h')
  .version('version', require('../package.json').version).alias('version', 'V')
  .showHelpOnFail(true)
  .strict(true)
  .demandCommand(1, 'You need at least one command before moving on')
  .command(wrapHandler(require('../src/cli')))
  .option('verbose', {
    alias: 'v',
    describe: 'Enable verbose output (also read from env variable "BOTIUM_VERBOSE" - "1" means verbose)',
    default: false
  })
  .argv
