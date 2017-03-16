'use strict'

const log = require('./util/log');

const Promise = require('bluebird');
const writeFile = Promise.promisify(require('fs').writeFile);
const mkdirp = Promise.promisify(require('mkdirp'));
const async = require('async');

function writeConvo(name, convo) {

	var dir = './spec/convo/';
	var filename = dir + name + '.convo.txt';
	
  return new Promise(function(writeConvoResolve, writeConvoReject) {


    async.series([
      
      function(createDirectoryDone) {
				mkdirp(dir).then(() => createDirectoryDone()).catch((err) => createDirectoryDone(err));
      },
	
			function(writeConvoDone) {

				var contents = '';
			
				convo.forEach(function (set) {
					contents += '#' + set.from + '\r\n';
					contents += set.msg + '\r\n\r\n';
				});

				writeFile(filename, contents).then(() => writeConvoDone()).catch((err) => writeConvoDone(err));
			},

    ],
    function(err) {
      if (err)
        writeConvoReject(err);
      else
        writeConvoResolve(filename);
    });			
	});			
}

module.exports = {
	writeConvo: writeConvo
};
