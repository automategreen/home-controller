'use strict';

var Insteon = require('../').Insteon;
var should = require('should');
var Plan = require('../lib/Test/Plan');
var mockHub = require('../lib/Test/mockHub');

var host = '127.0.0.1';
var port = 9761;

describe('IO Commands', function () {
  this.timeout(5000);

  before(function (done) {
    mockHub.listen(port, host, function () {
      done();
    });
  });

  it('turns on', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '0262aabbcc0f4500':
      [
        '0262aabbcc0f450006',
        '0250aabbcc1122332b4500'
      ],
    };

    gw.connect(host, function () {
      gw.io('aabbcc').on().then(function () {
        done();
      });
    });
  });

  it('turns off', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '0262aabbcc0f4600':
      [
        '0262aabbcc0f460006',
        '0250aabbcc1122332b4600'
      ],
    };

    gw.connect(host, function () {
      gw.io('aabbcc').off().then(function () {
        done();
      });
    });
  });

  it('sets the data', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '0262aabbcc0f480a':
      [
        '0262aabbcc0f480a06',
        '0250aabbcc1122332b480a'
      ],
    };

    gw.connect(host, function () {
      gw.io('aabbcc').set(10).then(function () {
        done();
      });
    });
  });

  it('cancels pending', function (done) {
    var gw = new Insteon();

    gw.connect(host, function () {
      var io = gw.io('aabbcc');
      var plan = new Plan(4, done);

      io.on().then(function () {
        plan.ok();
      });

      io.off().then(function () {
        throw new Error('This command should have been canceled.');
      }).fail(function (err) {
        should.exist(err);
        err.message.should.equal('Canceled');
        plan.ok();

        setTimeout(function () {
          mockHub.send([
            '0262aabbcc0f460006',
            '0250aabbcc1122332b4600'
          ], function () {
            plan.ok();
          });
        }, 10);
      });

      io.off(5).then(function () {
        throw new Error('This command should have been canceled.');
      }).fail(function (err) {
        should.exist(err);
        err.message.should.equal('Canceled');
        plan.ok();
      });

      setTimeout(function () {
        io.cancelPending(5);
        io.cancelPending();
      }, 100);
    });
  });
}); // IO commands

