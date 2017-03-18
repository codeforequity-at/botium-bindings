'use strict'

const log = require('./util/log');
const slugify = require('./util/slugify');
const firstline = require('./util/firstline');

const Promise = require('bluebird');
const writeFile = Promise.promisify(require('fs').writeFile);
const readFile = Promise.promisify(require('fs').readFile);
const access = Promise.promisify(require('fs').access);
const readdir = Promise.promisify(require('fs').readdir);
const readdirSync = require('fs').readdirSync;
const mkdirp = Promise.promisify(require('mkdirp'));
const async = require('async');
const EOL = require('os').EOL;
const isJSON = require('is-json');

var convodir = './spec/convo/';
var suffix = '.convo.txt';

function readConvos() {
  return new Promise(function(readConvosResolve, readConvosReject) {
    access(convodir).then(() => {
      readdir(convodir).then(function(filenames) {
        
        var convos = [];
        
        async.each(filenames, 
          (filename, callback) => {
            if (!filename.endsWith(suffix)) {
              callback();
              return;
            }
            firstline(convodir + filename).then(
              (line) => {
                if (line && line.startsWith('#'))
                  line = '';
                
                convos.push({
                  name: line.trim(),
                  filename: filename
                });
                callback();
              }).catch(
              (err) => {
                log.warn('error reading first line of file ' + filename + ': ' + err);
                callback();
              });
          },
          (err) => {
            if (err) {
              readConvosReject(err)
            } else {
              readConvosResolve(convos);
            }
          });
        
      }).catch((err) => readConvosReject(err));
    }).catch((err) => readConvosResolve([]));
  });
}

function getConvoFilesSync() {
  return readdirSync(convodir).filter((filename) => filename.endsWith(suffix));
}

function readConvo(filename) {
  
	var convofilename = convodir + filename;
  
  var parseMsg = function(lines) {
    if (!lines) return null;
    
    var content = lines.join(' ');
    if (isJSON(content)) {
      return JSON.parse(content);
    } else {
      return lines.join(EOL);
    }
  };
  
  return new Promise(function(readConvoResolve, readConvoReject) {
  
    readFile(convofilename).then((content) => {
      var lines = content.toString().split(EOL);

      var convo = {
        filename: filename,
        conversation: []
      };
      
      var currentLines = [];
      var currentFrom = '';
      lines.forEach((line) => {
        line = line.trim();
        if (!line) {
          return;
        } else if (line.startsWith('#')) {
          if (currentFrom && currentLines) {
            convo.conversation.push({
              from: currentFrom,
              msg: parseMsg(currentLines)
            });
          } else if (!currentFrom && currentLines) {
            convo.name = currentLines[0];
            if (currentLines.length > 1) {
              convo.description = currentLines.slice(1).join(EOL);
            }
          }
          currentFrom = line.substr(1);
          currentLines = [];
        } else {
          currentLines.push(line);
        }
      });
      if (currentFrom && currentLines) {
        convo.conversation.push({
          from: currentFrom,
          msg: parseMsg(currentLines)
        });
      } else if (!currentFrom && currentLines) {
        convo.name = currentLines[0];
        if (currentLines.length > 1) {
          convo.description = currentLines.slice(1).join(EOL);
        }
      }
      
      readConvoResolve(convo);
      
    }).catch((err) => readConvoReject(err));
  });
}

function writeConvo(convo, errorIfExists) {

  if (!convo.filename) {
    convo.filename = slugify(convo.name);
  }
  if (!convo.filename.endsWith(suffix))
    convo.filename += suffix;

	var filename = convodir + convo.filename;
	
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
        
        contents += convo.name + EOL;
        if (convo.description)
          contents += convo.description + EOL;
        contents += EOL;
        
				convo.conversation.forEach(function (set) {
					contents += '#' + set.from + EOL;
					contents += set.msg + EOL + EOL;
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
  readConvo: readConvo,
  getConvoFilesSync: getConvoFilesSync
};
