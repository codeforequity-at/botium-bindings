'use strict'

const log = require('./util/log');
const _ = require('lodash');

function MsgQueue() {
  if (!(this instanceof MsgQueue)) {
    return new MsgQueue();
  }
  this.queues = { };
  this.listeners = { };
  this.pushListener = null;
}

MsgQueue.prototype.clear = function() {
  this.queues = { };
  this.listeners = { };
};

MsgQueue.prototype.push = function(msg) {
  if (this.pushListener) {
    this.pushListener(msg);
  }
  
  var key = msg.channel;
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

MsgQueue.prototype.registerPushListener = function(callback) {
  this.pushListener = callback;
};

MsgQueue.prototype.registerListener = function(callback, channel) {
  var key = channel;
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
