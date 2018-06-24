'use strict';

var Insteon = require('../').Insteon;
var mockHub = require('../lib/Test/mockHub');
var Plan = require('../lib/Test/Plan');

var host = '127.0.0.1';
var port = 9761;

describe('Leak Events', function () {
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

  it('emits dry event', function (done) {
    var plan = new Plan(3, function() {
      gw.close();
      done();
    });
    var gw = new Insteon();
    var leak = gw.leak('2d2dd9');

    leak.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.equal('11');
      plan.ok();
    });

    leak.on('dry', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '02502d2dd9000001cb1101',
          '02502d2dd9000001cf1101',
          '02502d2dd91eb552451101',
          '02502d2dd9110101cf0600',
          '02502d2dd9110101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });
  it('emits wet event', function (done) {
    var plan = new Plan(3, function() {
      gw.close();
      done();
    });
    var gw = new Insteon();
    var leak = gw.leak('2d2dd9');

    leak.on('command', function (group, cmd1) {
      group.should.equal(2);
      cmd1.should.equal('11');
      plan.ok();
    });

    leak.on('wet', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '02502d2dd9000002cf1102',
          '02502d2dd9000002cf1102',
          '02502d2dd91eb552451102',
          '02502d2dd9110102cf0600',
          '02502d2dd9110102cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });
  it('emits heartbeat event - dry', function (done) {
    var plan = new Plan(4, function() {
      gw.close();
      done();
    });
    var gw = new Insteon();
    var leak = gw.leak('2d2dd9');

    leak.on('command', function (group, cmd1) {
      group.should.equal(4);
      cmd1.should.equal('11');
      plan.ok();
    });

    leak.on('heartbeat', function () {
      plan.ok();
    });

    leak.on('dry', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '02502d2dd9000004cf1104',
          '02502d2dd9000004cf1104',
          '02502d2dd9110104cf0600',
          '02502d2dd9110104cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits heartbeat event - wet', function (done) {
    var plan = new Plan(4, function() {
      gw.close();
      done();
    });
    var gw = new Insteon();
    var leak = gw.leak('2d2dd9');

    leak.on('command', function (group, cmd1) {
      group.should.equal(4);
      cmd1.should.equal('13');
      plan.ok();
    });

    leak.on('heartbeat', function () {
      plan.ok();
    });

    leak.on('wet', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '02502d2dd9000004cf1304',
          '02502d2dd9000004cf1304',
          '02502d2dd91eb552451304',
          '02502d2dd9130104cf0600',
          '02502d2dd9130104cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  [
    { 'raw': '02502d2dd9000004cf1204', 'group': 4 },
    { 'raw': '02502d2dd9000008cf1204', 'group': 8 }
  ].forEach(function (data) {
    it('handles invalid command for group ' + data.group, function (done) {
      var plan = new Plan(2, function() {
        gw.close();
        done();
      });
      var gw = new Insteon();
      var leak = gw.leak('2d2dd9');

      leak.on('command', function (group, cmd1) {
        group.should.equal(data.group);
        cmd1.should.equal('12');
        plan.ok();
      });

      gw.connect(host, function () {
        setTimeout(function () {
          mockHub.send(data.raw, function () {
            plan.ok();
          });
        }, 10);
      });
    });
  });
}); // Leak Events

