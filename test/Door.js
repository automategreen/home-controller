'use strict';

var Insteon = require('../').Insteon;
var Plan = require('../lib/Test/Plan');
var mockHub = require('../lib/Test/mockHub');
var should = require('should');

var host = '127.0.0.1';
var port = 9761;

describe('Door Events', function () {
  this.timeout(5000);

  before(function (done) {
    mockHub.listen(port, host, function () {
      done();
    });
  });

  after(function (done) {
    this.timeout(10000);
    mockHub.close(function() {
      done();
    });
  });

  it('emits opened event', function (done) {
    var plan = new Plan(3, function() {
      gw.close();
      done();
    });
    var gw = new Insteon();
    var door = gw.door('284283');

    door.on('command', function (group, cmd1) {
      should.exists(group);
      should.exists(cmd1);
      group.should.equal(1);
      cmd1.should.equal('11');
      plan.ok();
    });

    door.on('opened', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () {
        mockHub.send([
          '0250284283000001cf1101',
          '0250284283000001cf1101',
          '02502842831eb552451101',
          '0250284283110101cf0600',
          '0250284283110101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits closed event', function (done) {
    var plan = new Plan(3, function() {
      gw.close();
      done();
    });
    var gw = new Insteon();
    var door = gw.door('284283');

    door.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.equal('13');
      plan.ok();
    });

    door.on('closed', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250284283000001cf1301',
          '0250284283000001cf1301',
          '02502842831eb552451301',
          '0250284283130101cf0600',
          '0250284283130101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits closed event - ignoring direct message from Insteon App', function (done) {
    var plan = new Plan(11, function() {
      gw.close();
      done();
    });
    var gw = new Insteon();
    gw.emitDuplicates = true;
    var door = gw.door('284283');

    door.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.equal('13');
      plan.ok();
    });

    door.on('closed', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0262aabbcc05190206',
          '0250284283000001cf1301',
          '0250284283000001cf1301',
          '02502842831eb552451301',
          '0250284283130101cf0600',
          '0250284283130101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits closed event - with emitDuplicates', function (done) {
    var plan = new Plan(11, function() {
      gw.close();
      done();
    });
    var gw = new Insteon();
    gw.emitDuplicates = true;
    var door = gw.door('284283');

    door.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.equal('13');
      plan.ok();
    });

    door.on('closed', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250284283000001cf1301',
          '0250284283000001cf1301',
          '02502842831eb552451301',
          '0250284283130101cf0600',
          '0250284283130101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits closed event - with duplicates 6 seconds apart', function (done) {

    this.timeout(10000);

    var plan = new Plan(5, function() {
      gw.close();
      done();
    });
    var gw = new Insteon();
    var door = gw.door('284283');

    door.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.equal('13');
      plan.ok();
    });

    door.on('closed', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () {
        mockHub.send([
          '0250284283000001cf1301',
          '0250284283000001cf1301',
          '02502842831eb552451301',
          '0250284283130101cf0600',
          '0250284283130101cf0600'
        ], function () {

          setTimeout(function () {
            mockHub.send([
              '0250284283000001cf1301',
              '0250284283000001cf1301',
              '02502842831eb552451301',
              '0250284283130101cf0600',
              '0250284283130101cf0600'
            ], function () {
              plan.ok();
            });
          }, 6000);
        });
      }, 10);
    });
  });

  it('emits open/closed event - within 3 seconds', function (done) {
    var plan = new Plan(5, function() {
      gw.close();
      done();
    });
    var gw = new Insteon();
    var door = gw.door('284283');

    door.on('command', function (group) {
      group.should.equal(1);
      plan.ok();
    });
    door.on('opened', function () {
      plan.ok();
    });
    door.on('closed', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250284283000001cf1101',
          '0250284283000001cf1101',
          '02502842831eb552451101',
          '0250284283110101cf0600',
          '0250284283110101cf0600',
          '0250284283000001cf1301',
          '0250284283000001cf1301',
          '02502842831eb552451301',
          '0250284283130101cf0600',
          '0250284283130101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits closed event - group 2', function (done) {
    var plan = new Plan(3, function() {
      gw.close();
      done();
    });
    var gw = new Insteon();
    var door = gw.door('284283');

    door.on('command', function (group, cmd1) {
      group.should.equal(2);
      cmd1.should.equal('11');
      plan.ok();
    });

    door.on('closed', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250284283000002cb1102',
          '0250',
          '284283000002cb1102',
          '0250284283110002cf0600',
          '0250284283110002cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits heartbeat event - opened', function (done) {
    var plan = new Plan(4, function() {
      gw.close();
      done();
    });
    var gw = new Insteon();
    var door = gw.door('284283');

    door.on('command', function (group, cmd1) {
      group.should.equal(4);
      cmd1.should.equal('11');
      plan.ok();
    });

    door.on('heartbeat', function () {
      plan.ok();
    });

    door.on('opened', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250284283000004cf1104',
          '0250284283000004cf1104',
          '0250284283110004cf0600',
          '0250284283110004cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits heartbeat event - closed', function (done) {
    var plan = new Plan(4, function() {
      gw.close();
      done();
    });
    var gw = new Insteon();
    var door = gw.door('284283');

    door.on('command', function (group, cmd1) {
      group.should.equal(4);
      cmd1.should.equal('13');
      plan.ok();
    });

    door.on('heartbeat', function () {
      plan.ok();
    });

    door.on('closed', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250284283000004cf1304',
          '0250284283000004cf1304',
          '0250284283130004cf0600',
          '0250284283130004cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('recieves unknown command', function (done) {
    var gw = new Insteon();
    var door = gw.door('284283');
    var plan = new Plan(4, function() {
      gw.close();
      done();
    });

    door.on('command', function (group, cmd1) {
      group.should.equalOneOf([1, 3, 4]);
      cmd1.should.equal('12');
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () {
        mockHub.send([
          '0250284283000004cf1204',
          '0250284283000001cf1204',
          '0250284283000003cf1204'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });
}); // Door Events

