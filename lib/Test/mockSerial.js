var util = require('util');

var mockSerial = {
  port: null,
  mockData: {}
};

mockSerial.attach = function (port) {
  mockSerial.port = port;

  mockSerial.port.on('dataToDevice', function (cmd) {
    cmd = cmd.toString('hex');
    if (!util.isArray(mockSerial.mockData)) {
      mockSerial.mockData = [mockSerial.mockData];
    }
    var responses;
    for (var i in mockSerial.mockData) {
      var data = mockSerial.mockData[i];
      if (data[cmd]) {
        responses = data[cmd];
        mockSerial.mockData.splice(i, 1);
        break;
      }
    }

    mockSerial.send(responses);
  });
};

mockSerial.send = function (responses, next) {
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
    mockSerial.port.writeToComputer(response);
    setTimeout(function () {
      write(responses.shift());
    }, 10);
  }
  write(responses.shift());
};

exports = mockSerial;
