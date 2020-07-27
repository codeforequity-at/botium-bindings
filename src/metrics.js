const path = require('path')
const os = require('os')
const localDevPort = process.env.BOTIUM_ANALYTICS_LOCAL_PORT
const https = localDevPort ? require('http') : require('https')

const botiumAnalyticsHost = localDevPort ? 'localhost' : 'registration.botiumbox.com'
const execTimeout = 10000

function logIfVerbose (toLog, stream) {
  if (process.env.BOTIUM_ANALYTICS_VERBOSE === 'true') {
    (stream || console.log)(toLog)
  }
}

async function reportUsage (metrics) {
  if (process.env.BOTIUM_ANALYTICS === 'false') return

  const packageJson = require(path.join(__dirname, '..', 'package.json'))

  const infoPayload = Object.assign({
    rawPlatform: os.platform(),
    rawArch: os.arch(),
    library: packageJson.name,
    version: packageJson.version
  }, metrics)

  const data = JSON.stringify(infoPayload)
  logIfVerbose(`Botium analytics payload: ${data}`)

  const reqOptions = {
    host: botiumAnalyticsHost,
    port: localDevPort || 443,
    method: 'POST',
    path: '/metrics/usage',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    },
    timeout: execTimeout
  }
  await new Promise((resolve, reject) => {
    const req = https.request(reqOptions, (res) => {
      logIfVerbose(`Response status: ${res.statusCode}`)
      resolve()
    })

    req.on('error', error => {
      logIfVerbose(error, console.error)
      resolve()
    })

    req.on('timeout', error => {
      logIfVerbose(error, console.error)
      resolve()
    })

    req.write(data)
    req.end()
  })
}

module.exports = {
  reportUsage: (metrics) => {
    reportUsage(metrics).catch(e => {
      logIfVerbose(`metrics error: ${e}`, console.error)
    })
  }
}
