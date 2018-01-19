const path = require('path')

module.exports = () => {
  let packageJson = null

  try {
    packageJson = require(path.resolve(process.cwd(), 'package.json'))
  } catch (e) {
  }
  if (!packageJson) {
    try {
      let tmb = require(path.resolve(process.cwd(), 'testmybot.json'))
      packageJson = {
        name: tmb.botium.Capabilities.PROJECTNAME
      }
    } catch (e) {
    }
  }
  if (!packageJson) packageJson = {}
  if (!packageJson.name) packageJson.name = '<Unknown Module>'
  if (!packageJson.version) packageJson.version = 'unknown'
  return packageJson
}
