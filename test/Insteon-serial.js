'use strict';

var Insteon = require('../').Insteon;
var should = require('should');

var SerialPort = require('serialport/test');
var MockBinding = SerialPort.Binding;
MockBinding.createPort('/dev/home-controller-mock', { echo: false, record: true, readyData: '' });

var mockSerial = require('../lib/Test/mockSerial');
var Plan = require('../lib/Test/Plan');

describe('Insteon Gateway (Serial Interface)', function () {
  this.timeout(5000);

  it('tests serial connection #1', function (done) {
    var gw = new Insteon();
    gw.SerialPort = SerialPort;

    gw.serial('/dev/home-controller-mock', {}, function () {
      gw.close();
      gw.serial('/dev/home-controller-mock', { baudRate: 19200, dataBits: 8, parity: 'none', stopBits: 1 }, function () {
        gw.close();
        done();
      });
    });
  });

  it('tests serial connection #2', function (done) {
    var gw = new Insteon();
    gw.SerialPort = SerialPort;
    gw.on('connect', function () {
      gw.close();
      done();
    });
    gw.serial('/dev/home-controller-mock');
  });

  it('tests serial socket events', function (done) {
    var plan = new Plan(2, function() {
      done();
    });

    var gw2 = new Insteon();
    gw2.SerialPort = SerialPort;

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
      gw2.close();
    });
  });

  it('gets the gateway info', function (done) {
    var gw = new Insteon();
    gw.SerialPort = SerialPort;

    mockSerial.mockData = {
      '0260': '0260ffffff03379c06'
    };

    gw.serial('/dev/home-controller-mock', function () {
      mockSerial.attach(gw.socket);

      gw.info().then(function (info) {
        should.exist(info);
        info.firmwareVersion.should.equal('9c');
        info.id.should.equal('ffffff');
        info.deviceCategory.id.should.equal(3);
        info.deviceSubcategory.id.should.equal(55);
        
        gw.close();
        done();
      });
    });
  });

  it('beeps', function (done) {
    var gw = new Insteon();
    gw.SerialPort = SerialPort;

    mockSerial.mockData = {
      '0262407fb40f3000': [
        '0262407fb40f300006',
        '0250407fb43118bd2f3000'
      ]
    };
    
    gw.serial('/dev/home-controller-mock', function () {
      mockSerial.attach(gw.socket);

      gw.beep('407fb4').then(function () {
        gw.close();
        done();
      });
    });
  });

});
