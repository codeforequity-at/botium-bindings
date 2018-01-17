#!/usr/bin/env node
const yargsCmd = require('yargs')
const async = require('async')
const debug = require('debug')
const log = require('../src/util/log')
const testmybot = require('../src/testmybot')

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
    handleOptions(argv)

    if (argv.output !== 'csv' && argv.output !== 'junit') {
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

function handleOptions(argv) {
  if (argv.verbose) {
    debug.enable('botium')
    process.env.DEBUG = 'true'
  }
  if (argv.convos) {
    require('../src/convo').setConvoDir(argv.convos)
  }
  if (argv.config) {
    require('../src/readconfig').setConfigFile(argv.config)
  }
}

function runTestsuite(argv) {
  
  const testcases = []
  
  testmybot.setupTestSuite(
    (testcaseName, testcaseFunction) => {
      testcases.push({
        name: testcaseName,
        exec: testcaseFunction
      })
    },
    (check, tomatch) => {
      if (!check && !tomatch) {
        return
      }
      if (check.match(tomatch)) {
        return
      }
      throw new Error(`assert failed: "${check}" not matching "${tomatch}"`)
    },
    (err) => {
      throw new Error(err)
    }
  )
  
  async.series([
    (beforeAllDone) => {
      testmybot.beforeAll().then(
        () => beforeAllDone(),
        (err) => beforeAllDone('before all failed: ' + err)
      )
    },
  
    (testcasesDone) => {
      async.eachSeries(testcases, (testcase, testcaseDone) => {
        async.series([
          (beforeEachDone) => {
            testmybot.beforeEach().then(
              () => beforeEachDone(),
              (err) => beforeEachDone('before each failed: ' + err)
            )
          },
          
          (testcaseExecDone) => {
            testcase.exec((err) => {
              if (err) {
                testcase.success = false
                if (err.message) {
                  testcase.err = err.message
                } else {
                  testcase.err = err
                }
                if (err.stack) {
                  testcase.stack = err.stack
                }
              } else {
                testcase.success = true
              }
              testcaseExecDone()
            })
          },
          
          (afterEachDone) => {
            testmybot.afterEach().then(
              () => afterEachDone(),
              (err) => afterEachDone('after each failed: ' + err)
            )
          }
        ], 
        (err) => {
          if (err) {
            testcase.success = false
            testcase.err = err
          }
          testcaseDone()
        })
      },
      (err) => {
        log.info('all testcases ready')
        testcasesDone()
      })
    },
    
    (afterAllDone) => {
      testmybot.afterAll().then(
        () => afterAllDone(),
        (err) => afterAllDone('after all failed: ' + err)
      )
    }
  ],
  (err) => {
    if (err) {
      log.error(err)
    } else {
      log.info('testsuite ready')
      
      testcases.forEach((testcase) => {
        if (testcase.success) {
          console.log(testcase.name + ' OK')
        } else {
          console.log(testcase.name + ' FAILED: ' + testcase.err)
        }
      })
      
    }
  })
}
