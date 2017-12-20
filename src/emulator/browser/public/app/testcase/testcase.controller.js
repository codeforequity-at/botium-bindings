(function() {

  angular.module('testmybotide').controller('TestCaseController', TestCaseController);

  TestCaseController.$inject = ['$scope', '$rootScope', '$log', '$q', '$stateParams', 'Flash', 'TestCaseService'];

  function TestCaseController($scope, $rootScope, $log, $q, $stateParams, Flash, TestCaseService) {
    var vm = this;
    
    vm.testcase = TestCaseService.get({ filename: $stateParams.filename }, function(response) {
      if (response.error) {
        vm.testcase = null;
        Flash.create('danger', 'Loading Test Case failed: ' + JSON.stringify(response.error));
      }
    });
    
    vm.onaftersave = function() {
      return $q(function(resolve, reject) {
        TestCaseService.update(vm.testcase, function(data) {
          if (data.success) {
            Flash.create('success', 'Test Case saved to file ' + data.filename);
            $rootScope.$broadcast('reload-testcases');
            resolve();
          } else {
            Flash.create('danger', 'Saving Test Case failed: ' + data.error);
            reject();
          }
        });
      });
    };
    
  }

})();