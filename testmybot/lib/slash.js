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
const _ = require('lodash');

var slashdir = './spec/slash/';
var suffix = '.slash.txt';

function readSlashs() {
  return new Promise(function(readSlashsResolve, readSlashsReject) {
    access(slashdir).then(() => {
      readdir(slashdir).then(function(filenames) {
        
        var slashs = [];
        
        async.each(filenames, 
          (filename, callback) => {
            if (!filename.endsWith(suffix)) {
              callback();
              return;
            }
            firstline.firstline(slashdir + filename).then(
              (header) => {
                slashs.push(createSlashEntry(filename, header));
                callback();
              }).catch(
              (err) => {
                log.warn('error reading first line of file ' + filename + ': ' + err);
                callback();
              });
          },
          (err) => {
            if (err) {
              readSlashsReject(err)
            } else {
              readSlashsResolve(slashs);
            }
          });
        
      }).catch((err) => readSlashsReject(err));
    }).catch((err) => readSlashsResolve([]));
  });
}

function readSlashsSync() {
  var filenames = readdirSync(slashdir).filter((filename) => filename.endsWith(suffix));
  var slashs = [];
  filenames.forEach(function (filename) {
    var header = firstline.firstlineSync(slashdir + filename);
    slashs.push(createSlashEntry(filename, header));
  });
  return slashs;
}

function createSlashEntry(filename, header) {
  if (header && header.startsWith('#'))
    header = filename;
  
  return {
    name: header.trim(),
    filename: filename
  };
}

function readSlash(filename) {
  
	var slashfilename = slashdir + filename;
  
  var parseMsg = function(lines) {
    if (!lines) return null;
    
    var content = lines.join(' ');
    if (isJSON(content)) {
      return JSON.parse(content);
    } else {
      return lines.join(EOL);
    }
  };
  
  return new Promise(function(readSlashResolve, readSlashReject) {
  
    readFile(slashfilename).then((content) => {
      var lines = content.toString().split(EOL);

      var slash = {
        filename: filename,
        conversation: []
      };
      
      var currentLines = [];
      var currentFrom = null;
      var currentChannel = null;
      lines.forEach((line) => {
        line = line.trim();
        if (!line) {
          return;
        } else if (line.startsWith('#')) {
          if (currentFrom && currentLines) {
            slash.conversation.push({
              from: currentFrom,
              channel: currentChannel,
              msg: parseMsg(currentLines)
            });
          } else if (!currentFrom && currentLines) {
            slash.name = currentLines[0];
            if (currentLines.length > 1) {
              slash.description = currentLines.slice(1).join(EOL);
            }
          }
          currentFrom = line.substr(1);
          currentChannel = null;
          if (currentFrom.indexOf(' ') > 0) {
            currentChannel = currentFrom.substr(currentFrom.indexOf(' ') + 1).trim();
            currentFrom = currentFrom.substr(0, currentFrom.indexOf(' ')).trim();
          }
          currentLines = [];
        } else {
          currentLines.push(line);
        }
      });
      if (currentFrom && currentLines) {
        slash.conversation.push({
          from: currentFrom,
          channel: currentChannel,
          msg: parseMsg(currentLines)
        });
      } else if (!currentFrom && currentLines) {
        slash.name = currentLines[0];
        if (currentLines.length > 1) {
          slash.description = currentLines.slice(1).join(EOL);
        }
      }
      
      readSlashResolve(slash);
      
    }).catch((err) => readSlashReject(err));
  });
}

function writeSlash(slash, errorIfExists) {

  if (!slash.filename) {
    slash.filename = slugify(slash.name);
  }
  if (!slash.filename.endsWith(suffix))
    slash.filename += suffix;

	var filename = slashdir + slash.filename;
	
  return new Promise(function(writeSlashResolve, writeSlashReject) {

    async.series([
      
      function(existsCheckDone) {
        if (errorIfExists)
          access(filename).then(() => existsCheckDone(filename + ' already exists')).catch((err) => existsCheckDone());
        else
          existsCheckDone();
      },
      
      function(createDirectoryDone) {
				mkdirp(slashdir).then(() => createDirectoryDone()).catch((err) => createDirectoryDone(err));
      },
	
			function(writeSlashDone) {

				var contents = '';
        
        contents += slash.name + EOL;
        if (slash.description)
          contents += slash.description + EOL;
        contents += EOL;
        
				slash.conversation.forEach(function (set) {
					contents += '#' + set.from;
          if (set.channel) {
            contents += ' ' + set.channel;
          }
          contents += EOL;
          
          if (_.isString(set.msg)) {
            contents += set.msg + EOL + EOL;
          } else {
            contents += JSON.stringify(set.msg, null, 2) + EOL + EOL;
          }
				});

				writeFile(filename, contents).then(() => writeSlashDone()).catch((err) => writeSlashDone(err));
			},

    ],
    function(err) {
      if (err)
        writeSlashReject(err);
      else
        writeSlashResolve(filename);
    });			
	});			
}


module.exports = {
	writeSlash: writeSlash,
  readSlashs: readSlashs,
  readSlash: readSlash,
  readSlashsSync: readSlashsSync
};
