'use strict';

const Promise = require('bluebird');

function beforeAll(configToSet, msgqueueToSet) {
  return Promise.resolve();
}

function afterAll() {
  return Promise.resolve();
}

function beforeEach() {
  return Promise.resolve();
}

function afterEach() {
  return Promise.resolve();
}

function hears(msg, from, channel) {
  return Promise.resolve();
}

module.exports = {
  beforeAll: beforeAll,
  afterAll: afterAll,
  beforeEach: beforeEach,
  afterEach: afterEach,
  hears: hears
};