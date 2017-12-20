(function() {

  angular.module('testmybotide').controller('TestSuiteController', TestSuiteController);

  TestSuiteController.$inject = ['$scope', '$log', 'Flash', 'TestCaseService'];

  function TestSuiteController($scope, $log, Flash, TestCaseService) {
    var vm = this;
    
    vm.busy = false;
    
    vm.testcases = [];
    
    vm.initialize = function() {
      vm.reload();
    };
    
    $scope.$on('reload-testcases', function(event, args) {
      vm.reload();
    });    

    vm.reload = function() {
      vm.busy = true;
      vm.testcases = TestCaseService.query(
      () => vm.busy = false, 
      (err) => {
        Flash.create('danger', 'Error loading Test Cases: ' + JSON.stringify(err));
      });
    };

    
    vm.initialize();
  }

})();