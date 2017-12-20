(function() {

  angular.module('testmybotide').controller('CaptureChatController', CaptureChatController);

  CaptureChatController.$inject = ['$scope', '$rootScope', '$log', '$uibModal', 'Flash', 'ChatSocket', 'TestCaseService', 'TestSuiteService'];

  function CaptureChatController($scope, $rootScope, $log, $uibModal, Flash, ChatSocketFactory, TestCase, TestSuite) {
    var vm = this;

    vm.busy = false;
    
    vm.sendtext = '';
    vm.sendchannel = '';
    
    vm.messages = [];
    
    vm.ChatSocket = null;
 
    vm.initialize = function() {
      vm.startdocker();
    };
   
    vm.clearChat = function() {
      vm.messages.length = 0;
    };
  
    vm.send = function() {
      if (!vm.sendtext) return;
      if (!vm.ChatSocket) return;
      
      vm.ChatSocket.emit('bothears', vm.sendtext, 'me', vm.sendchannel);
      
      vm.messages.push({
        msg: vm.sendtext,
        from: 'me',
        channel: vm.sendchannel
      });
      vm.scrollChatBottom();
      
      vm.sendtext = '';
    };

    $scope.$on('reply', function(event, msg) {
      if (!msg) return;
      if (!vm.ChatSocket) return;

      vm.ChatSocket.emit('bothears', msg, 'me', vm.sendchannel);
      vm.messages.push({
        msg: msg,
        from: 'me',
        channel: vm.sendchannel
      });
      vm.scrollChatBottom();
    });
    $scope.$on('socket:botsays', function(event, data) {
      $log.debug('got a message', event.name, data);

      if (data) {
        var msg = data;
        if (data.messageText) {
          msg = data.messageText;
        } else if (data.message) {
          msg = { message: data.message };
        }
        
        $scope.$apply(function() {
          vm.messages.push({
            msg: msg,
            from: 'bot',
            channel: data.channel
          });
        });
        vm.scrollChatBottom();
      }
    });
    $scope.$on('$destroy', function(event) {
      if (vm.ChatSocket) {
        vm.ChatSocket.disconnect();
        vm.ChatSocket = null;
      }
    });
      
    vm.scrollChatBottom = function() {
      var scroller = document.getElementById("current-chat-area");
      scroller.scrollTop = scroller.scrollHeight;        
    };
    
    vm.saveTestCaseClick = function () {
      vm.openTestCaseNameDialog();
    };
    
    vm.openTestCaseNameDialog = function(defaultName, errorMessage) {
      var modalInstance = $uibModal.open({
        templateUrl: 'savetestcase.html',
        backdrop: true,
        controller: ['$uibModalInstance', '$scope', function($uibModalInstance, $scope) {
          var vmpopup = this;
          vmpopup.testcasename = defaultName;
          vmpopup.errormessage = errorMessage;
          
          vmpopup.submit = function (isValid) {
            $scope.$broadcast('show-errors-check-validity');
            if (isValid) {
              $uibModalInstance.close(vmpopup.testcasename);
            }
          };
          vmpopup.cancel = function () {
            $uibModalInstance.dismiss('cancel');
          };
        }],
        controllerAs: 'vmpopup'
      });
      modalInstance.result.then(function (testcasename) {
        vm.saveNewTestCase(testcasename);
      }, function () {
        $log.info('Modal dismissed at: ' + new Date());
      });     
    };

    vm.saveNewTestCase = function(testcasename) {

      TestCase.save({ name: testcasename, conversation: vm.messages }, function(data) {
        if (data.success) {
          vm.messages = [];
          Flash.create('success', 'Conversation saved to file ' + data.filename);
          $rootScope.$broadcast('reload-testcases');
        } else {
          vm.openTestCaseNameDialog(testcasename, data.error);
        }
      });
      
    };
   
    vm.startdocker = function() {

      vm.busy = true;
      if (vm.ChatSocket) {
        vm.ChatSocket.disconnect();
        vm.ChatSocket = null;
      }

      TestSuite.startdocker(function (err) {
        vm.busy = false;
        if (err) {
          return Flash.create('danger', 'Error restarting Chatbot ' + JSON.stringify(err));
        } else {
          Flash.create('success', 'Chatbot started.');
          vm.ChatSocket = ChatSocketFactory($scope);
        }
      });
    };


    vm.initialize();
  }

})();