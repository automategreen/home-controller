var net = require('net');
var util = require('util');

var mockHub = net.createServer(function (socket) {
  mockHub.socket = socket;
  socket.setEncoding('hex');
  socket.on('data', function (cmd) {
    if (!util.isArray(mockHub.mockData)) {
      mockHub.mockData = [mockHub.mockData];
    }
    var responses;
    for (var i in mockHub.mockData) {
      var data = mockHub.mockData[i];
      if (data[cmd]) {
        responses = data[cmd];
        mockHub.mockData.splice(i, 1);
        break;
      }
    }

    mockHub.send(responses);
  });
});

mockHub.mockData = {};

mockHub.send = function (responses, next) {
  if (!responses) {
    if (next) {
      next();
    }
    return;
  }

  if (typeof responses === 'string') {
    responses = [responses];
  }

  function write(response) {
    if (!response) {
      if (next) {
        next();
      }
      return;
    }
    mockHub.socket.write(response, 'hex');
    setTimeout(function () {
      write(responses.shift());
    }, 10);
  }
  write(responses.shift());
};

module.exports = mockHub;
