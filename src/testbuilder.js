const convo = require('./convo')

const util = require('util')
const async = require('async')
const _ = require('lodash')
const debug = require('debug')('testmybot-readconfig')

function setupTestSuite (testcaseCb, assertCb, failCb, hears, says) {
  var testcaseConvos = convo.readConvosSync()

  testcaseConvos.forEach((testcaseConvo) => {
    debug('adding test case ' + testcaseConvo.name + ' (file: ' + testcaseConvo.filename + ')')

    testcaseCb(testcaseConvo.name, (testcaseDone) => {
      debug('running testcase ' + testcaseConvo.name)

      convo.readConvo(testcaseConvo.filename).then(
        (testcase) => {
          async.eachSeries(testcase.conversation,
            (convomsg, convomsgDone) => {
              if (convomsg.from === 'me') {
                debug(testcase.name + ': user says ' + convomsg.msg)
                if (_.isString(convomsg.msg)) {
                  hears({ messageText: convomsg.msg, sender: convomsg.from, channel: convomsg.channel }).then(() => convomsgDone()).catch(convomsgDone)
                } else {
                  hears({ sourceData: convomsg.msg, sender: convomsg.from, channel: convomsg.channel }).then(() => convomsgDone()).catch(convomsgDone)
                }
              } else if (convomsg.from === 'bot') {
                debug(testcase.name + ': wait for bot says (channel: ' + convomsg.channel + ')')
                says(convomsg.channel).then((saysmsg) => {
                  if (saysmsg && saysmsg.messageText) {
                    debug(testcase.name + ': bot says ' + saysmsg.messageText)

                    var response = saysmsg.messageText.split(/\r?\n/).map((line) => line.trim()).join(' ').trim()
                    var tomatch = convomsg.msg.split(/\r?\n/).map((line) => line.trim()).join(' ').trim()
                    assertCb(response, tomatch)
                  } else if (saysmsg && saysmsg.sourceData) {
                    debug(testcase.name + ': bot says ' + JSON.stringify(saysmsg.sourceData))

                    compareObject(assertCb, failCb, saysmsg.sourceData, convomsg.msg)
                  } else {
                    debug(testcase.name + ': bot says nothing')

                    failCb('bot says nothing')
                  }
                  convomsgDone()
                }).catch((err) => {
                  convomsgDone(err)
                })
              }
            },
            (err) => {
              if (err) {
                debug(testcase.name + ' failed: ' + util.inspect(err))
                testcaseDone(err)
              } else {
                debug(testcase.name + ' ready, calling done function.')
                testcaseDone()
              }
            })
        },
        (err) => {
          debug(testcaseConvo.name + ' failed reading ' + testcaseConvo.filename + ': ' + err)
          testcaseDone(err)
        })
    })
  })
}

function compareObject (assertCb, failCb, result, expected) {
  if (expected === null || expected === undefined) return

  if (_.isObject(expected)) {
    _.forOwn(expected, (value, key) => {
      if (result.hasOwnProperty(key)) {
        compareObject(assertCb, failCb, result[key], expected[key])
      } else {
        failCb('missing property: ' + key)
      }
    })
  } else {
    assertCb(result, expected)
  }
}

module.exports = {
  setupTestSuite: setupTestSuite
}
