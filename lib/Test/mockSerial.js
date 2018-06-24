var util = require('util');

var mockSerial = {
  port: null,
  mockData: []
};

mockSerial.attach = function (port) {
  mockSerial.port = port;

  var write = mockSerial.port.write.bind(mockSerial.port);
  mockSerial.port.write = function (cmd) {
    write(cmd, function () {
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
    mockSerial.port.binding.emitData(Buffer.from(response, 'hex'));
    setTimeout(function () {
      write(responses.shift());
    }, 10);
  }
  write(responses.shift());
};

module.exports = mockSerial;
