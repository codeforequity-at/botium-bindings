(function() {

  angular.module('testmybotide', ['ngResource', 'ui.router', 'ui.bootstrap', 'ui.bootstrap.showErrors', 'ngFlash', 'xeditable', 'btford.socket-io']).config(config);

  config.$inject = ['$stateProvider', '$locationProvider', '$urlRouterProvider'];

  function config($stateProvider, $locationProvider, $urlRouterProvider) {

    $locationProvider.html5Mode(false);
    $urlRouterProvider.otherwise('/testsuite');
    
    $stateProvider
      .state('testsuite', {
        url: '/testsuite',
        abstract: true,
        templateUrl: '/public/app/testsuite/testsuite.view.html',
        controller: 'TestSuiteController',
        controllerAs: 'vm'
      }).state('testsuite.home', {
        url: '',
        templateUrl: '/public/app/testsuite/testsuite.home.view.html'
      }).state('testsuite.capturechat', {
        url: '/capturechat',
        templateUrl: '/public/app/capturechat/capturechat.view.html',
        controller: 'CaptureChatController',
        controllerAs: 'vm'
      }).state('testsuite.testcase', {
        url: '/testcase/:filename',
        templateUrl: '/public/app/testcase/testcase.view.html',
        controller: 'TestCaseController',
        controllerAs: 'vm'
      });
  }

  angular.module('testmybotide').run(function(editableOptions) {
    editableOptions.theme = 'bs3';
  }); 
  
})();