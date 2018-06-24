'use strict';

var Insteon = require('../').Insteon;
var mockHub = require('../lib/Test/mockHub');

var host = '127.0.0.1';
var port = 9761;

describe('X10 Functions', function () {
  this.timeout(5000);

  before(function (done) {
    mockHub.listen(port, host, function () {
      done();
    });
  });

  after(function (done) {
    mockHub.close(function() {
      done();
    });
  });

  it('turn on', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
      '02636600': '0263660006'
    }, {
      '02636280': '0263628006'
    }];

    gw.connect(host, function () {
      var x10 = gw.x10('A', 1);
      x10.turnOn(function() {
        gw.close();
        done();
      });
    });
  });

  it('turn off', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
      '0263cc00': '0263cc0006'
    }, {
      '0263c380': '0263c38006'
    }];

    gw.connect(host, function () {
      var x10 = gw.x10('p', 16);
      x10.turnOff(function() {
        gw.close();
        done();
      });
    });
  });
}); // X10 Functions
