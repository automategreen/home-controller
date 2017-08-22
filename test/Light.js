'use strict';

var Insteon = require('../').Insteon;
var should = require('should');

var mockHub = require('../lib/Test/mockHub');
var Plan = require('../lib/Test/Plan');

var host = '127.0.0.1';
var port = 9761;

describe('Light commands', function () {
  this.timeout(5000);

  before(function (done) {
    mockHub.listen(port, host, function () {
      done();
    });
  });

  it('gets light\'s informaion', function (done) {
    var gw = new Insteon();
    var light = gw.light('112233');
    var plan = new Plan(3, done);

    mockHub.mockData = [
      {
        '02621122331f2e0001000000000000000000000000d1':
        [
          '02621122331f2e0001000000000000000000000000d106',
          '0251112233ffffff112e0001010000202018fc7f0000000000'
        ]
      },
      {
        '02621122331f2e0001000000000000000000000000d1':
        [
          '02621122331f2e0001000000000000000000000000d106',
          '0251112233ffffff112e0001010000202018fc7f0000000000'
        ]
      },
      {
        '02621122331f2e0001000000000000000000000000d1':
        [
          '02621122331f2e0001000000000000000000000000d115'
        ]
      }
    ];

    gw.connect(host, function () {
      light.info().then(function (info) {
        should.exist(info);

        plan.ok();
      });

      light.info(function (err, info) {
        should.not.exist(err);
        should.exist(info);

        info.rampRate.should.equal(8500);
        info.onLevel.should.equal(99);
        info.ledBrightness.should.equal(127);

        plan.ok();
      });

      light.info(function (err, info) {
        should.not.exist(err);
        should.not.exist(info);
        plan.ok();
      });
    });
  });

  it('turns on a light to level 50', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999990f117f': '02629999990f117f060250999999ffffff2f117f'
    };

    gw.connect(host, function () {
      gw.light('999999').turnOn(50, done);
    });
  });

  it('turns on a light to level 100', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [{
      '02629999990f11ff': '02629999990f11ff060250999999ffffff2f11ff'
    },
    {
      '02629999990f11ff': '02629999990f11ff060250999999ffffff2f11ff'
    }];

    gw.connect(host, function () {
      gw.light('999999').turnOn();
      gw.light('999999').turnOn(done);
    });
  });

  it('turns on a light to level at ramp', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999990f2e7d': '02629999990f2e7d060250999999ffffff2f2e7d'
    };

    gw.connect(host, function () {
      gw.light('999999').turnOn(50, 2000, done);
    });
  });

  it('turns on a light to level at ramp (min)', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999990f2e7f': '02629999990f2e7f060250999999ffffff2f2e7f'
    };

    gw.connect(host, function () {
      gw.light('999999').turnOn(50, 0, done);
    });
  });

  it('turns on a light to level at ramp (max)', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999990f2e70': '02629999990f2e70060250999999ffffff2f2e70'
    };

    gw.connect(host, function () {
      gw.light('999999').turnOn(50, 10000000, done);
    });
  });

  it('turns on a light to level at ramp (slow)', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999990f2e76': '02629999990f2e76060250999999ffffff2f2e76'
    };

    gw.connect(host, function () {
      gw.light('999999').turnOn(50, 'slow', done);
    });
  });

  it('turns on a light to level at ramp (fast)', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999990f2e7f': '02629999990f2e7f060250999999ffffff2f2e7f'
    };

    gw.connect(host, function () {
      gw.light('999999').turnOn(50, 'fast', done);
    });
  });

  it('turns off a light', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999990f1300': '02629999990f1300060250999999ffffff2f1300'
    };

    gw.connect(host, function () {
      gw.light('999999').turnOff(done);
    });
  });

  it('turns off a light at ramp (slow)', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999990f2f06': '02629999990f2f06060250999999ffffff2f2f06'
    };

    gw.connect(host, function () {
      gw.light('999999').turnOff('slow', done);
    });
  });

  it('turns off a light at ramp (fast)', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999990f2f0f': '02629999990f2f0f060250999999ffffff2f2f0f'
    };

    gw.connect(host, function () {
      gw.light('999999').turnOff('fast', done);
    });
  });

  it('turns off a light fast', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999990f1400': '02629999990f1400060250999999ffffff2f1400'
    };

    gw.connect(host, function () {
      gw.light('999999').turnOffFast(done);
    });
  });

  it('gets the light level', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999990f1900': '02629999990f1900060250999999ffffff2f01ff'
    };

    gw.connect(host, function () {
      gw.light('999999').level(function (err, level) {
        should.not.exist(err);
        level.should.eql(100);
        done();
      });
    });
  });

  it('sets a light level', function (done) {
    var gw = new Insteon();
    var light = gw.light('999999');

    mockHub.mockData = {
      '02629999990f217f': '02629999990f217f060250999999ffffff2f017f'
    };

    gw.connect(host, function () {
      light.level(50, function (err, res) {
        should.not.exist(err);
        should.exist(res);
        done();
      });
    });
  });

  it('error when trying to get a light level', function (done) {
    var gw = new Insteon();
    var light = gw.light('999999');

    mockHub.mockData = {
      '02629999990f1900': '02629999990f190015'
    };

    gw.connect(host, function () {
      light.level(function (err, res) {
        should.not.exist(err);
        should.not.exist(res);
        done();
      });
    });
  });

  it('error when trying to turn light to invalid level', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {};

    gw.connect(host, function () {
      (function level() {
        gw.light('999999').level(101, function () { });
      }).should.throw('level must be between 0 and 100');
      done();
    });
  });

  it('get the ramp rate', function (done) {
    var gw = new Insteon();
    var light = gw.light('999999');

    mockHub.mockData =
      [
        {
          '02629999991f2e0001000000000000000000000000d1':
          [
            '02629999991f2e0001000000000000000000000000d106',
            '0250999999ffffff2f2e00',
            '0251999999ffffff112e000101000020201cfe1f0000000000'
          ]
        },
        {
          '02629999991f2e0001000000000000000000000000d1':
          [
            '02629999991f2e0001000000000000000000000000d106',
            '0250999999ffffff2f2e00',
            '0251999999ffffff112e000101000020201cfe1f0000000000'
          ]
        }
      ];

    gw.connect(host, function () {
      light.rampRate(function (err, rate) {
        should.not.exist(err);
        should.exist(rate);
        rate.should.eql(500);
        done();
      });
      light.rampRate().then(function (rate) {
        should.exist(rate);
        rate.should.eql(500);
        done();
      });
    });
  });

  it('error when trying to get a ramp rate', function (done) {
    var gw = new Insteon();
    var light = gw.light('999999');

    mockHub.mockData = {
      '02629999991f2e0001000000000000000000000000d1':
      [
        '02629999991f2e0001000000000000000000000000d115'
      ]
    };

    gw.connect(host, function () {
      light.rampRate(function (err, rate) {
        should.not.exist(err);
        should.not.exist(rate);
        done();
      });
    });
  });

  it('set the ramp rate', function (done) {
    var gw = new Insteon();
    var light = gw.light('999999');

    mockHub.mockData = {
      '02629999991f2e0001051c00000000000000000000b0':
      [
        '02629999991f2e0001051c00000000000000000000b006',
        '0251999999ffffff112e000101000020201cfe1f0000000000'
      ]
    };

    gw.connect(host, function () {
      light.rampRate(500, function (err, rate) {
        should.not.exist(err);
        should.exist(rate);
        rate.should.eql(500);
        done();
      });
    });
  });

  it('error when trying to set a ramp rate', function (done) {
    var gw = new Insteon();
    var light = gw.light('999999');

    mockHub.mockData = {
      '02629999991f2e0001051c00000000000000000000b0':
      [
        '02629999991f2e0001051c00000000000000000000b015'
      ]
    };

    gw.connect(host, function () {
      light.rampRate(500, function (err, rate) {
        should.not.exist(err);
        should.not.exist(rate);
        done();
      });
    });
  });

  it('error getting the on level', function (done) {
    var gw = new Insteon();
    var light = gw.light('999999');

    mockHub.mockData = {
      '02629999991f2e0001000000000000000000000000d1': '02629999991f2e0001000000000000000000000000d115'
    };

    gw.connect(host, function () {
      light.onLevel().then(function (level) {
        should.not.exist(level);
        done();
      });
    });
  });

  it('error setting the on level', function (done) {
    var gw = new Insteon();
    var light = gw.light('999999');

    mockHub.mockData = {
      '02629999991f2e0001067f000000000000000000004c': '02629999991f2e0001067f000000000000000000004c15'
    };

    gw.connect(host, function () {
      light.onLevel(50, function (err, level) {
        should.not.exist(err);
        should.not.exist(level);
        done();
      });
    });
  });

  it('get the on level', function (done) {
    var gw = new Insteon();
    var light = gw.light('999999');

    mockHub.mockData =
      [
        {
          '02629999991f2e0001000000000000000000000000d1':
          [
            '02629999991f2e0001000000000000000000000000d106',
            '0250999999ffffff2f2e00',
            '0251999999ffffff112e000101000020201cfe1f0000000000'
          ]
        },
        {
          '02629999991f2e0001000000000000000000000000d1':
          [
            '02629999991f2e0001000000000000000000000000d106',
            '0250999999ffffff2f2e00',
            '0251999999ffffff112e000101000020201cfe1f0000000000'
          ]
        }
      ];

    gw.connect(host, function () {
      light.onLevel(function (err, level) {
        should.not.exist(err);
        should.exist(level);
        level.should.eql(100);
        done();
      });

      light.onLevel().then(function (level) {
        should.exist(level);
        level.should.eql(100);
        done();
      });
    });
  });

  it('set the on level', function (done) {
    var gw = new Insteon();
    var light = gw.light('999999');

    mockHub.mockData = {
      '02629999991f2e000106ff00000000000000000000cc':
      [
        '02629999991f2e000106ff00000000000000000000cc06',
        '0251999999ffffff112e000101000020201cfe1f0000000000'
      ]
    };

    gw.connect(host, function () {
      light.onLevel(100, function (err, level) {
        should.not.exist(err);
        should.exist(level);
        level.should.eql(100);
        done();
      });
    });
  });

  it('fan on', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999991f11bf020000000000000000000000002e':
      [
        '02629999991f11bf020000000000000000000000002e06',
        '0250999999ffffff2f11bf'
      ]
    };

    gw.connect(host, function () {
      gw.light('999999').fanOn(function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  it('fan off', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999991f110002000000000000000000000000ed':
      [
        '02629999991f110002000000000000000000000000ed06',
        '0250999999ffffff2f1100'
      ]
    };

    gw.connect(host, function () {
      gw.light('999999').fanOff(function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  it('fan low', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999991f113f02000000000000000000000000ae':
      [
        '02629999991f113f02000000000000000000000000ae06',
        '0250999999ffffff2f113f'
      ]
    };

    gw.connect(host, function () {
      gw.light('999999').fanLow(function (err) {
        should.not.exist(err);
        done();
      });
    });
  });


  it('fan medium', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999991f11bf020000000000000000000000002e':
      [
        '02629999991f11bf020000000000000000000000002e06',
        '0250999999ffffff2f11bf'
      ]
    };

    gw.connect(host, function () {
      gw.light('999999').fanMedium(function (err) {
        should.not.exist(err);
        done();
      });
    });
  });


  it('fan high', function (done) {
    var gw = new Insteon();

    mockHub.mockData = {
      '02629999991f11ff02000000000000000000000000ee':
      [
        '02629999991f11ff02000000000000000000000000ee06',
        '0250999999ffffff2f11ff'
      ]
    };

    gw.connect(host, function () {
      gw.light('999999').fanHigh(function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  it('fan speed', function (done) {
    var plan = new Plan(4, done);
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02621111110f1903': '02621111110f1903060250111111ffffff2f1900'
      },
      {
        '02622222220f1903': '02622222220f1903060250222222ffffff2f195f'
      },
      {
        '02623333330f1903': '02623333330f1903060250333333ffffff2f19bf'
      },
      {
        '02624444440f1903': '02624444440f1903060250444444ffffff2f19ff'
      },
    ];

    gw.connect(host, function () {
      gw.light('111111').fan(function (err, speed) {
        should.not.exist(err);

        speed.should.eql('off');

        plan.ok();
      });
      gw.light('222222').fan(function (err, speed) {
        should.not.exist(err);

        speed.should.eql('low');

        plan.ok();
      });
      gw.light('333333').fan(function (err, speed) {
        should.not.exist(err);

        speed.should.eql('medium');

        plan.ok();
      });
      gw.light('444444').fan(function (err, speed) {
        should.not.exist(err);

        speed.should.eql('high');

        plan.ok();
      });
    });
  });

  it('fan speed throws error', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      /*{
      '02629999990f1903': '02629999990f1903060250999999ffffff2f19bf'
      },*/
      {
        '02629999990f1903': '02629999990f190315'
      }
    ];

    gw.connect(host, function () {
      gw.light('999999').fan(function (err, speed) {
        should.not.exist(err);

        should.not.exist(speed);

        done();
      });
    });
  });

});

// Light Events

describe('Light Events', function () {
  it('emits turnOn event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var light = gw.light('19d41c');

    light.on('command', function (group, cmd1) {
      this.id.should.equal('19D41C');
      should.exist(this.turnOff);
      group.should.equal(1);
      cmd1.should.equal('11');
      plan.ok();
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
          '025019d41c000001cb1100',
          '025019d41c1eb552451101',
          '025019d41c110101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits turnOff event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var light = gw.light('19d41c');

    light.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.equal('13');
      plan.ok();
    });

    light.on('turnOff', function (group) {
      group.should.equal(1);
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '025019d41c000001cf1300',
          '025019d41c1eb552451301',
          '025019d41c130101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits turnOnFast event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var light = gw.light('19d41c');

    light.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.equal('12');
      plan.ok();
    });

    light.on('turnOnFast', function (group) {
      group.should.equal(1);
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '025019d41c000001cf1200',
          '025019d41c1eb552451201',
          '025019d41c120101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits turnOffFast event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var light = gw.light('19d41c');

    light.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.equal('14');
      plan.ok();
    });

    light.on('turnOffFast', function (group) {
      group.should.equal(1);
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '025019d41c000001cf1400',
          '025019d41c1eb552451401',
          '025019d41c1eb5524a1401',
          '025019d41c1eb5524f1401',
          '025019d41c140101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits dim events', function (done) {
    var plan = new Plan(5, done);
    var gw = new Insteon();
    var light = gw.light('19d41c');

    mockHub.mockData =
      {
        '026219d41c0f1600':
        [
          '026219d41c0f160006',
          '025019d41c000001cf1700',
          '025019d41c000001cb1800'
        ]
      };

    light.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.match(/1[78]/);
      plan.ok();
    });

    light.on('dimming', function (group) {
      group.should.equal(1);
      plan.ok();
    });

    light.on('dimmed', function (group) {
      group.should.equal(1);
      plan.ok();
    });

    gw.connect(host, function () {
      light.dim(function () {
        plan.ok();
      });
    });
  });

  it('emits brighten events', function (done) {
    var plan = new Plan(5, done);
    var gw = new Insteon();
    var light = gw.light('19d41c');

    mockHub.mockData =
      {
        '026219d41c0f1500':
        [
          '026219d41c0f150006',
          '025019d41c000001cf1701',
          '025019d41c000001cf1800'
        ]
      };

    light.on('command', function (group, cmd1, cmd2) {
      group.should.equal(1);
      cmd1.should.match(/1[78]/);
      cmd2.should.match(/0[01]/);
      plan.ok();
    });

    light.on('brightening', function (group) {
      group.should.equal(1);
      plan.ok();
    });

    light.on('brightened', function (group) {
      group.should.equal(1);
      plan.ok();
    });

    gw.connect(host, function () {
      light.brighten(function () {
        plan.ok();
      });
    });
  });

  it('emits heartbeat event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var light = gw.light('19d41c');

    light.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.equal('04');
      plan.ok();
    });

    light.on('heartbeat', function (level) {
      level.should.equal(100);
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send(['025019d41c000001cf04ff'], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('does not emit turnOn event from command ACK', function (done) {
    var gw = new Insteon();
    var light = gw.light('999999');

    light.on('command', function () {
      done(new Error('command should not be emitted'));
    });

    light.on('turnOn', function () {
      done(new Error('command should not be emitted'));
    });

    mockHub.mockData = {
      '02629999990f117f': '02629999990f117f060250999999ffffff2f117f'
    };

    gw.connect(host, function () {
      light.turnOn(50).then(function () {
        done();
      })
        .catch(done);
    });
  });

  it('emits turnOn event from command ACK', function (done) {
    var plan = new Plan(2, done);
    var gw = new Insteon();
    gw.emitSelfAck = true;
    var light = gw.light('999999');

    light.on('command', function (group, cmd1) {
      should.not.exist(group);
      cmd1.should.equal('11');
      plan.ok();
    });

    light.on('turnOn', function (group, level) {
      should.not.exist(group);
      level.should.equal(50);
      plan.ok();
    });

    mockHub.mockData = {
      '02629999990f117f': '02629999990f117f060250999999ffffff2f117f'
    };

    gw.connect(host, function () {
      light.turnOn(50)
        .then(function () {
          plan.ok();
        });
    });
  });

  it('does not emits turnOn with .info', function (done) {
    var gw = new Insteon();
    var light = gw.light('112233');

    light.on('turnOn', function () {
      done(new Error('no turnOn event'));
    });

    mockHub.mockData = {
      '02621122331f2e0001000000000000000000000000d1':
      [
        '02621122331f2e0001000000000000000000000000d106',
        '0250112233ffffff2f2e00',
        '0251112233ffffff112e0001010000202018fc7f0000000000'
      ]
    };

    gw.connect(host, function () {
      light.info().then(function (info) {
        should.exist(info);
        done();
      });
    });
  });


  it('does not emits turnOff when getting links', function (done) {
    var gw = new Insteon();
    var light = gw.light('999999');

    light.on('turnOff', function () {
      done(new Error('no turnOff event'));
    });

    mockHub.mockData = [{
      '02629999991f2f0000000fff010000000000000000c2':
      ['02629999991f2f0000000fff010000000000000000c206',
        '0250999999ffffff2f2f00',
        '0251999999ffffff112f0000010fff00aa01ffffff001c01d5']

    },
    {
      '02629999991f2f0000000ff7010000000000000000ca':
      ['02629999991f2f0000000ff7010000000000000000ca06',
        '0250999999ffffff2f2f00',
        '0251999999ffffff112f0000010ff7000000000000000000ca']
    }];

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
        done();
      });
    });
  });

  it('emits turnOn event from command All-Link ACK', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var light = gw.light('aabbcc');

    light.on('command', function (group, cmd1) {
      should.exist(group);
      group.should.equal(25);
      cmd1.should.equal('11');
      plan.ok();
    });

    light.on('turnOn', function (group) {
      should.exist(group);
      group.should.equal(25);
      plan.ok();
    });

    mockHub.mockData = {
      '0261191100':
      [
        '026119110006',
        '0250aabbccffffff611119',
        '025806'
      ]
    };

    gw.connect(host, function () {
      gw.sceneOn(25)
        .then(function (report) {
          should.exist(report);
          plan.ok();
        });
    });
  });

  it('emits turnOnFast event from command ACK', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    gw.emitSelfAck = true;
    var light = gw.light('999999');

    light.on('command', function (group, cmd1) {
      should.not.exist(group);
      cmd1.should.equal('12');
      plan.ok();
    });

    light.on('turnOnFast', function (group, level) {
      should.not.exist(group);
      should.not.exist(level);
      plan.ok();
    });

    mockHub.mockData = {
      '02629999990f1200': '02629999990f1200060250999999ffffff2f1200'
    };

    gw.connect(host, function () {
      light.turnOnFast(function () {
        plan.ok();
      });
    });
  });

  it('emits turnOff event from command ACK', function (done) {
    var plan = new Plan(2, done);
    var gw = new Insteon();
    gw.emitSelfAck = true;
    var light = gw.light('999999');

    light.on('command', function (group, cmd1) {
      should.not.exist(group);
      cmd1.should.equal('13');
      plan.ok();
    });

    light.on('turnOnFast', function (group) {
      should.not.exist(group);
      plan.ok();
    });

    mockHub.mockData = {
      '02629999990f1300': '02629999990f1300060250999999ffffff2f1300'
    };

    gw.connect(host, function () {
      light.turnOff()
        .then(function () {
          plan.ok();
        });
    });
  });

  it('emits turnOn at ramp level event from command ACK', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    gw.emitSelfAck = true;
    var light = gw.light('999999');

    light.on('command', function (group, cmd1) {
      should.not.exist(group);
      cmd1.should.equal('2e');
      plan.ok();
    });

    light.on('turnOn', function (group, level) {
      should.not.exist(group);
      level.should.equal(40);
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () {
        mockHub.send(['0250999999ffffff2f2e6f'], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits invalid command', function (done) {
    var plan = new Plan(2, done);
    var gw = new Insteon();
    var light = gw.light('19d41c');

    light.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.equal('ff');
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send(['025019d41c000001cfffff'], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('does not emit event from command ACK', function (done) {
    var plan = new Plan(2, done);
    var gw = new Insteon();
    var light = gw.light('999999');
    light.emitOnAck = false;

    light.on('command', function () {
      throw new Error('This event should have been suppressed.');
    });

    light.on('turnOn', function () {
      throw new Error('This event should have been suppressed.');
    });

    setTimeout(function () {
      plan.ok();
    }, 200);

    gw.connect(host, function () {
      setTimeout(function () {
        mockHub.send(['0250999999ffffff2f11ff'], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('cancels pending', function (done) {
    var gw = new Insteon();

    gw.connect(host, function () {
      var light = gw.light('999999');
      var plan = new Plan(3, done);

      light.turnOn().then(function () {
        plan.ok();
      });

      light.turnOff().then(function () {
        throw new Error('This command should have been canceled.');
      }).fail(function (err) {
        should.exist(err);
        err.message.should.equal('Canceled');
        plan.ok();

        setTimeout(function () {
          mockHub.send([
            '02629999990f11ff06',
            '0250999999ffffff2f11ff'
          ], function () {
            plan.ok();
          });
        }, 10);
      });

      setTimeout(function () {
        light.cancelPending();
      }, 100);
    });
  });

});
