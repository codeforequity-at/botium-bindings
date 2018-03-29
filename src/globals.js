const settings = {
  convodirs: [ './spec/convo/' ],
  configfile: 'testmybot.json',
  configToSet: null,
  hooks: {
    beforeAllPre: null,
    beforeEachPre: null,
    afterEachPre: null,
    afterAllPre: null
  }
}

function get () {
  return settings
}

module.exports = {
  get
}
