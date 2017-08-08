'use strict';

var Insteon = require('../').Insteon;
var Plan = require('../lib/Test/Plan');
var mockHub = require('../lib/Test/mockHub');

var host = '127.0.0.1';
var port = 9761;

describe('IO Linc Functions', function () {
  this.timeout(5000);

  before(function (done) {
    mockHub.listen(port, host, function () {
      done();
    });
  });

  it('relay on', function (done) {
    var gw = new Insteon();
    gw.emitSelfAck = true;

    mockHub.mockData = [{
      '02629999990f11ff': '02629999990f11ff060250999999ffffff2f11ff'
    }];

    gw.connect(host, function () {
      var ioLinc = gw.ioLinc('999999');

      ioLinc.on('relayOn', done);
      ioLinc.relayOn();

    });
  });

  it('relay off', function (done) {
    var gw = new Insteon();
    gw.emitSelfAck = true;

    mockHub.mockData = [{
      '02629999990f1300': '02629999990f1300060250999999ffffff2f1300'
    }];

    gw.connect(host, function () {
      var ioLinc = gw.ioLinc('999999');

      ioLinc.on('relayOff', done);
      ioLinc.relayOff();

    });
  });

  it('relay status - relay and sensor "on"', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
      '0262348bbf0f1900': '0262348bbf0f1900060250348bbf39008f2f0601'
    }, {
      '0262348bbf0f1901': '0262348bbf0f1901060250348bbf39008f2f0601'
    }];

    gw.connect(host, function () {
      var ioLinc = gw.ioLinc('348bbf');

      ioLinc.status().then(function (status) {
        status.relay.should.equal('on');
        status.sensor.should.equal('on');
        done();
      });

    });
  });

  it('relay status - relay and sensor "off"', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
      '0262348bbf0f1900': '0262348bbf0f1900060250348bbf39008f2f0600'
    }, {
      '0262348bbf0f1901': '0262348bbf0f1901060250348bbf39008f2f0600'
    }];

    gw.connect(host, function () {
      var ioLinc = gw.ioLinc('348bbf');

      ioLinc.status().then(function (status) {
        status.relay.should.equal('off');
        status.sensor.should.equal('off');
        done();
      });

    });
  });

});

describe('IO Linc Events', function () {
  it('emits sensorOn event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var light = gw.ioLinc('19d41c');

    light.on('command', function (group, cmd1) {
      this.id.should.equal('19D41C');
      group.should.equal(1);
      cmd1.should.equal('11');
      plan.ok();
    });

    light.on('sensorOn', function () {
      this.id.should.equal('19D41C');
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () {
        mockHub.send([
          '025019d41c000001cb1100',
          '025019d41c1eb552451101',
          '025019d41c110101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });
  it('emits sensorOff event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var light = gw.ioLinc('19d41c');

    light.on('command', function (group, cmd1) {
      this.id.should.equal('19D41C');
      group.should.equal(1);
      cmd1.should.equal('13');
      plan.ok();
    });

    light.on('sensorOff', function () {
      this.id.should.equal('19D41C');
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () {
        mockHub.send([
          '025019d41c000001cb1300',
          '025019d41c1eb552451301',
          '025019d41c130101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });
  it('emits relayOff event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var light = gw.ioLinc('19d41c');

    light.on('command', function (group, cmd1) {
      this.id.should.equal('19D41C');
      group.should.equal(0);
      cmd1.should.equal('13');
      plan.ok();
    });

    light.on('relayOff', function () {
      this.id.should.equal('19D41C');
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () {
        mockHub.send([
          '025019d41c000000cb1300',
          '025019d41c1eb552451300',
          '025019d41c130100cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });
});

