'use strict';

const url = require('url');

function debug(message) {
  if (process.env.DEBUG)
    console.log('DEBUG: ' + message);
}

function info(message) {
  console.log('INFO: ' + message);
}

function warn(message) {
  console.log('WARN: ' + message);
}

function error(message) {
  console.log('ERROR: ' + message);
}

function debugReq(req) {
	var fullUrl = url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: req.url
  });	
	
	debug('METHOD: ' + req.method);
	debug('URL: ' + fullUrl);
	if (req.body) {
		debug('BODY: ' + JSON.stringify(req.body));
	}
	debug('--------------');
}

module.exports = {
  debug: debug,
  debugReq: debugReq,
  info: info,
  warn: warn,
  error: error
};
