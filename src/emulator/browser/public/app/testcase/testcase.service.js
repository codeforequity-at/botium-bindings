(function() {

  angular.module('testmybotide').factory('TestCaseService', TestCaseService);

  TestCaseService.$inject = ['$resource'];

  function TestCaseService($resource) {
    return $resource('/api/testcases/:filename', {
      filename: '@filename'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
}());
