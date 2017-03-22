'use strict'

const _ = require('lodash');

var queues = { };
var listeners = { };

function push(msg) {
  if (listeners[msg.channelId]) {
    listeners[msg.channelId].shift()(msg);
  } else {
    if (!queues[msg.channelId])
      queues[msg.channelId] = [];
    
    queues[msg.channelId].push(msg);
  }
  console.log(queues);
  console.log(listeners);
}

function registerListener(callback, channelId) {
  if (queues[channelId]) {
    callback(queues[channelId].shift());
  } else {
    if (!listeners[channelId])
      listeners[channelId] = [];
    
    listeners[channelId].push(callback);
  }
  console.log(queues);
  console.log(listeners);
}

module.exports = {
  push: push,
  registerListener: registerListener
};