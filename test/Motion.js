'use strict';

var Insteon = require('../').Insteon;
var should = require('should');

var mockHub = require('../lib/Test/mockHub');
var Plan = require('../lib/Test/Plan');

var host = '127.0.0.1';
var port = 9761;

describe('Motion Commands', function () {
  this.timeout(5000);

  before(function (done) {
    mockHub.listen(port, host, function () {
      done();
    });
  });

  it('get status', function (done) {
    var gw = new Insteon();
    var motion = gw.motion('283e9e');
    var plan = new Plan(2, done);

    mockHub.mockData = {
      '0262283e9e1f2e0000000000000000000000000000d2':
      [
        '0262283e9e1f2e0000000000000000000000000000d206',
        '0250283e9e1eb5522f2e00',
        '0251283e9e1eb5521b2e0001016401800e00450e00d35f00d2'
      ]
    };

    gw.connect(host, function () {
      motion.status()
        .then(function (status) {
          should.exist(status);
          status.should.eql({
            'ledLevel': 100,
            'clearTimer': 60,
            'duskThreshold': 50,
            'options': {
              'occupancyMode': false,
              'ledOn': true,
              'nightMode': false,
              'onOnlyMode': false
            },
            'jumpers': {
              'j2': false,
              'j3': false,
              'j4': false,
              'j5': true
            },
            'lightLevel': 82,
            'batteryLevel': 9.5
          });
          plan.ok();
        })
        .catch(done);

      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250283e9e000001cf1101'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('set options', function (done) {
    var gw = new Insteon();
    var motion = gw.motion('283e9e');

    var plan = new Plan(2, done);

    mockHub.mockData = {
      '0262283e9e1f2e0000050e00000000000000000000bf':
      [
        '0262283e9e1f2e0000050e00000000000000000000bf06',
        '0250283e9e1eb5522f2e00'
      ]
    };

    gw.connect(host, function () {
      motion.options()
        .then(function (rsp) {
          should.exist(rsp);
          rsp.success.should.be.true;
          plan.ok();
        })
        .catch(done);

      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250283e9e000001cf1101'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });
  it('set clearTimer', function (done) {
    var gw = new Insteon();
    var motion = gw.motion('283e9e');

    var plan = new Plan(2, done);

    mockHub.mockData = {
      '0262283e9e1f2e0000030300000000000000000000cc':
      [
        '0262283e9e1f2e0000030300000000000000000000cc06',
        '0250283e9e1eb5522f2e00'
      ]
    };

    gw.connect(host, function () {
      motion.clearTimer(120)
        .then(function (rsp) {
          should.exist(rsp);
          rsp.success.should.be.true;
          plan.ok();
        })
        .catch(done);

      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250283e9e000001cf1101'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });
  it('set duskThreshold', function (done) {
    var gw = new Insteon();
    var motion = gw.motion('283e9e');

    var plan = new Plan(2, done);

    mockHub.mockData = {
      '0262283e9e1f2e00000480000000000000000000004e':
      [
        '0262283e9e1f2e00000480000000000000000000004e06',
        '0250283e9e1eb5522f2e00'
      ]
    };

    gw.connect(host, function () {
      motion.duskThreshold(50)
        .then(function (rsp) {
          should.exist(rsp);
          rsp.success.should.be.true;
          plan.ok();
        })
        .catch(done);

      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250283e9e000001cf1101'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

});

describe('Motion Events', function () {
  it('emits motion event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var motion = gw.motion('283e9e');

    motion.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.equal('11');
      plan.ok();
    });

    motion.on('motion', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250283e9e000001cf1101',
          '0250283e9e1eb552411101',
          '0250283e9e1eb5524a1101',
          '0250283e9e110101cf0600',
          '0250283e9e110101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits clear event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var motion = gw.motion('283e9e');

    motion.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.equal('13');
      plan.ok();
    });

    motion.on('clear', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250283e9e000001cf1301',
          '0250283e9e000001cf1301',
          '0250283e9e1eb552451301',
          '0250283e9e130101cf0600',
          '0250283e9e130101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });
}); // Motion Events

