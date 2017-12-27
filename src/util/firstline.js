'use strict';

const fs = require('fs');
const EOL = require('os').EOL;
const lineByLine = require('n-readlines');

function firstline(path) {
  return new Promise(function (resolve, reject) {
    var rs = fs.createReadStream(path);
    var acc = '';
    var pos = 0;
    var index;
    rs
      .on('data', function (chunk) {
        index = chunk.indexOf(EOL);
        acc += chunk;
        if (index === -1) {
          pos += chunk.length;
        } else {
          pos += index;
          rs.close();
        }
      })
      .on('close', function () {
        resolve(acc.slice(0, pos));
      })
      .on('error', function (err) {
        reject(err);
      })
  });
}

function firstlineSync(path) {
  var liner = new lineByLine(path);
  var line = liner.next();
  if (line) {
    return line.toString();
  }
}

module.exports = {
  firstline: firstline,
  firstlineSync: firstlineSync
};