(function() {


  angular.module('testmybotide').directive('displayChatbotMessage', DisplayChatbotMessage);

  DisplayChatbotMessage.$inject = [];

  function DisplayChatbotMessage() {
    
    return {
      restrict: 'E',
      bindToController: {
        msg: '='
      },
      templateUrl: '/public/app/message/message.view.html',
      controller: ['$scope', '$rootScope', function($scope, $rootScope) {
        var vm = this;
        vm.msg = $scope.msg;

        vm.text = null;
        vm.structured = null;

        if (angular.isObject(vm.msg.msg)) {
          
          if (vm.msg.msg.message) {
            vm.structured = vm.msg.msg.message;
          } else if (vm.msg.msg.postback) {
            vm.text = vm.msg.msg.postback.payload;
          }
        } else {
          vm.text = vm.msg.msg;
        }
        
        vm.quickReply = function(text, payload) {
          $rootScope.$broadcast('reply', { message: { text: text, quick_reply: { payload: payload } } });
        };
        vm.postback = function(text, payload) {
          $rootScope.$broadcast('reply', { postback: { payload: payload } });
        };
      }],
      controllerAs: 'vm'
    };
  }
})();