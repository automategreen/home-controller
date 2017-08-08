var Insteon = require('../').Insteon;
var should = require('should');

var mockHub = require('../lib/Test/mockHub');

var host = '127.0.0.1';
var port = 9761;

describe('Insteon Gateway (IP Interface)', function () {
  this.timeout(5000);

  before(function (done) {
    mockHub.listen(port, host, function () {
      done();
    });
  });

  it('sends a simple command', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '0260': '0260ffffff03379c06'
    };

    gw.connect(host, function () {
      gw.sendCommand('60', function () {
        done();
      });
    });
  });

  it('catches a socket error', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '0260': '0260ffffff03379c06'
    };

    gw.connect(host, function () {
      gw.write = 'error';
      gw.sendCommand('60', function (err) {
        should.exist(err);
        done();
      });
    });
  });

  it('catches a socket error after timeout', function (done) {
    this.slow(2500);

    var gw = new Insteon();

    mockHub.mockData = {};

    gw.connect(host, function () {
      setTimeout(function () {
        gw.write = 'error';
      }, 200);

      gw.sendCommand('60', 1000, function (err) {
        should.exist(err);
        done();
      });
    });
  });

  it('skips write for broken gateway', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {};

    gw.connect(host, function () {
      gw.write = null;
      gw.sendCommand('60', 100, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  it('gets the gateway info', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '0260': '0260ffffff03379c06'
    };

    gw.connect(host, function () {
      gw.info(function (err, info) {
        should.not.exist(err);
        should.exist(info);
        info.firmwareVersion.should.equal('9c');
        info.id.should.equal('ffffff');
        info.deviceCategory.id.should.equal(3);
        info.deviceSubcategory.id.should.equal(55);
        done();
      });
    });
  });

  it('emits \'close\' event', function (done) {
    var gw = new Insteon();

    gw.on('close', done);
    gw.connect(host, function () {
      gw.close();
    });
  });

  it('emits \'error\' event', function (done) {
    var gw = new Insteon();

    gw.on('error', function (err) {
      should.exist(err);
      err.message.should.equal('test');
      done();
    });
    gw.connect(host, function () {
      setTimeout(function () {
        gw.socket.destroy(new Error('test'));
      }, 100);
    });
  });

  it('connects to specified/default port', function (done) {
    var gw = new Insteon();

    gw.connect(host, 9761, function () {

      var gw2 = new Insteon();
      gw2.connect(host, 0, function () {
        done();
      });
    });
  });

  it('cancels all pending commands', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {};

    gw.connect(host, function () {
      gw.ping('111111');

      gw.ping('222222').then(function () {
        throw new Error('Then handler should\'ve never been called');
      }).fail(function (err) {
        should.exist(err);
        err.message.should.equal('Canceled');
        gw.queue.length.should.equal(0, 'Gateway queue must be empty');
        done();
      }).fail(done);

      gw.cancelPending();
    });
  });

  it('cancels specific pending commands', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {};

    gw.connect(host, function () {
      gw.ping('111111');
      gw.ping('222222');

      gw.ping('333333').then(function () {
        throw new Error('Then handler should\'ve never been called');
      }).fail(function (err) {
        should.exist(err);
        err.message.should.equal('Canceled');
        gw.queue.length.should.equal(1, 'Gateway queue must not be empty');
        gw.queue[0].command.id.should.equal('222222');
        done();
      }).fail(done);

      gw.cancelPending('999999');
      gw.cancelPending('333333');
    });
  });

  it('throws errors in cancel', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {};

    gw.connect(host, function () {
      (function cancelPending() {
        gw.cancelPending('gggggg');
      }).should.throw('Invalid Insteon ID');
      (function () {
        gw.cancelPending(999999);
      }).should.throw('Invalid cmdMatch');
      done();
    });
  });

});