var Insteon = require('../').Insteon;
var should = require('should');
var virtualSerialPort = require('virtual-serialport');

var common = require('./common');
var mockSerial = common.mockSerial;
var Plan = common.Plan;

describe('Insteon Gateway (Serial Interface)', function () {
  var gw = new Insteon();

  before(function (done) {
    gw.SerialPort = virtualSerialPort;

    gw.serial('/dev/home-controller-mock', function () {
      mockSerial.attach(gw.socket);
      done();
    });
  });

  it('tests serial connection', function (done) {
    var plan = new Plan(3, done);

    var gw2 = new Insteon();
    gw2.SerialPort = virtualSerialPort;

    gw2.serial('/dev/home-controller-mock', {}, function () {
      plan.ok();
    });

    gw2.serial('/dev/home-controller-mock', { baudrate: 19200, databits: 8, parity: 'none', stopbits: 1 }, function () {
      plan.ok();
    });

    var gw3 = new Insteon();
    gw3.SerialPort = virtualSerialPort;
    gw3.on('connect', function () {
      plan.ok();
    });
    gw3.serial('/dev/home-controller-mock');
  });

  it('tests serial socker events', function (done) {
    var plan = new Plan(2, done);

    var gw2 = new Insteon();
    gw2.SerialPort = virtualSerialPort;

    /* TODO Add error event test
    gw2.on('error', function(err) {
      should.exist(err);
      err.message.should.equal('test');
      plan.ok();
    });*/
    gw2.on('close', function () {
      plan.ok();
    });

    gw2.serial('/dev/home-controller-mock', {}, function () {
      plan.ok();
      gw2.socket.close();
    });
  });

  it('gets the gateway info', function (done) {
    mockSerial.mockData = {
      '0260': '0260ffffff03379c06'
    };

    gw.info().then(function (info) {
      should.exist(info);
      info.firmwareVersion.should.equal('9c');
      info.id.should.equal('ffffff');
      info.deviceCategory.id.should.equal(3);
      info.deviceSubcategory.id.should.equal(55);
      done();
    });
  });

});
