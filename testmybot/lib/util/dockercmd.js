'use strict';

const log = require('./log');
const Promise = require('bluebird');
const async = require('async');
const child_process = require('child_process');
const path = require('path');
const _ = require('lodash');

var config = undefined;

function dockerComposeCmdOptions() {
  var cmdOptions = [];
  cmdOptions.push('-p');
  cmdOptions.push(require(process.cwd() + '/package.json').name);
  if (process.env.DEBUG)
    cmdOptions.push('--verbose');
  
  var containers = _.values(config.docker.container);
  containers = _.filter(containers, (containerSpec) => containerSpec.run);
  containers = _.sortBy(containers, ['dockercomposeorder']);
  
  _.forEach(containers, function(containerSpec) {
    cmdOptions.push('-f');
    cmdOptions.push(containerSpec.dockercomposefile);
  });
  cmdOptions.push('-f');
  cmdOptions.push('./docker-compose.testmybot.override.yml');
  return cmdOptions;
}

function dockerComposeRun(cmdOptions, ignoreErrors) {
  return new Promise(function(composeResolve, composeReject) {

    log.info('Running Docker Command: ' + config.docker.dockercomposepath + ' ' + _.join(cmdOptions, ' '));
    
    var dockerProcess = child_process.spawn(config.docker.dockercomposepath, cmdOptions, getChildProcessOptions());
    dockerProcess.on('close', function(code) {
      log.info('docker-compose exited with code ' + code);
      
      if (code === 0 || ignoreErrors)
        composeResolve();
      else
        composeReject('docker-compose returned error code ' + code);
    });
    dockerProcess.on('error', function(err) {
      if (ignoreErrors)
        composeResolve();
      else
        composeReject('docker-compose error '+ + err);
    });
  });
}

function setupContainer(configToSet) {
  return new Promise(function(setupContainerResolve, setupContainerReject) {

    async.series([

      function(configDone) {
        
        if (!configToSet || !configToSet.docker) {
          configDone('config.docker required');
          return;
        }
        if (!configToSet.docker.dockercomposepath) {
          configDone('config.docker.dockercomposepath required');
          return;
        }
        if (!configToSet.docker.container) {
          configDone('config.docker.container required');
          return;
        }
        
        var valid = true;
        _.forOwn(configToSet.docker.container, function(containerSpec) {
          if (!containerSpec.dockercomposefile) {
            configDone('config.docker.container.dockercomposefile required');
            valid = false;
            return;
          }
        });
        if (!valid) return;
        
        config = configToSet;
        configDone();
      },
    
      function(stopDone) {
        stopContainer(true).then(() => stopDone()).catch(() => stopDone());
      },
    
      function(teardownDone) {
        teardownContainer(true).then(() => teardownDone()).catch(() => teardownDone());
      },

      function(buildContainerDone) {

        var cmdOptions = dockerComposeCmdOptions();
        cmdOptions.push('build');
        
        dockerComposeRun(cmdOptions, false).then(buildContainerDone).catch(buildContainerDone);
      }
    ],
    
    function(err) {
      if (err)
        setupContainerReject(err);
      else
        setupContainerResolve();
    });
  });
}

function teardownContainer(ignoreErrors) {
  var cmdOptions = dockerComposeCmdOptions();
  cmdOptions.push('down');
  
  return dockerComposeRun(cmdOptions, ignoreErrors);
}

function startContainer() {
  var cmdOptions = dockerComposeCmdOptions();
  cmdOptions.push('up');
  cmdOptions.push('-d');
  
  return dockerComposeRun(cmdOptions, false);
}

function stopContainer(ignoreErrors) {
  var cmdOptions = dockerComposeCmdOptions();
  cmdOptions.push('kill');
  
  return dockerComposeRun(cmdOptions, ignoreErrors);
}

function getChildProcessOptions() {
  if (process.env.DEBUG)
    return {stdio: ['ignore', process.stdout, process.stderr]}
  else
    return {stdio: ['ignore', 'ignore', 'ignore']}
}


module.exports = {
  setupContainer: setupContainer,
  teardownContainer: teardownContainer,
  startContainer: startContainer,
  stopContainer: stopContainer
};
