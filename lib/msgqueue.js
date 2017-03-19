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
  if (this.listeners[msg.channelId] && this.listeners[msg.channelId].length > 0) {
    this.listeners[msg.channelId].shift()(msg);
  } else {
    if (!this.queues[msg.channelId])
      this.queues[msg.channelId] = [];
    
    this.queues[msg.channelId].push(msg);
  }
  log.debug(JSON.stringify(this.queues));
  log.debug(JSON.stringify(this.listeners));
};

MsgQueue.prototype.registerListener = function(callback, channelId) {
  if (this.queues[channelId] && this.queues[channelId].length > 0) {
    callback(this.queues[channelId].shift());
  } else {
    if (!this.listeners[channelId])
      this.listeners[channelId] = [];
    
    this.listeners[channelId].push(callback);
  }
  log.debug(JSON.stringify(this.queues));
  log.debug(JSON.stringify(this.listeners));
}

module.exports = MsgQueue;
