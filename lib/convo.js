'use strict'

const log = require('./util/log');

const Promise = require('bluebird');
const writeFile = Promise.promisify(require('fs').writeFile);
const readFile = Promise.promisify(require('fs').readFile);
const access = Promise.promisify(require('fs').access);
const readdir = Promise.promisify(require('fs').readdir);
const mkdirp = Promise.promisify(require('mkdirp'));
const async = require('async');
const isJSON = require('is-json');

var convodir = './spec/convo/';
var suffix = '.convo.txt';

function readConvos() {
  return new Promise(function(readConvosResolve, readConvosReject) {
    access(convodir).then(() => {
      readdir(convodir).then(function(filenames) {
        
        var convos = [];
        filenames.forEach(function(filename) {
          if (!filename.endsWith(suffix)) return;
          
          convos.push({
            name: filename.replace(suffix, ''),
            filename: filename
          });
        });
        readConvosResolve(convos);
      }).catch((err) => readConvosReject(err));
    }).catch((err) => readConvosResolve([]));
  });
}

function readConvo(name) {
  
	var filename = convodir + name + suffix;
  
  var parseMsg = function(lines) {
    if (!lines) return null;
    
    var content = lines.join(' ');
    if (isJSON(content)) {
      return JSON.parse(content);
    } else {
      return lines.join('\r\n');
    }
  };
  
  return new Promise(function(readConvoResolve, readConvoReject) {
  
    readFile(filename).then((content) => {
      var lines = content.toString().split("\n");

      var convo = [];
      
      var currentLines = [];
      var currentFrom = '';
      lines.forEach((line) => {
        line = line.trim();
        if (!line) {
          return;
        } else if (line.startsWith('#')) {
          if (currentFrom && currentLines) {
            convo.push({
              from: currentFrom,
              msg: parseMsg(currentLines)
            });
          }
          currentFrom = line.substr(1);
          currentLines = [];
        } else {
          currentLines.push(line);
        }
      });
      if (currentFrom && currentLines) {
        convo.push({
          from: currentFrom,
          msg: parseMsg(currentLines)
        });
      }
      
      readConvoResolve(convo);
      
    }).catch((err) => readConvoReject(err));
  });
}

function writeConvo(name, convo, errorIfExists) {

	var filename = convodir + name + suffix;
	
  return new Promise(function(writeConvoResolve, writeConvoReject) {

    async.series([
      
      function(existsCheckDone) {
        if (errorIfExists)
          access(filename).then(() => existsCheckDone(filename + ' already exists')).catch((err) => existsCheckDone());
        else
          existsCheckDone();
      },
      
      function(createDirectoryDone) {
				mkdirp(convodir).then(() => createDirectoryDone()).catch((err) => createDirectoryDone(err));
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
	writeConvo: writeConvo,
  readConvos: readConvos,
  readConvo: readConvo
};
