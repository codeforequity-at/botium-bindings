(function() {

  angular.module('testmybotide').factory('ChatSocket', ChatSocket);

  ChatSocket.$inject = ['socketFactory'];

  function ChatSocket(socketFactory) {
    return function(testendpoint, scope) {
      var socket = socketFactory({
        ioSocket: io.connect(testendpoint)
      });
      socket.forward('botsays', scope);
      return socket;
    };
  };

})();