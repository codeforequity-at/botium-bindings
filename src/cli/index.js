const util = require('util')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
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
    mkdirp.sync(botiumSpecDir)
  }
  const botiumConvoDir = path.resolve(process.cwd(), argv.convodir)
  if (!fs.existsSync(botiumConvoDir)) {
    mkdirp.sync(botiumConvoDir)
  }

  const packageJson = require(path.resolve(process.cwd(), 'package.json'))
  if (packageJson.botium) {
    console.log(`Botium Section in File "${packageJsonFile}" already present, skipping ...`)
  } else {
    packageJson.botium = {
      convodirs: [
        argv.convodir
      ],
      expandConvos: true,
      expandUtterancesToConvos: false,
      expandScriptingMemoryToConvos: false
    }
    console.log(`Added Botium Section in File "${packageJsonFile}".`)
  }
  packageJson.devDependencies = packageJson.devDependencies || {}
  if (!packageJson.devDependencies[argv.testRunner]) {
    packageJson.devDependencies[argv.testRunner] = 'latest'
  }
  if (!packageJson.devDependencies['botium-bindings']) {
    packageJson.devDependencies['botium-bindings'] = 'latest'
  }
  if (!packageJson.devDependencies['botium-connector-echo']) {
    packageJson.devDependencies['botium-connector-echo'] = 'latest'
  }
  packageJson.scripts = packageJson.scripts || {}
  if (!packageJson.scripts[argv.testRunner]) {
    if (argv.testRunner === 'jest') {
      packageJson.scripts[argv.testRunner] = `jest --env node ${argv.specdir}`
    } else {
      packageJson.scripts[argv.testRunner] = `${argv.testRunner} ${argv.specdir}`
    }
  } else {
    console.warn(`You already have an npm script called ${argv.testRunner}. In order to run botium tests, you'll need an npm script running "${argv.testRunner} ${argv.specdir}"`)
  }
  fs.writeFileSync(packageJsonFile, JSON.stringify(packageJson, null, 2))

  const botiumJsonFile = path.resolve(process.cwd(), 'botium.json')
  if (fs.existsSync(botiumJsonFile)) {
    console.log(`Botium Configuration File "${botiumJsonFile}" already present, skipping ...`)
  } else {
    fs.writeFileSync(botiumJsonFile, JSON.stringify({
      botium: {
        Capabilities: {
          PROJECTNAME: packageJson.name,
          CONTAINERMODE: 'echo'
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

  const botiumEchoSample = path.resolve(botiumConvoDir, 'give_me_a_picture.convo.txt')
  if (fs.existsSync(botiumEchoSample)) {
    console.log(`Botium Convo File "${botiumEchoSample}" already present, skipping ...`)
  } else {
    fs.writeFileSync(botiumEchoSample,
      `give me picture

#me
Hello, Bot!

#bot
You said: Hello, Bot!

#me
give me a picture

#bot
Here is a picture
MEDIA http://www.botium.at/img/logo.png
`
    )
    console.log(`Botium Convo File written to "${botiumEchoSample}".`)
  }
  console.log(`Botium initialization nearly ready. You should now run "npm install" to complete, and "npm run ${argv.testRunner}" to verify.`)
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
    yargs.option('convodir', {
      describe: 'Project directory to place the convo files',
      default: path.join('spec', 'convo')
    })
  },
  handler
}
