'use strict';

var Insteon = require('../').Insteon;
var should = require('should');
var Plan = require('../lib/Test/Plan');
var mockHub = require('../lib/Test/mockHub');
var utils = require('../lib/Insteon/utils');

var host = '127.0.0.1';
var port = 9761;

describe('Insteon Gateway (IP Interface)', function () {
  this.timeout(5000);

  before(function (done) {
    mockHub.listen(port, host, function () {
      done();
    });
  });

  after(function (done) {
    mockHub.close(function () {
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
        gw.close();
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
        gw.close();
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
        gw.close();
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
        gw.close();
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
        gw.close();
        done();
      });
    });
  });

  it('emits \'close\' event', function (done) {
    var gw = new Insteon();

    gw.on('close', function () {
      done();
    });
    gw.connect(host, function () {
      gw.close();
    });
  });

  it('emits \'error\' event', function (done) {
    var gw = new Insteon();

    gw.on('error', function (err) {
      should.exist(err);
      err.message.should.equal('test');
      gw.close();
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
        gw.close();
        gw2.close();
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
        gw.close();
        done();
      }).fail(function () {
        gw.close();
        done();
      });

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
        gw.close();
        done();
      }).fail(function () {
        gw.close();
        done();
      });

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
      gw.close();
      done();
    });
  });

  it('handles gateway NAK', function (done) {
    this.slow(10000);
    this.timeout(15000);

    var gw = new Insteon();
    gw.commandTimeout = 1000;
    gw.nakTimeout = 1000;

    mockHub.mockData = [{
      '0260': '15'
    }, {
      '0260': '15'
    }, {
      '0260': '15'
    }];

    var startTime = new Date();

    gw.connect(host, function () {
      gw.info()
        .then(function (info) {
          should.not.exist(info);

          var duration = new Date() - startTime;

          duration.should.be.above(4000, 'expected total duration [' + (duration / 1000) + 'sec] of all attempts to be greater than 4 seconds. ');
        })
        .then(done)
        .catch(done)
        .finally(function () {
          gw.close();
        });
    });
  });

  it('get the device info', function (done) {
    this.slow(4000);

    var gw = new Insteon();
    gw.commandTimeout = 1000;
    var plan = new Plan(6, function () {
      gw.close();
      done();
    });

    mockHub.mockData = [{ // thermostat
        '02622926380f1000': [
          '02622926380f100006',
          '02502926381eb5522f1000',
          '0250292638050b0d8f0135'
        ]
      },
      { // dimmer switch
        '02621122330f1000': [
          '02621122330f100006',
          '02501122339999992b1000',
          '02501122330120458b0178'
        ],
      },
      { // on/off switch
        '02621122440f1000': [
          '02621122440f100006',
          '02501122449999992b1000',
          '02501122440220458b0178'
        ]
      },
      { // missing full response
        '02621122550f1000': [
          '02621122550f100006'
        ]
      },
      { // missing broadcast message
        '02621122660f1000': [
          '02621122660f100006',
          '02501122669999992b1000',
          '02501122660220452b0178'
        ]
      },
      { // unknown device
        '02621122770f1000': [
          '02621122770f100006',
          '02501122779999992b1000',
          '02501122772220458b0178'
        ]
      }
    ];

    gw.connect(host, function () {
      gw.info('292638', function (err, profile) {
        should.not.exist(err);
        should.exist(profile);
        profile.id.should.eql('292638');
        profile.firmware.should.eql('0d');
        profile.deviceCategory.id.should.eql(5);
        profile.deviceSubcategory.id.should.eql(11);
        profile.isLighting.should.be.false;
        profile.isDimmable.should.be.false;
        profile.isThermostat.should.be.true;
        plan.ok();
      });

      gw.info('112233').then(function (profile) {
        should.exist(profile);
        profile.id.should.eql('112233');
        profile.firmware.should.eql('45');
        profile.deviceCategory.id.should.eql(1);
        profile.deviceSubcategory.id.should.eql(32);
        profile.isLighting.should.be.true;
        profile.isDimmable.should.be.true;
        profile.isThermostat.should.be.false;
        plan.ok();
      }).catch(function () {
        gw.close();
        done();
      });

      gw.info('112244').then(function (profile) {
        should.exist(profile);
        profile.id.should.eql('112244');
        profile.firmware.should.eql('45');
        profile.deviceCategory.id.should.eql(2);
        profile.deviceSubcategory.id.should.eql(32);
        profile.isLighting.should.be.true;
        profile.isDimmable.should.be.false;
        profile.isThermostat.should.be.false;
        plan.ok();
      }).catch(function () {
        gw.close();
        done();
      });

      gw.info('112255').then(function (profile) {
        should.not.exist(profile);
        plan.ok();
      }).catch(function () {
        gw.close();
        done();
      });

      gw.info('112266').then(function (profile) {
        should.not.exist(profile);
        plan.ok();
      }).catch(function () {
        gw.close();
        done();
      });

      gw.info('112277').then(function (profile) {
        should.exist(profile);
        plan.ok();
      }).catch(function () {
        gw.close();
        done();
      });
    });
  });

  it('pings a device', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999990f0f00': '02629999990F0F00060250999999FFFFFF2F0F00'
    };

    gw.connect(host, function () {
      gw.ping('999999', function (err, resp) {
        should.not.exist(err);
        should.exist(resp);
        gw.close();
        done();
      });
    });
  });

  it('gets a device\'s version', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999990f0d00': '02629999990f0d00060250999999ffffff2f0d02'
    };

    gw.connect(host, function () {
      gw.version('999999', function (err, version) {
        should.not.exist(err);
        should.exist(version);
        version.code.should.eql(2);
        version.name.should.eql('i2cs');
        gw.close();
        done();
      });
    });
  });


  it('get the linking data of the gateway', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
        '0269': '0269060257e201112233032041'
      },
      {
        '026a': '026a060257e201aaaaaa033041'
      },
      {
        '026a': '026A15'
      }
    ];

    gw.connect(host, function () {
      gw.links(function (err, links) {
        should.not.exist(err);
        should.exist(links);
        links.length.should.eql(2);
        links[0].group.should.eql(1);
        links[0].id.should.eql('112233');
        links[0].controller.should.be.true;
        gw.close();
        done();
      });
    });
  });


  it('gets the linking data of a device', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
        '02629999991f2f0000000fff010000000000000000c2': ['02629999991f2f0000000fff010000000000000000c206',
          '0250999999ffffff2f2f00',
          '0251999999ffffff112f0000010fff00aa01ffffff001c01d5'
        ]

      },
      {
        '02629999991f2f0000000ff7010000000000000000ca': ['02629999991f2f0000000ff7010000000000000000ca06',
          '0250999999ffffff2f2f00',
          '0251999999ffffff112f0000010ff7000000000000000000ca'
        ]
      }
    ];

    gw.connect(host, function () {
      gw.links('999999', function (err, links) {
        should.not.exist(err);
        should.exist(links);
        links.length.should.eql(1);
        links[0].group.should.eql(1);
        links[0].id.should.eql('ffffff');
        links[0].controller.should.be.false;
        links[0].isInUse.should.be.true;
        links[0].isLast.should.be.false;
        links[0].at.should.eql(4095);
        gw.close();
        done();
      });
    });
  });

  it('links gw to an unknown device ', function () {
    var gw = new Insteon();

    mockHub.mockData = [{
        '0265': '026506'
      },
      {
        '02640101': ['0264010106',
          '02501122330120418f0170',
          '02530101112233012041'
        ]
      }
    ];

    return gw.connect(host)
      .then(gw.link.bind(gw))
      .then(function (link) {
        should.exist(link);
        link.group.should.eql(1);
        link.id.should.eql('112233');
        link.wasDeleted.should.be.false;
        link.deviceCategory.id.should.eql(1);
        link.should.have.property('isNew');
      })
      .finally(() => {
        gw.close();
      });
  });

  it('unlinks gw from a device', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
        '0265': '026506'
      },
      {
        '0264ff00': '0264ff0006'
      },
      {
        '0262aaaaaa0f0a00': ['0262aaaaaa0f0a0006',
          '02',
          '50aaaaaaffffff2f0a00',
          '0250aaaaaa0130418f0100',
          '0253ff00aaaaaa013041'
        ]
      }
    ];

    gw.connect(host, function () {
      gw.unlink('aaaaaa', {
        group: 0
      }, function (err, link) {
        should.not.exist(err);
        should.exist(link);
        link.group.should.eql(0);
        link.id.should.eql('aaaaaa');
        link.wasDeleted.should.be.true;
        link.deviceCategory.id.should.eql(1);
        gw.close();
        done();
      });
    });
  });

  it('links gw to a device', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
        '0265': '026506'
      },
      {
        '02640105': '0264010506'
      },
      {
        '0262aaaaaa1f090000000000000000000000000000f7': ['0262aaaaaa1f090000000000000000000000000000f706',
          '0250aaaaaaffffff2f0900',
          '0250aaaaaa0130418f0100',
          '02530105aaaaaa013041'
        ]
      }
    ];

    gw.connect(host, function () {
      gw.link('aaaaaa', {
        group: 5
      }, function (err, link) {
        should.not.exist(err);
        should.exist(link);
        link.group.should.eql(5);
        link.id.should.eql('aaaaaa');
        link.wasDeleted.should.be.false;
        link.deviceCategory.id.should.eql(1);
        gw.close();
        done();
      });
    });
  });

  it('links gw to unknown device with options', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
        '0265': '026506'
      },
      {
        '02640104': ['0264010406',
          '0250999999021C418B010002530104999999021C41'
        ]
      }
    ];

    gw.connect(host, function () {
      gw.link({
        timeout: 60000,
        group: 4
      }, function (err, link) {
        should.not.exist(err);
        should.exist(link);
        link.group.should.eql(4);
        link.id.should.eql('999999');
        link.wasDeleted.should.be.false;
        link.deviceCategory.id.should.eql(2);
        gw.close();
        done();
      });
    });
  });

  it('links gw to multiple devices', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
        '0265': '026506'
      },
      {
        '02640114': '0264011406'
      },
      {
        '0262aaaaaa1f090000000000000000000000000000f7': ['0262aaaaaa1f090000000000000000000000000000f706',
          '0250aaaaaaffffff2f09000250aaaaaa0130418f0100',
          '02530114aaaaaa013041'
        ]
      },
      {
        '0265': '026506'
      },
      {
        '02640114': '0264011406'
      },
      {
        '02629999991f090000000000000000000000000000f7': ['02629999991f090000000000000000000000000000f706',
          '0250999999ffffff2f09000250999999021c418f0100',
          '02530114999999021c41'
        ]
      }
    ];

    gw.connect(host, function () {
      gw.link(['aaaaaa', '999999'], {
        group: 20
      }, function (err, links) {
        should.not.exist(err);
        should.exist(links);
        links.should.be.an.Array;
        links.length.should.eql(2);
        links[0].group.should.eql(20);
        links[0].id.should.eql('aaaaaa');
        links[0].wasDeleted.should.be.false;
        links[1].group.should.eql(20);
        links[1].id.should.eql('999999');
        links[1].wasDeleted.should.be.false;
        gw.close();
        done();
      });
    });
  });

  it('links device to gw (controller = true)', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
        '0265': '026506'
      },
      {
        '02640001': '0264000006'
      },
      {
        '02629999991f090100000000000000000000000000f6': ['02629999991f090100000000000000000000000000f606',
          '0250999999ffffff2f0901',
          '02530001999999000000'
        ]
      }
    ];

    gw.connect(host, function () {
      gw.link('999999', {
        controller: true
      }, function (err, link) {
        should.not.exist(err);
        should.exist(link);
        link.id.should.eql('999999');
        link.group.should.eql(1);
        link.controller.should.be.false;
        link.wasDeleted.should.be.false;
        gw.close();
        done();
      });
    });
  });

  it('creates a scene between two devices', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
        '0260': '0260ffffff03379c06'
      },
      {
        '0262aaaaaa1f2f0000000fff010000000000000000c2': ['0262aaaaaa1f2f0000000fff010000000000000000c206',
          '0250aaaaaaffffff2f2f00',
          '0251aaaaaaffffff112f0000010fff010262aaaaaa1f2f0000'
        ]
      },
      {
        '0262aaaaaa1f2f0000000ff7010000000000000000ca': ['0262aaaaaa1f2f0000000ff7010000000000000000ca06',
          '0250aaaaaaffffff2f2f00',
          '0251aaaaaaffffff112f0000010ff701ea00ffffff031c009b'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fef010000000000000000d2': ['0262aaaaaa1f2f0000000fef010000000000000000d206',
          '0250aaaaaaffffff2f2f00',
          '0251aaaaaaffffff112f0000010fef01ea00ffffff031c00a3'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fe7010000000000000000da': ['0262aaaaaa1f2f0000000fe7010000000000000000da06',
          '0250aaaaaaffffff2f2f00',
          '0251aaaaaaffffff112f0000010fe701aa01ffffff001c00ed'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fdf010000000000000000e2': ['0262aaaaaa1f2f0000000fdf010000000000000000e206',
          '0250aaaaaaffffff2f2f00',
          '0251aaaaaaffffff112f0000010fdf010000000000000000e1'
        ]
      },
      {
        '0262bbbbbb1f2f0000000fff010000000000000000c2': ['0262bbbbbb1f2f0000000fff010000000000000000c206',
          '0250bbbbbbffffff2f2f00',
          '0251bbbbbbffffff112f0001010fff000201aaaaaa000000b5'
        ]
      },
      {
        '0262bbbbbb1f2f0000000ff7010000000000000000ca': ['0262bbbbbb1f2f0000000ff7010000000000000000ca06',
          '0250bbbbbbffffff2f2f00',
          '0251bbbbbbffffff112f0001010ff700e201ffffff001c00a5'
        ]
      },
      {
        '0262bbbbbb1f2f0000000fef010000000000000000d2': ['0262bbbbbb1f2f0000000fef010000000000000000d206',
          '0250bbbbbbffffff2f2f00',
          '0251bbbbbbffffff112f0001010fef00a201ffffff001c00ed'
        ]
      },
      {
        '0262bbbbbb1f2f0000000fe7010000000000000000da': ['0262bbbbbb1f2f0000000fe7010000000000000000da06',
          '0250bbbbbbffffff2f2f00',
          '0251bbbbbbffffff112f0001010fe7000000000000000000d9'
        ]
      },
      {
        '0262bbbbbb1f2f0000020fff088201aaaaaaff1b001e': ['0262bbbbbb1f2f0000020fff088201aaaaaaff1b001e06',
          '0250bbbbbbffffff2f2f00'
        ]
      },
      {
        '0262aaaaaa1f2f0000020fff08c201bbbbbbff1b00ab': ['0262aaaaaa1f2f0000020fff08c201bbbbbbff1b00ab06',
          '0250aaaaaaffffff2f2f00'
        ]
      }
    ];

    gw.connect(host, function () {
      var responder = {
        id: 'BBBBBB',
        level: 100,
        /* 100% */
        ramp: 2000 /* 2 sec */
      };
      gw.scene('AAAAAA', responder, function (err) {
        should.not.exist(err);
        gw.close();
        done();
      });
    });
  });

  it('removes devices from a scene', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
        '0260': '0260ffffff03379c06'
      },
      {
        '0262aaaaaa1f2f0000000fff010000000000000000c2': ['0262aaaaaa1f2f0000000fff010000000000000000c206',
          '0250aaaaaaffffff2f2f00',
          '0251aaaaaaffffff112f0000010fff01c201999999ff00005c'
        ]
      },
      {
        '0262aaaaaa1f2f0000000ff7010000000000000000ca': ['0262aaaaaa1f2f0000000ff7010000000000000000ca06',
          '0250aaaaaaffffff2f2f00',
          '0251aaaaaaffffff112f0000010ff701ea00ffffff031c009b'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fef010000000000000000d2': ['0262aaaaaa1f2f0000000fef010000000000000000d206',
          '0250aaaaaaffffff2f2f00',
          '0251aaaaaaffffff112f0000010fef01ea00ffffff031c00a3'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fe7010000000000000000da': ['0262aaaaaa1f2f0000000fe7010000000000000000da06',
          '0250aaaaaaffffff2f2f00',
          '0251aaaaaaffffff112f0000010fe701aa01ffffff001c00ed'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fdf010000000000000000e2': ['0262aaaaaa1f2f0000000fdf010000000000000000e206',
          '0250aaaaaaffffff2f2f00',
          '0251aaaaaaffffff112f0000010fdf010000000000000000e1'
        ]
      },
      {
        '02629999991f2f0000000fff010000000000000000c2': ['02629999991f2f0000000fff010000000000000000c206',
          '0250999999ffffff2f2f00',
          '0251999999ffffff112f0001010fff008201aaaaaaff1b001b'
        ]
      },
      {
        '02629999991f2f0000000ff7010000000000000000ca': ['02629999991f2f0000000ff7010000000000000000ca06',
          '0250999999ffffff2f2f00',
          '0251999999ffffff112f0001010ff700e201ffffff001c00a5'
        ]
      },
      {
        '02629999991f2f0000000fef010000000000000000d2': ['02629999991f2f0000000fef010000000000000000d206',
          '0250999999ffffff2f2f00',
          '0251999999ffffff112f0001010fef00a201ffffff001c00ed'
        ]
      },
      {
        '02629999991f2f0000000fe7010000000000000000da': ['02629999991f2f0000000fe7010000000000000000da06',
          '0250999999ffffff2f2f00',
          '0251999999ffffff112f0001010fe7000000000000000000d9'
        ]
      },
      {
        '02629999991f2f0000020fff080201aaaaaa000000b8': ['02629999991f2f0000020fff080201aaaaaa000000b806',
          '0250999999ffffff2f2f00'
        ]
      },
      {
        '0262aaaaaa1f2f0000020fff084201999999000000ab': ['0262aaaaaa1f2f0000020fff084201999999000000ab06',
          '0250aaaaaaffffff2f2f00'
        ]
      }
    ];

    gw.connect(host, function () {
      gw.scene('aaaaaa', null, {
        remove: true
      }, function (err) {
        should.not.exist(err);
        gw.close();
        done();
      });
    });
  });

  it('creates a scene between two devices and the gateway', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
        '0260': '02601eb55203379c06'
      },
      {
        '0269': ['026906', '0257e20126b1cc030e41']
      },
      {
        '026a': ['026a06', '0257e20119d41c033041']
      },
      {
        '026a': ['026a06', '0257e21426b1cc7f1900']
      },
      {
        '026a': ['026a06', '0257a20126b1cc000000']
      },
      {
        '026a': ['026a06', '0257e21419d41c7f1900']
      },
      {
        '026a': ['026a15', '00000000000000000000']
      },
      {
        '026226b1cc1f2f0000000fff010000000000000000c2': ['026226b1cc1f2f0000000fff010000000000000000c206',
          '025026b1cc1eb5522f2f00',
          '025126b1cc1eb552112f0001010fff0082141eb5527f19006e'
        ]
      },
      {
        '026226b1cc1f2f0000000ff7010000000000000000ca': ['026226b1cc1f2f0000000ff7010000000000000000ca06',
          '025026b1cc1eb5522f2f00',
          '025126b1cc1eb552112f0001010ff700e2011eb552001c00a5'
        ]
      },
      {
        '026226b1cc1f2f0000000fef010000000000000000d2': ['026226b1cc1f2f0000000fef010000000000000000d206',
          '025026b1cc1eb5522f2f00',
          '025126b1cc1eb552112f0001010fef00a2011eb552001c00ed'
        ]
      },
      {
        '026226b1cc1f2f0000000fe7010000000000000000da': ['026226b1cc1f2f0000000fe7010000000000000000da06',
          '025026b1cc1eb5522f2f00',
          '025126b1cc1eb552112f0001010fe7000000000000000000d9'
        ]
      },
      {
        '026219d41c1f2f0000000fff010000000000000000c2': ['026219d41c1f2f0000000fff010000000000000000c206',
          '025019d41c1eb5522f2f00',
          '025119d41c1eb552112f0000010fff0182141eb5527f19006e'
        ]
      },
      {
        '026219d41c1f2f0000000ff7010000000000000000ca': ['026219d41c1f2f0000000ff7010000000000000000ca06',
          '025019d41c1eb5522f2f00',
          '025119d41c1eb552112f0000010ff701ea001eb552031c009b'
        ]
      },
      {
        '026219d41c1f2f0000000fef010000000000000000d2': ['026219d41c1f2f0000000fef010000000000000000d206',
          '025019d41c1eb5522f2f00',
          '025119d41c1eb552112f0000010fef01ea001eb552031c00a3'
        ]
      },
      {
        '026219d41c1f2f0000000fe7010000000000000000da': ['026219d41c1f2f0000000fe7010000000000000000da06',
          '025019d41c1eb5522f2f00',
          '025119d41c1eb552112f0000010fe701aa011eb552001c00ed'
        ]
      },
      {
        '026219d41c1f2f0000000fdf010000000000000000e2': ['026219d41c1f2f0000000fdf010000000000000000e206',
          '025019d41c1eb5522f2f00',
          '025119d41c1eb552112f0000010fdf010000000000000000e1'
        ]
      },
      {
        '026226b1cc1f2f0000020fe70882321eb5527f190060': ['026226b1cc1f2f0000020fe70882321eb5527f19006006',
          '025026b1cc1eb5522f2f00'
        ]
      },
      {
        '026f40c23226b1cc7f1900': '026f40c23226b1cc7f190006'
      },
      {
        '026219d41c1f2f0000020fdf0882321eb5527f190068': ['026219d41c1f2f0000020fdf0882321eb5527f19006806',
          '025019d41c1eb5522f2f00'
        ]
      },
      {
        '026f40c23219d41c7f1900': '026f40c23219d41c7f190006'
      }
    ];

    gw.connect(host, function () {

      var responders = [{
        id: '26B1CC',
        level: 50,
        /* 100% */
        ramp: 6500 /* 2 sec */
      }, {
        id: '19D41C',
        level: 50,
        /* 100% */
        ramp: 6500 /* 2 sec */
      }];
      gw.scene('gw', responders, {
        group: 50
      }, function (err) {
        should.not.exist(err);
        gw.close();
        done();
      });
    });
  });


  describe('Scene Control', function () {

    it('scene on', function (done) {
      var plan = new Plan(4, function () {
        gw.close();
        done();
      });
      var gw = new Insteon();

      mockHub.mockData = [{
        '0261821100': [
          '026182110006',
          '025026ace11eb552601185',
          '025806025026b1cc1eb552601185025026b1cc1eb552601185'
        ]
      }];

      gw.on('command', function (cmd) {
        should.exist(cmd);
        should.exist(cmd.standard);
        cmd.standard.command1.should.eql('11');
        cmd.standard.messageType.should.eql(3);
        plan.ok();
      });

      gw.connect(host, function () {
        gw.sceneOn(130, function (err, report) {
          should.not.exist(err);
          should.exist(report);
          report.completed.should.ok;
          report.aborted.should.not.ok;
          plan.ok();
        });
      });
    });

    it('scene on fast', function (done) {
      var plan = new Plan(4, function () {
        gw.close();
        done();
      });
      var gw = new Insteon();

      mockHub.mockData = [{
        '0261851200': [
          '026185120006',
          '025026ace11eb552601285',
          '025806025026b1cc1eb552601285025026b1cc1eb552601285'
        ]
      }];

      gw.on('command', function (cmd) {
        should.exist(cmd);
        should.exist(cmd.standard);
        cmd.standard.command1.should.eql('12');
        cmd.standard.messageType.should.eql(3);
        plan.ok();
      });

      gw.connect(host, function () {
        gw.sceneOnFast(133, function (err, report) {
          should.not.exist(err);
          should.exist(report);
          report.completed.should.ok;
          report.aborted.should.not.ok;
          plan.ok();
        });
      });
    });

    it('scene off', function (done) {
      var plan = new Plan(3, function () {
        gw.close();
        done();
      });
      var gw = new Insteon();

      mockHub.mockData = [{
        '0261851300': [
          '026185130006',
          '025026ace11eb552601385',
          '025806025026b1cc1eb552651385'
        ]
      }];

      gw.on('command', function (cmd) {
        should.exist(cmd);
        should.exist(cmd.standard);
        cmd.standard.command1.should.eql('13');
        cmd.standard.messageType.should.eql(3);
        plan.ok();
      });

      gw.connect(host, function () {
        gw.sceneOff(133, function (err, report) {
          should.not.exist(err);
          should.exist(report);
          report.completed.should.ok;
          report.aborted.should.not.ok;
          plan.ok();
        });
      });
    });

    it('scene off fast', function (done) {
      var plan = new Plan(3, function () {
        gw.close();
        done();
      });
      var gw = new Insteon();

      mockHub.mockData = [{
        '0261851400': [
          '026185140006',
          '025026ace11eb552601485',
          '025806025026b1cc1eb552651485'
        ]
      }];

      gw.on('command', function (cmd) {
        should.exist(cmd);
        should.exist(cmd.standard);
        cmd.standard.command1.should.eql('14');
        cmd.standard.messageType.should.eql(3);
        plan.ok();
      });

      gw.connect(host, function () {
        gw.sceneOffFast(133, function (err, report) {
          should.not.exist(err);
          should.exist(report);
          report.completed.should.ok;
          report.aborted.should.not.ok;
          plan.ok();
        });
      });
    });

    it('scene dim', function (done) {
      var plan = new Plan(3, function () {
        gw.close();
        done();
      });
      var gw = new Insteon();

      mockHub.mockData = [{
        '0261851500': [
          '026185150006',
          '025026ace11eb552601585',
          '025806025026b1cc1eb552651585'
        ]
      }];

      gw.on('command', function (cmd) {
        should.exist(cmd);
        should.exist(cmd.standard);
        cmd.standard.command1.should.eql('15');
        cmd.standard.messageType.should.eql(3);
        plan.ok();
      });

      gw.connect(host, function () {
        gw.sceneDim(133, function (err, report) {
          should.not.exist(err);
          should.exist(report);
          report.completed.should.ok;
          report.aborted.should.not.ok;
          plan.ok();
        });
      });
    });

    it('scene brighten', function (done) {
      var plan = new Plan(3, function () {
        gw.close();
        done();
      });
      var gw = new Insteon();

      mockHub.mockData = [{
        '0261851600': [
          '026185160006',
          '025026ace11eb552601685',
          '025806025026b1cc1eb552651685'
        ]
      }];

      gw.on('command', function (cmd) {
        should.exist(cmd);
        should.exist(cmd.standard);
        cmd.standard.command1.should.eql('16');
        cmd.standard.messageType.should.eql(3);
        plan.ok();
      });

      gw.connect(host, function () {
        gw.sceneBrighten(133, function (err, report) {
          should.not.exist(err);
          should.exist(report);
          report.completed.should.ok;
          report.aborted.should.not.ok;
          plan.ok();
        });
      });
    });

  });

  describe('Queueing', function () {

    it('multiple commands', function (done) {
      var plan = new Plan(2, function () {
        gw.close();
        done();
      });
      var gw = new Insteon();

      mockHub.mockData = [{
          '026226ace10f1600': [
            '026226ace10f160006',
            '025026ace11eb5522f1600'
          ]
        },
        {
          '026226b1cc0f1500': [
            '026226b1cc0f150006',
            '025026b1cc1eb5522f1500'
          ]
        }
      ];

      gw.connect(host, function () {
        var light1 = gw.light('26ace1'),
          light2 = gw.light('26b1cc');

        light1.dim(function (err) {
          should.not.exist(err);
          plan.ok();
        });
        light2.brighten(function (err) {
          should.not.exist(err);
          plan.ok();
        });
      });
    });

    it('multiple commands with timeout', function (done) {
      var plan = new Plan(2, function () {
        gw.close();
        done();
      });
      var gw = new Insteon();
      gw.commandTimeout = 2000;

      mockHub.mockData = [{
        '026226b1cc0f1500': [
          '026226b1cc0f150006',
          '025026b1cc1eb5522f1500'
        ]
      }];

      gw.connect(host, function () {
        var light = gw.light('26b1cc');
        light.dim(function (err, status) {
          should.not.exist(err);
          should.not.exist(status.standard);
          plan.ok();
        });
        light.brighten(function (err) {
          should.not.exist(err);
          plan.ok();
        });
      });
    });

    it('multiple commands with cancel', function (done) {
      var plan = new Plan(5, function () {
        gw.close();
        done();
      });
      var gw = new Insteon();

      mockHub.mockData = [{
          '026226ace10f1600': [
            '026226ace10f160006',
            '025026ace11eb5522f1600'
          ]
        },
        {
          '026226b1cc0f1500': [
            '026226b1cc0f150006',
            '025026b1cc1eb5522f1500'
          ]
        }
      ];

      gw.connect(host, function () {
        var light1 = gw.light('26ace1'),
          light2 = gw.light('26b1cc');

        light1.dim(function (err) {
          should.not.exist(err);
          plan.ok();
        });
        light1.dim(function (err) {
          should.exist(err);
          plan.ok();
        });
        light2.brighten(function (err) {
          should.not.exist(err);
          plan.ok();
        });
        light1.dim(function (err) {
          should.exist(err);
          plan.ok();
        });
        light1.dim(function (err) {
          should.exist(err);
          plan.ok();
        });
        light1.cancelPending();
      });
    });

  });

});

// Testing weird conditions
describe('Parser consistency', function () {
  before(function (done) {
    mockHub.listen(port, host, function () {
      done();
    });
  });

  after(function (done) {
    mockHub.close(function () {
      done();
    });
  });

  it('handles incoming data not packetized well', function (done) {
    var gw = new Insteon();
    var light = gw.light('19d41c');
    var plan = new Plan(2, function () {
      gw.close();
      done();
    });

    light.on('turnOn', function (group) {
      this.id.should.equal('19D41C');
      should.exist(this.turnOff);
      group.should.equal(1);
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '025019d41c000001cb1100' +
          '025019d41c1e', 'b552451101' +
          '025019d41c110101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('handles a randomly arriving extended command (0251)', function (done) {
    var gw = new Insteon();
    var plan = new Plan(2, function () {
      gw.close();
      done();
    });
    gw.on('command', function () {
      plan.ok();
    });
    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0251112233ffffff112e0001010000202018fc7f0000000000'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('handles a randomly arriving link completed command (0253)', function (done) {
    var gw = new Insteon();
    var plan = new Plan(2, function () {
      gw.close();
      done();
    });
    gw.on('command', function () {
      plan.ok();
    });
    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0253010111223301204100'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  function skippedCheck(buffer, done) {
    var gw = new Insteon();
    gw.connect(host, function () {
      gw.buffer = buffer;
      var result = gw._checkStatus();
      result.should.equal(3); // MESSAGE_SKIPPED = 3
      gw.buffer.should.equal('');
      gw.close();
      done();
    });
  }

  it('skips a randomly arriving X10 Response (0263)', function (done) {
    skippedCheck('0263000000', done);
  });

  it('skips a randomly arriving All-Link start response (0264)', function (done) {
    skippedCheck('0264000000', done);
  });

  it('skips a randomly arriving All-Link cancel response (0265)', function (done) {
    skippedCheck('026506', done);
  });

  it('skips a randomly arriving All-Link records response (0269)', function (done) {
    skippedCheck('026906', done);
  });

  it('skips a randomly arriving All-Link records Next response (026A)', function (done) {
    skippedCheck('026A06', done);
  });

  it('skips a randomly arriving manage all-link response (026F)', function (done) {
    skippedCheck('026f40c23226b1cc7f190006', done);
  });

});

describe('Util tests', function () {
  it('levelToHexHalfByte', function (done) {
    (function () {
      utils.levelToHexHalfByte(101);
    }).should.throw();
    done();
  });

  it('convertTemp', function (done) {
    utils.convertTemp('C', 'F', 0).should.equal(32);
    utils.convertTemp('F', 'С', 32).should.equal(0);
    utils.convertTemp('K', 'F', 273.15).should.equal(32);
    utils.convertTemp('K', 'C', 273.15).should.equal(0);
    utils.convertTemp('F', 'K', 32).should.equal(273.15);
    utils.convertTemp('C', 'K', 0).should.equal(273.15);
    done();
  });
});