const util = require('util')
const fs = require('fs')
const path = require('path')
const debug = require('debug')('botium-bindings-cli')

const testRunnerTypes = [
  'mocha',
  'jest',
  'jasmine'
]

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  const packageJsonFile = path.resolve(process.cwd(), 'package.json')
  if (!fs.existsSync(packageJsonFile)) {
    console.log(`No package.json file found at "${packageJsonFile}", exiting.`)
    process.exit(1)
  }
  const botiumSpecDir = path.resolve(process.cwd(), argv.specdir)
  if (!fs.existsSync(botiumSpecDir)) {
    console.log(`No spec directory found at "${botiumSpecDir}", exiting.`)
    process.exit(1)
  }

  const packageJson = require(path.resolve(process.cwd(), 'package.json'))
  if (packageJson.botium) {
    console.log(`Botium Section in File "${packageJsonFile}" already present, skipping ...`)
  } else {
    packageJson.botium = {
      convodirs: [
        './spec/convo'
      ],
      expandConvos: true,
      expandUtterancesToConvos: false
    }
    fs.writeFileSync(packageJsonFile, JSON.stringify(packageJson, null, 2))
    console.log(`Added Botium Section in File "${packageJsonFile}".`)
  }

  const botiumJsonFile = path.resolve(process.cwd(), 'botium.json')
  if (fs.existsSync(botiumJsonFile)) {
    console.log(`Botium Configuration File "${botiumJsonFile}" already present, skipping ...`)
  } else {
    fs.writeFileSync(botiumJsonFile, JSON.stringify({
      botium: {
        Capabilities: {
          PROJECTNAME: packageJson.name,
          CONTAINERMODE: ''
        },
        Sources: { },
        Envs: { }
      }
    }, null, 2))
    console.log(`Botium Configuration File written to "${botiumJsonFile}".`)
  }

  const botiumSpecFile = path.resolve(botiumSpecDir, 'botium.spec.js')
  if (fs.existsSync(botiumSpecFile)) {
    console.log(`Botium Spec File "${botiumSpecFile}" already present, skipping ...`)
  } else {
    if (argv.testRunner === 'mocha') {
      fs.writeFileSync(botiumSpecFile,
        `const bb = require('botium-bindings')
bb.helper.mocha().setupMochaTestSuite()
`
      )
    } else if (argv.testRunner === 'jasmine') {
      fs.writeFileSync(botiumSpecFile,
        `const bb = require('botium-bindings')
bb.helper.jasmine().setupJasmineTestSuite()
`
      )
    } else if (argv.testRunner === 'jest') {
      fs.writeFileSync(botiumSpecFile,
        `const bb = require('botium-bindings')
bb.helper.jest().setupJestTestSuite()
`
      )
    }
    console.log(`Botium Spec File written to "${botiumSpecFile}".`)
  }
}

module.exports = {
  command: 'init [test-runner]',
  describe: 'Setup Botium project for a specific test runner',
  builder: (yargs) => {
    yargs.positional('test-runner', {
      describe: 'Test runner',
      choices: testRunnerTypes,
      default: 'mocha'
    })
    yargs.option('specdir', {
      describe: 'Project directory to place the test specs',
      default: 'spec'
    })
  },
  handler
}
