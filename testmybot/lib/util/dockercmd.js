'use strict';

const log = require('./log');
const Promise = require('bluebird');
const async = require('async');
const child_process = require('child_process');
const path = require('path');
const _ = require('lodash');

var config = undefined;

function setupContainer(configToSet) {
  return new Promise(function(setupContainerResolve, setupContainerReject) {

    async.series([

      function(configDone) {
        
        if (!configToSet || !configToSet.docker) {
          configDone('config.docker required');
          return;
        }
        if (!configToSet.docker.dockerpath) {
          configDone('config.docker.dockerpath required');
          return;
        }
        if (!configToSet.docker.networkname) {
          configDone('config.docker.networkname required');
          return;
        }  
        if (!configToSet.docker.container) {
          configDone('config.docker.container required');
          return;
        }
        
        var valid = true;
        _.forOwn(configToSet.docker.container, function(containerSpec) {
          if (!containerSpec.imagename) {
            configDone('config.docker.container.imagename required');
            valid = false;
            return;
          }
          if (!containerSpec.containername) {
            configDone('config.docker.container.containername required');
            valid = false;
            return;
          }
          if (!containerSpec.dockerfile) {
            configDone('config.docker.container.dockerfile required');
            valid = false;
            return;
          }
          if (!containerSpec.dockerdir) {
            configDone('config.docker.container.dockerdir required');
            valid = false;
            return;
          }
          if (!containerSpec.networkalias) {
            configDone('config.docker.container.networkalias required');
            valid = false;
            return;
          }
          
          if (!containerSpec.hostmapping)
            containerSpec.hostmapping = {};

          if (!containerSpec.portmapping)
            containerSpec.portmapping = {};

          if (!containerSpec.env)
            containerSpec.env = {};
          
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

      function(networkCreateDone) {
        var cmdOptions = [];
        cmdOptions.push('network');
        cmdOptions.push('create');
        cmdOptions.push('-d');
        cmdOptions.push('bridge');
        cmdOptions.push(config.docker.networkname);

        log.info('Running Docker Command: ' + config.docker.dockerpath + ' ' + _.join(cmdOptions, ' '));

        var dockerProcess = child_process.spawn(config.docker.dockerpath, cmdOptions, getChildProcessOptions());
        dockerProcess.on('close', function(code) {
          log.info('docker network create exited with code ' + code);
          
          if (code === 0)
            networkCreateDone();
          else
            networkCreateDone('docker network create returned error code ' + code);
        });
        dockerProcess.on('error', function(err) {
          networkCreateDone('docker network create error '+ + err);
        });
      },
      
      function(buildContainerDone) {
        var buildTasks = [];
        
        _.forOwn(config.docker.container, function(containerSpec) {
          var buildTask = new Promise(function(buildContainerResolve, buildContainerReject) {
        
            var cmdOptions = [];
            cmdOptions.push('build');
            cmdOptions.push('-t');
            cmdOptions.push(containerSpec.imagename);
            cmdOptions.push('-f');
            cmdOptions.push(containerSpec.dockerfile);
            cmdOptions.push(containerSpec.dockerdir);

            log.info('Running Docker Command: ' + config.docker.dockerpath + ' ' + _.join(cmdOptions, ' '));

            var dockerProcess = child_process.spawn(config.docker.dockerpath, cmdOptions, getChildProcessOptions());
            dockerProcess.on('close', function(code) {
              log.info('docker build ' + containerSpec.imagename + ' exited with code ' + code);
              
              if (code === 0)
                buildContainerResolve();
              else
                buildContainerReject('docker build ' + containerSpec.imagename + ' returned error code ' + code);
            });
            dockerProcess.on('error', function(err) {
              buildContainerReject('docker build ' + containerSpec.imagename + ' error '+ + err);
            });
          });
          buildTasks.push(buildTask);
        });
        
        Promise.all(buildTasks).then(() => buildContainerDone()).catch((err) => buildContainerDone(err));
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
  return new Promise(function(teardownResolve, teardownReject) {
    
    var cmdOptions = [];
    cmdOptions.push('network');
    cmdOptions.push('rm');
    cmdOptions.push(config.docker.networkname);

    log.debug('Running Docker Command: ' + config.docker.dockerpath + ' ' + _.join(cmdOptions, ' '));

    var dockerProcess = child_process.spawn(config.docker.dockerpath, cmdOptions, getChildProcessOptions());
    dockerProcess.on('close', function(code) {
      log.info('docker network rm exited with code ' + code);
      
      if (code === 0 || ignoreErrors)
        teardownResolve();
      else
        teardownReject('docker network rm returned error code ' + code);
    });
    dockerProcess.on('error', function(err) {
      if (ignoreErrors)
        teardownResolve();
      else
        teardownReject('docker network rm error '+ + err);
    });
  });
}

function startContainer(filterCallback) {
  
  var startTasks = [];
  
  _.forOwn(config.docker.container, function(containerSpec) {
    
    if (filterCallback) {
      if (!filterCallback(containerSpec))
        return;
    }
    
    var startTask = new Promise(function(startContainerResolve, startContainerReject) {

      var cmdOptions = [];
      cmdOptions.push('run');
      cmdOptions.push('-d');
      cmdOptions.push('--rm');
      if (containerSpec.hostmapping) {
        _.forOwn(containerSpec.hostmapping, function(mappedto, hostname) {
          cmdOptions.push('--add-host=' + hostname + ':' + mappedto);
        });
      }
      if (containerSpec.portmapping) {
        _.forOwn(containerSpec.portmapping, function(containerport, hostport) {
          cmdOptions.push('-p');
          cmdOptions.push(hostport + ':' + containerport);
        });
      }
      if (containerSpec.env) {
        _.forOwn(containerSpec.env, function(envvalue, envkey) {
          cmdOptions.push('-e');
          cmdOptions.push(envkey + '=' + envvalue + '');
        });
      }

      cmdOptions.push('--name');
      cmdOptions.push(containerSpec.containername);
      cmdOptions.push('--network');
      cmdOptions.push(config.docker.networkname);
      cmdOptions.push('--network-alias');
      cmdOptions.push(containerSpec.networkalias);
      cmdOptions.push(containerSpec.imagename);

      log.info('Running Docker Command: ' + config.docker.dockerpath + ' ' + _.join(cmdOptions, ' '));

      var dockerProcess = child_process.spawn(config.docker.dockerpath, cmdOptions, getChildProcessOptions());
      dockerProcess.on('close', function(code) {
        log.info('docker run ' + containerSpec.containername + ' exited with code ' + code);
        if (code === 0)
          startContainerResolve();
        else
          startContainerReject('docker run ' + containerSpec.containername + ' returned error code ' + code);
      });
      dockerProcess.on('error', function(err) {
        startContainerReject('docker ' + containerSpec.containername + ' run error ' + err);
      });
    });
    startTasks.push(startTask);
  });
  
  return Promise.all(startTasks);
}

function stopContainer(ignoreErrors) {
  
  var stopTasks = [];
  
  _.forOwn(config.docker.container, function(containerSpec) {
    var stopTask = new Promise(function(stopContainerResolve, stopContainerReject) {

      var cmdOptions = [];
      cmdOptions.push('stop');
      cmdOptions.push(containerSpec.containername);
      
      log.info('Running Docker Command: ' + config.docker.dockerpath + ' ' + _.join(cmdOptions, ' '));
      
      var stopProcess = child_process.spawn(config.docker.dockerpath, cmdOptions, getChildProcessOptions());
      stopProcess.on('close', function(code) {
        log.info('docker stop ' + containerSpec.containername + ' exited with code ' + code);

        if (code === 0 || ignoreErrors)
          stopContainerResolve();
        else
          stopContainerReject('docker stop ' + containerSpec.containername + ' returned error code ' + code);
      });
      stopProcess.on('error', function(err) {
        if (ignoreErrors)
          stopContainerResolve();
        else
          stopContainerReject('docker stop ' + containerSpec.containername + ' error ' + err);
      });
    });
    stopTasks.push(stopTask);
  });
  return Promise.all(stopTasks);
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
