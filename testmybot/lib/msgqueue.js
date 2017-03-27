'use strict'

const log = require('./util/log');
const _ = require('lodash');

function MsgQueue() {
  if (!(this instanceof MsgQueue)) {
    return new MsgQueue();
  }
  this.queues = { };
  this.listeners = { };
}

MsgQueue.prototype.push = function(msg) {
  var key = msg.channelId;
  if (!key) key = 'empty';
  
  if (this.listeners[key] && this.listeners[key].length > 0) {
    this.listeners[key].shift()(msg);
  } else {
    if (!this.queues[key])
      this.queues[key] = [];
    
    this.queues[key].push(msg);
  }
  //log.debug(JSON.stringify(this.queues));
  //log.debug(JSON.stringify(this.listeners));
};

MsgQueue.prototype.registerListener = function(callback, channelId) {
  var key = channelId;
  if (!key) key = 'empty';
  
  if (this.queues[key] && this.queues[key].length > 0) {
    callback(this.queues[key].shift());
  } else {
    if (!this.listeners[key])
      this.listeners[key] = [];
    
    this.listeners[key].push(callback);
  }
  //log.debug(JSON.stringify(this.queues));
  //log.debug(JSON.stringify(this.listeners));
}

module.exports = MsgQueue;
