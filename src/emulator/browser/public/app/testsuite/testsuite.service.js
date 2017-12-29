(function() {

  angular.module('testmybotide').factory('TestSuiteService', TestSuiteService);

  TestSuiteService.$inject = ['$http'];

  function TestSuiteService($http) {
    
    function startdocker(callback) {
      $http.post('/api/startdocker', {}).then(
        function successCallback(response) {
          if (response.data && response.data.success) {
            callback(null);
          } else {
            callback(response.data.error);
          }
        }, function errorCallback(response) {
          callback(response);
        });      
    }

    return {
      startdocker: startdocker
    };
  }

})();