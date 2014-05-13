'use strict';

var Insteon = require('../').Insteon;
var should = require('should');
var net = require('net');
var util = require('util');
var assert = require('assert');

console.trace = function () {};
function Plan(count, done) {
  this.done = done;
  this.count = count;
}

Plan.prototype.ok = function() {

  if (this.count === 0) {
    assert(false, 'Too many assertions called');
  } else {
    this.count--;
  }

  if (this.count === 0) {
    this.done();
  }
};


var mockData = null;

var host = '127.0.0.1';
var port = 9761;

var mockHub = net.createServer(function (socket) {
  socket.setEncoding('hex');
  socket.on('data', function (cmd) {
    if(!util.isArray(mockData)){
      mockData = [mockData];
    }
    var responses;
    for(var i in mockData) {
      var data = mockData[i];
      if(data[cmd]){
        responses = data[cmd];
        mockData.splice(i, 1);
        break;
      }
    }
    if(!responses) {
      return;
    }

    if(typeof responses === 'string') {
      responses = [responses];
    }

    function write(response) {
      if(!response) {
        return;
      }
      socket.write(response, 'hex');
      setTimeout(function() {
        write(responses.shift());
      }, 100);
    }
    write(responses.shift());
  });
});


describe('Insteon Gateway', function() {
  this.timeout(5000);

  before(function(done) {
    mockHub.listen(port, host, function() {
      done();
    });
  });

  it('gets the gateway info', function(done) {
    var gw = new Insteon();

    mockData = {
      '0260': '0260ffffff03379c06'
    };

    gw.connect(host, function (){
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

  it('turns on a light to level', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999990f117f': '02629999990f117f060250999999ffffff2f117f'
    };

    gw.connect(host, function (){
      gw.turnOn('999999', 50, done);
    });
  });

  it('turns on a light to level at ramp', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999990f2e7d': '02629999990f2e7d060250999999ffffff2f2e7d'
    };

    gw.connect(host, function (){
      gw.turnOn('999999', 50, 2000, done);
    });
  });


  it('turns on a light to level at ramp (min)', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999990f2e7f': '02629999990f2e7f060250999999ffffff2f2e7f'
    };

    gw.connect(host, function (){
      gw.turnOn('999999', 50, 0, done);
    });
  });


  it('turns on a light to level at ramp (max)', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999990f2e70': '02629999990f2e70060250999999ffffff2f2e70'
    };

    gw.connect(host, function (){
      gw.turnOn('999999', 50, 10000000, done);
    });
  });

  it('turns on a light to level at ramp (slow)', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999990f2e76': '02629999990f2e76060250999999ffffff2f2e76'
    };

    gw.connect(host, function (){
      gw.turnOn('999999', 50, 'slow', done);
    });
  });


  it('turns on a light to level at ramp (fast)', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999990f2e7f': '02629999990f2e7f060250999999ffffff2f2e7f'
    };

    gw.connect(host, function (){
      gw.turnOn('999999', 50, 'fast', done);
    });
  });

  it('turns off a light', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999990f1300': '02629999990f1300060250999999ffffff2f1300'
    };

    gw.connect(host, function (){
      gw.turnOff('999999', done);
    });
  });

  it('turns off a light at ramp (slow)', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999990f2f06': '02629999990f2f06060250999999ffffff2f2f06'
    };

    gw.connect(host, function (){
      gw.turnOff('999999', 'slow', done);
    });
  });


  it('turns off a light at ramp (fast)', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999990f2f0f': '02629999990f2f0f060250999999ffffff2f2f0f'
    };

    gw.connect(host, function (){
      gw.turnOff('999999', 'fast', done);
    });
  });

  it('turns off a light fast', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999990f1400': '02629999990f1400060250999999ffffff2f1400'
    };

    gw.connect(host, function (){
      gw.turnOffFast('999999', done);
    });
  });

  it('gets the light level', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999990f1900': '02629999990f1900060250999999ffffff2f01ff'
    };

    gw.connect(host, function (){
      gw.level('999999', function(err, level) {
        should.not.exist(err);
        level.should.eql(100);
        done();
      });
    });
  });

  it('error when trying to turn light to invlaid level', function() {
    var gw = new Insteon();

    mockData = {};

    gw.connect(host, function (){
      (function(){
        gw.turnOn('999999', 101, function() {});
      }).should.throw('level must be between 0 and 100');
    });
  });


  it('get the ramp rate', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999991f2e0001000000000000000000000000d1':
      [
      '02629999991f2e0001000000000000000000000000d106',
      '0250999999ffffff2f2e00',
      '0251999999ffffff112e000101000020201cfe1f0000000000'
      ]
    };


    gw.connect(host, function (){
      gw.rampRate('999999', function(err, rate){
        should.not.exist(err);
        should.exist(rate);
        rate.should.eql(500);
        done();

      });
    });
  });

  it('get the on level', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999991f2e0001000000000000000000000000d1':
      [
      '02629999991f2e0001000000000000000000000000d106',
      '0250999999ffffff2f2e00',
      '0251999999ffffff112e000101000020201cfe1f0000000000'
      ]
    };


    gw.connect(host, function (){
      gw.onLevel('999999', function(err, level){
        should.not.exist(err);
        should.exist(level);
        level.should.eql(99);
        done();

      });
    });
  });

  it('get the device info', function(done) {
    var gw = new Insteon();

    mockData = {
      '02622926380f1000':
      [
      '02622926380f100006',
      '02502926381eb5522f1000',
      '0250292638050b0d8f01350250292638050b0d8f0135'
      ]
    };

    gw.connect(host, function (){
      gw.info('292638', function(err, profile){
        should.not.exist(err);
        should.exist(profile);
        profile.id.should.eql('292638');
        profile.firmware.should.eql('0d');
        profile.deviceCategory.id.should.eql(5);
        profile.deviceSubcategory.id.should.eql(11);
        profile.isDimmable.should.be.false;
        profile.isLighting.should.be.false;
        profile.isThermostat.should.be.true;
        done();
      });
    });
  });

  it('pings a device', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999990f0f00': '02629999990F0F00060250999999FFFFFF2F0F00'
    };

    gw.connect(host, function (){
      gw.ping('999999', function(err, resp){
        should.not.exist(err);
        should.exist(resp);
        done();
      });
    });
  });

  it('gets a device\'s version', function(done) {
    var gw = new Insteon();

    mockData = {
      '02629999990f0d00': '02629999990f0d00060250999999ffffff2f0d02'
    };

    gw.connect(host, function (){
      gw.version('999999', function(err, version){
        should.not.exist(err);
        should.exist(version);
        version.code.should.eql(2);
        version.name.should.eql('i2cs');
        done();
      });
    });
  });



  it('get the linking data of the gateway', function(done) {
    var gw = new Insteon();

    mockData = [{
      '0269': '0269060257e201112233032041'
    },
    {
      '026a': '026a060257e201aaaaaa033041'
    },
    {
      '026a': '026A15'
    }];

    gw.connect(host, function (){
      gw.links(function(err, links){
        should.not.exist(err);
        should.exist(links);
        links.length.should.eql(2);
        links[0].group.should.eql(1);
        links[0].id.should.eql('112233');
        links[0].controller.should.be.true;
        done();
      });
    });
  });



  it('gets the linking data of a device', function(done) {
    var gw = new Insteon();

    mockData = [{
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

    gw.connect(host, function (){
      gw.links('999999', function(err, links){
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


  it('links gw to an unknown device ', function(done) {
    var gw = new Insteon();

    mockData = [{
      '0265': '026506'
    },
    {
      '02640101':
      ['0264010106',
      '02501122330120418f0170',
      '0253010111223301204100']
    }];

    gw.connect(host, function (){
      gw.link(function(err, link){
        should.not.exist(err);
        should.exist(link);
        link.group.should.eql(1);
        link.id.should.eql('112233');
        link.wasDeleted.should.be.false;
        link.deviceCategory.id.should.eql(1);
        done();
      });
    });
  });


  it('unlinks gw from a device', function(done) {
    var gw = new Insteon();

    mockData = [{
      '0265': '026506'
    },
    {
      '0264ff00': '0264ff0006'
    },
    {
      '0262aaaaaa0f0a00':
      ['0262aaaaaa0f0a0006',
      '02',
      '50aaaaaaffffff2f0a00',
      '0250aaaaaa0130418f0100',
      '0253ff00aaaaaa013041']
    }];

    gw.connect(host, function (){
      gw.unlink('aaaaaa', {group: 0}, function(err, link){
        should.not.exist(err);
        should.exist(link);
        link.group.should.eql(0);
        link.id.should.eql('aaaaaa');
        link.wasDeleted.should.be.true;
        link.deviceCategory.id.should.eql(1);
        done();
      });
    });
  });


  it('links gw to a device', function(done) {
    var gw = new Insteon();

    mockData = [{
      '0265': '026506'
    },
    {
      '02640105': '0264010506'
    },
    {
      '0262aaaaaa1f090000000000000000000000000000f7':
      ['0262aaaaaa1f090000000000000000000000000000f706',
      '0250aaaaaaffffff2f0900',
      '0250aaaaaa0130418f0100',
      '02530105aaaaaa013041']
    }];

    gw.connect(host, function (){
      gw.link('aaaaaa', {group: 5}, function(err, link){
        should.not.exist(err);
        should.exist(link);
        link.group.should.eql(5);
        link.id.should.eql('aaaaaa');
        link.wasDeleted.should.be.false;
        link.deviceCategory.id.should.eql(1);
        done();
      });
    });
  });

  it('links gw to unknown device with options', function(done) {
    var gw = new Insteon();

    mockData = [{
      '0265': '026506'
    },
    {
      '02640104':
      ['0264010406',
      '0250999999021C418B010002530104999999021C41',
      '0250999999FFFFFF2301040250999999FFFFFF230104']
    }];

    gw.connect(host, function (){
      gw.link({timeout:60000, group: 4}, function(err, link){
        should.not.exist(err);
        should.exist(link);
        link.group.should.eql(4);
        link.id.should.eql('999999');
        link.wasDeleted.should.be.false;
        link.deviceCategory.id.should.eql(2);
        done();
      });
    });
  });


  it('links gw to multiple devices', function(done) {
    var gw = new Insteon();

    mockData = [{
      '0265': '026506'
    },
    {
      '02640114': '0264011406'
    },
    {
      '0262aaaaaa1f090000000000000000000000000000f7':
      ['0262aaaaaa1f090000000000000000000000000000f706',
      '0250aaaaaaffffff2f09000250aaaaaa0130418f0100',
      '02530114aaaaaa013041']
    },
    {
      '0265': '026506'
    },
    {
      '02640114': '0264011406'
    },
    {
      '02629999991f090000000000000000000000000000f7':
      ['02629999991f090000000000000000000000000000f706',
      '0250999999ffffff2f09000250999999021c418f0100',
      '02530114999999021c41']
    }];

    gw.connect(host, function (){
      gw.link(['aaaaaa', '999999'], {group: 20}, function(err, links){
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
        done();
      });
    });
  });

  it('links device to gw (controller = true)', function (done) {
    var gw = new Insteon();

    mockData = [{
      '0265': '026506'
    },
    {
      '02640001': '0264000006'
    },
    {
      '02629999991f090100000000000000000000000000f6':
      ['02629999991f090100000000000000000000000000f606',
      '0250999999ffffff2f0901',
      '02530001999999000000']
    }];

    gw.connect(host, function (){
      gw.link('999999', {controller: true}, function(err, link){
        should.not.exist(err);
        should.exist(link);
        link.id.should.eql('999999');
        link.group.should.eql(1);
        link.controller.should.be.false;
        link.wasDeleted.should.be.false;
        done();
      });
    });
  });

  it('creates a scene between two devices', function (done) {
    var gw = new Insteon();

    mockData = [{
      '0260': '0260ffffff03379c06'
    },
    {
      '0262aaaaaa1f2f0000000fff010000000000000000c2':
      ['0262aaaaaa1f2f0000000fff010000000000000000c206',
      '0250aaaaaaffffff2f2f00',
      '0251aaaaaaffffff112f0000010fff010262aaaaaa1f2f0000']
    },
    {
      '0262aaaaaa1f2f0000000ff7010000000000000000ca':
      ['0262aaaaaa1f2f0000000ff7010000000000000000ca06',
      '0250aaaaaaffffff2f2f00',
      '0251aaaaaaffffff112f0000010ff701ea00ffffff031c009b']
    },
    {
      '0262aaaaaa1f2f0000000fef010000000000000000d2':
      ['0262aaaaaa1f2f0000000fef010000000000000000d206',
      '0250aaaaaaffffff2f2f00',
      '0251aaaaaaffffff112f0000010fef01ea00ffffff031c00a3']
    },
    {
      '0262aaaaaa1f2f0000000fe7010000000000000000da':
      ['0262aaaaaa1f2f0000000fe7010000000000000000da06',
      '0250aaaaaaffffff2f2f00',
      '0251aaaaaaffffff112f0000010fe701aa01ffffff001c00ed']
    },
    {
      '0262aaaaaa1f2f0000000fdf010000000000000000e2':
      ['0262aaaaaa1f2f0000000fdf010000000000000000e206',
      '0250aaaaaaffffff2f2f00',
      '0251aaaaaaffffff112f0000010fdf010000000000000000e1']
    },
    {
      '0262bbbbbb1f2f0000000fff010000000000000000c2':
      ['0262bbbbbb1f2f0000000fff010000000000000000c206',
      '0250bbbbbbffffff2f2f00',
      '0251bbbbbbffffff112f0001010fff000201aaaaaa000000b5']
    },
    {
      '0262bbbbbb1f2f0000000ff7010000000000000000ca':
      ['0262bbbbbb1f2f0000000ff7010000000000000000ca06',
      '0250bbbbbbffffff2f2f00',
      '0251bbbbbbffffff112f0001010ff700e201ffffff001c00a5']
    },
    {
      '0262bbbbbb1f2f0000000fef010000000000000000d2':
      ['0262bbbbbb1f2f0000000fef010000000000000000d206',
      '0250bbbbbbffffff2f2f00',
      '0251bbbbbbffffff112f0001010fef00a201ffffff001c00ed']
    },
    {
      '0262bbbbbb1f2f0000000fe7010000000000000000da':
      ['0262bbbbbb1f2f0000000fe7010000000000000000da06',
      '0250bbbbbbffffff2f2f00',
      '0251bbbbbbffffff112f0001010fe7000000000000000000d9']
    },
    {
      '0262bbbbbb1f2f0000020fff088201aaaaaaff1b001e':
      ['0262bbbbbb1f2f0000020fff088201aaaaaaff1b001e06',
      '0250bbbbbbffffff2f2f00']
    },
    {
      '0262aaaaaa1f2f0000020fff08c201bbbbbbff1b00ab':
      ['0262aaaaaa1f2f0000020fff08c201bbbbbbff1b00ab06',
      '0250aaaaaaffffff2f2f00']
    }];

    gw.connect(host, function (){
      var responder = {
        id: 'BBBBBB',
        level: 100, /* 100% */
        ramp: 2000 /* 2 sec */
      };
      gw.scene('AAAAAA', responder, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });

  it('removes devices from a scene', function (done) {
    var gw = new Insteon();

    mockData = [{
      '0260': '0260ffffff03379c06'
    },
    {
      '0262aaaaaa1f2f0000000fff010000000000000000c2':
      ['0262aaaaaa1f2f0000000fff010000000000000000c206',
      '0250aaaaaaffffff2f2f00',
      '0251aaaaaaffffff112f0000010fff01c201999999ff00005c']
    },
    {
      '0262aaaaaa1f2f0000000ff7010000000000000000ca':
      ['0262aaaaaa1f2f0000000ff7010000000000000000ca06',
      '0250aaaaaaffffff2f2f00',
      '0251aaaaaaffffff112f0000010ff701ea00ffffff031c009b']
    },
    {
      '0262aaaaaa1f2f0000000fef010000000000000000d2':
      ['0262aaaaaa1f2f0000000fef010000000000000000d206',
      '0250aaaaaaffffff2f2f00',
      '0251aaaaaaffffff112f0000010fef01ea00ffffff031c00a3']
    },
    {
      '0262aaaaaa1f2f0000000fe7010000000000000000da':
      ['0262aaaaaa1f2f0000000fe7010000000000000000da06',
      '0250aaaaaaffffff2f2f00',
      '0251aaaaaaffffff112f0000010fe701aa01ffffff001c00ed']
    },
    {
      '0262aaaaaa1f2f0000000fdf010000000000000000e2':
      ['0262aaaaaa1f2f0000000fdf010000000000000000e206',
      '0250aaaaaaffffff2f2f00',
      '0251aaaaaaffffff112f0000010fdf010000000000000000e1']
    },
    {
      '02629999991f2f0000000fff010000000000000000c2':
      ['02629999991f2f0000000fff010000000000000000c206',
      '0250999999ffffff2f2f00',
      '0251999999ffffff112f0001010fff008201aaaaaaff1b001b']
    },
    {
      '02629999991f2f0000000ff7010000000000000000ca':
      ['02629999991f2f0000000ff7010000000000000000ca06',
      '0250999999ffffff2f2f00',
      '0251999999ffffff112f0001010ff700e201ffffff001c00a5']
    },
    {
      '02629999991f2f0000000fef010000000000000000d2':
      ['02629999991f2f0000000fef010000000000000000d206',
      '0250999999ffffff2f2f00',
      '0251999999ffffff112f0001010fef00a201ffffff001c00ed']
    },
    {
      '02629999991f2f0000000fe7010000000000000000da':
      ['02629999991f2f0000000fe7010000000000000000da06',
      '0250999999ffffff2f2f00',
      '0251999999ffffff112f0001010fe7000000000000000000d9']
    },
    {
      '02629999991f2f0000020fff080201aaaaaa000000b8':
      ['02629999991f2f0000020fff080201aaaaaa000000b806',
      '0250999999ffffff2f2f00']
    },
    {
      '0262aaaaaa1f2f0000020fff084201999999000000ab':
      ['0262aaaaaa1f2f0000020fff084201999999000000ab06',
      '0250aaaaaaffffff2f2f00']
    }];

    gw.connect(host, function (){
      gw.scene('aaaaaa', null, {remove: true}, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });


  it('creates a scene between two devices and the gateway', function (done) {
    var gw = new Insteon();

    mockData = [{
      '0260': '02601eb55203379c06'
    },
    {
      '0269':
      ['026906','0257e20126b1cc030e41']
    },
    {
      '026a':
      ['026a06','0257e20119d41c033041']
    },
    {
      '026a':
      ['026a06','0257e21426b1cc7f1900']
    },
    {
      '026a':
      ['026a06','0257a20126b1cc000000']
    },
    {
      '026a':
      ['026a06','0257e21419d41c7f1900']
    },
    {
      '026a':
      ['026a15','00000000000000000000']
    },
    {
      '026226b1cc1f2f0000000fff010000000000000000c2':
      ['026226b1cc1f2f0000000fff010000000000000000c206',
      '025026b1cc1eb5522f2f00',
      '025126b1cc1eb552112f0001010fff0082141eb5527f19006e']
    },
    {
      '026226b1cc1f2f0000000ff7010000000000000000ca':
      ['026226b1cc1f2f0000000ff7010000000000000000ca06',
      '025026b1cc1eb5522f2f00',
      '025126b1cc1eb552112f0001010ff700e2011eb552001c00a5']
    },
    {
      '026226b1cc1f2f0000000fef010000000000000000d2':
      ['026226b1cc1f2f0000000fef010000000000000000d206',
      '025026b1cc1eb5522f2f00',
      '025126b1cc1eb552112f0001010fef00a2011eb552001c00ed']
    },
    {
      '026226b1cc1f2f0000000fe7010000000000000000da':
      ['026226b1cc1f2f0000000fe7010000000000000000da06',
      '025026b1cc1eb5522f2f00',
      '025126b1cc1eb552112f0001010fe7000000000000000000d9']
    },
    {
      '026219d41c1f2f0000000fff010000000000000000c2':
      ['026219d41c1f2f0000000fff010000000000000000c206',
      '025019d41c1eb5522f2f00',
      '025119d41c1eb552112f0000010fff0182141eb5527f19006e']
    },
    {
      '026219d41c1f2f0000000ff7010000000000000000ca':
      ['026219d41c1f2f0000000ff7010000000000000000ca06',
      '025019d41c1eb5522f2f00',
      '025119d41c1eb552112f0000010ff701ea001eb552031c009b']
    },
    {
      '026219d41c1f2f0000000fef010000000000000000d2':
      ['026219d41c1f2f0000000fef010000000000000000d206',
      '025019d41c1eb5522f2f00',
      '025119d41c1eb552112f0000010fef01ea001eb552031c00a3']
    },
    {
      '026219d41c1f2f0000000fe7010000000000000000da':
      ['026219d41c1f2f0000000fe7010000000000000000da06',
      '025019d41c1eb5522f2f00',
      '025119d41c1eb552112f0000010fe701aa011eb552001c00ed']
    },
    {
      '026219d41c1f2f0000000fdf010000000000000000e2':
      ['026219d41c1f2f0000000fdf010000000000000000e206',
      '025019d41c1eb5522f2f00',
      '025119d41c1eb552112f0000010fdf010000000000000000e1']
    },
    {
      '026226b1cc1f2f0000020fe70882321eb5527f190060':
      ['026226b1cc1f2f0000020fe70882321eb5527f19006006',
      '025026b1cc1eb5522f2f00']
    },
    {
      '026f40c23226b1cc7f1900': '026f40c23226b1cc7f190006'
    },
    {
      '026219d41c1f2f0000020fdf0882321eb5527f190068':
      ['026219d41c1f2f0000020fdf0882321eb5527f19006806',
      '025019d41c1eb5522f2f00']
    },
    {
      '026f40c23219d41c7f1900': '026f40c23219d41c7f190006'
    }];

    gw.connect(host, function (){

      var responders = [{
        id: '26B1CC',
        level: 50, /* 100% */
        ramp: 6500 /* 2 sec */
      }, {
        id: '19D41C',
        level: 50, /* 100% */
        ramp: 6500 /* 2 sec */
      }];
      gw.scene('gw', responders, {group: 50}, function (err) {
        should.not.exist(err);
        done();
      });
    });
  });



  describe('Scene Control', function() {

    it('scene on', function(done) {
      var plan = new Plan(4, done);
      var gw = new Insteon();

      mockData = [{
        '0261821100':
        [
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

      gw.connect(host, function (){
        gw.sceneOn(130, function (err, report) {
          should.not.exist(err);
          should.exist(report);
          report.completed.should.ok;
          report.aborted.should.not.ok;
          plan.ok();
        });
      });
    });

    it('scene on fast', function(done) {
      var plan = new Plan(4, done);
      var gw = new Insteon();

      mockData = [{
        '0261851200':
        [
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

      gw.connect(host, function (){
        gw.sceneOnFast(133, function (err, report) {
          should.not.exist(err);
          should.exist(report);
          report.completed.should.ok;
          report.aborted.should.not.ok;
          plan.ok();
        });
      });
    });

    it('scene off', function(done) {
      var plan = new Plan(3, done);
      var gw = new Insteon();

      mockData = [{
        '0261851300':
        [
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

      gw.connect(host, function (){
        gw.sceneOff(133, function (err, report) {
          should.not.exist(err);
          should.exist(report);
          report.completed.should.ok;
          report.aborted.should.not.ok;
          plan.ok();
        });
      });
    });

    it('scene off fast', function(done) {
      var plan = new Plan(3, done);
      var gw = new Insteon();

      mockData = [{
        '0261851400':
        [
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

      gw.connect(host, function (){
        gw.sceneOffFast(133, function (err, report) {
          should.not.exist(err);
          should.exist(report);
          report.completed.should.ok;
          report.aborted.should.not.ok;
          plan.ok();
        });
      });
    });

    it('scene dim', function(done) {
      var plan = new Plan(3, done);
      var gw = new Insteon();

      mockData = [{
        '0261851500':
        [
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

      gw.connect(host, function (){
        gw.sceneDim(133, function (err, report) {
          should.not.exist(err);
          should.exist(report);
          report.completed.should.ok;
          report.aborted.should.not.ok;
          plan.ok();
        });
      });
    });

    it('scene brighten', function(done) {
      var plan = new Plan(3, done);
      var gw = new Insteon();

      mockData = [{
        '0261851600':
        [
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

      gw.connect(host, function (){
        gw.sceneBrighten(133, function (err, report) {
          should.not.exist(err);
          should.exist(report);
          report.completed.should.ok;
          report.aborted.should.not.ok;
          plan.ok();
        });
      });
    });


  }); // describe Scene Control


  describe('Queueing', function() {

    it('multiple commands', function(done) {
      var plan = new Plan(2, done);
      var gw = new Insteon();

      mockData = [{
        '026226ace10f1600':
        [
          '026226ace10f160006',
          '025026ace11eb5522f1600'
        ]
      },
      {
        '026226b1cc0f1500':
        [
          '026226b1cc0f150006',
          '025026b1cc1eb5522f1500'
        ]
      }];


      gw.connect(host, function (){
        gw.dim('26ace1', function (err) {
          should.not.exist(err);
          plan.ok();
        });
        gw.brighten('26b1cc', function (err) {
          should.not.exist(err);
          plan.ok();
        });
      });
    });

    it('multiple commands with timeout', function(done) {
      this.timeout(15000);

      var plan = new Plan(2, done);
      var gw = new Insteon();

      mockData = [
      {
        '026226b1cc0f1500':
        [
          '026226b1cc0f150006',
          '025026b1cc1eb5522f1500'
        ]
      }];


      gw.connect(host, function (){
        gw.dim('26ace1', function (err, status) {
          should.not.exist(err);
          should.not.exist(status.standard);
          plan.ok();
        });
        gw.brighten('26b1cc', function (err) {
          should.not.exist(err);
          plan.ok();
        });
      });
    });


  }); // describe Queueing


  describe('Thermostat Commands', function() {

    it('get temp', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926380f6a00':
        [
          '02622926380f6a0006',
          '02502926381eb5522f6a91'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638').temp(function (err, temp) {
          should.not.exist(err);
          temp.should.eql(72.5);
          done();
        });
      });
    });

    it('get humidity', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926380f6a60':
        [
          '02622926380f6a6006',
          '02502926381eb5522f6a30'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638').humidity(function (err, humidity) {
          should.not.exist(err);
          humidity.should.eql(48);
          done();
        });
      });
    });

    it('get setpoints', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926380f6a20':
        [
          '02622926380f6a2006',
          '02502926381eb5522f6a8a',
          '02502926381eb5520f6a94'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638').setpoints(function (err, setpoints) {
          should.not.exist(err);
          setpoints.should.containEql(69);
          setpoints.should.containEql(74);
          done();
        });
      });
    });

    it('get mode', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926380f6b02':
        [
          '02622926380f6b0206',
          '02502926381eb5522f6b03'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638').mode(function (err, mode) {
          should.not.exist(err);
          mode.should.eql('auto');
          done();
        });
      });
    });

    it('turn temp up', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926381f68040000000000000000000000000094':
        [
          '02',
          '622926381f6804000000000000000000000000009406',
          '02502926381eb5522f6804'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638')
        .tempUp(2)
        .then(function (status) {
          should.exist(status.response.standard);
        })
        .then(done, done);
      });
    });

    it('turn temp down', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926381f69040000000000000000000000000093':
        [
          '02622926381f6904000000000000000000000000009306',
          '02502926381eb5522f6904'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638')
        .tempDown(2)
        .then(function (status) {
          should.exist(status.response.standard);
        })
        .then(done, done);
      });
    });

    it('set heat temp', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926381f6d88000000000000000000000000000b':
        [
          '02',
          '622926381f6d88000000000000000000000000000b06',
          '02502926381eb5522f6d88'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638')
        .heatTemp(68)
        .then(function (status) {
          should.exist(status.response.standard);
        })
        .then(done, done);
      });
    });

    it('set cool temp', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926381f6c920000000000000000000000000002':
        [
          '02',
          '622926381f6c9200000000000000000000000000',
          '0206',
          '02502926381eb5522f6c92'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638')
        .coolTemp(73)
        .then(function (status) {
          should.exist(status.response.standard);
        })
        .then(done, done);
      });
    });

    it('set high humidity', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926381f2e00010b460000000000000000000080':
        [
          '02622926381f2e00010b46000000000000000000008006'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638')
        .highHumidity(70)
        .then(function (status) {
          status.ack.should.be.true;
        })
        .then(done, done);
      });
    });

    it('set low humidity', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926381f2e00010c2300000000000000000000a2':
        [
          '0262',
          '2926381f2e00010c2300000000000000000000a206'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638')
        .lowHumidity(35)
        .then(function (status) {
          status.ack.should.be.true;
        })
        .then(done, done);
      });
    });

    it('set backlight', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926381f2e0001051e00000000000000000000ae':
        [
          '02622926381f2e0001051e00000000000000000000ae06'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638')
        .backlight(30)
        .then(function (status) {
          status.ack.should.be.true;
        })
        .then(done, done);
      });
    });

    it('set cycle delay', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926381f2e0001060600000000000000000000c5':
        [
          '02622926381f2e0001060600000000000000000000c506'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638')
        .cycleDelay(6)
        .then(function (status) {
          status.ack.should.be.true;
        })
        .then(done, done);
      });
    });

    it('set energy mode change', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926381f2e0001070500000000000000000000c5':
        [
          '02622926381f2e0001070500000000000000000000',
          'c506'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638')
        .energyChange(5)
        .then(function (status) {
          status.ack.should.be.true;
        })
        .then(done, done);
      });
    });

    it('set date (day, hour, min, sec)', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926381f2e0202020e271b00000000000000a500':
        [
          '02622926381f2e0202020e271b00000000000000a50006'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638')
        .date(new Date(2014, 4, 6, 14, 39, 27, 0))
        .then(function (status) {
          status.ack.should.be.true;
        })
        .then(done, done);
      });
    });

    it('get details', function(done) {
      var gw = new Insteon();

      mockData = [
      {
        '02622926381f2e020000000000000000000000009296':
        [
          '02622926381f2e02000000000000000000000000929606',
          '02502926381eb5522f2e02',
          '02502926381eb5522f2e02',
          '02512926381eb552112e02010209232710493900e0804451b1'
        ]
      },
      {
        '02622926381f2e00000000000000000000000000636b':
        [
          '02622926381f2e00000000000000000000000000636b06',
          '02502926381eb5522f2e00',
          '02512926381eb552112e00000100e03901ff01001e06050000'
        ]
      },
      {
        '02622926381f2e000000010000000000000000009f3a':
        [
          '026229',
          '26381f2e000000010000000000000000009f3a06',
          '02502926381eb5522f2e00',
          '02512926381eb552112e0000010146230d494401000100d0f7'
        ]
      }];

      gw.connect(host, function (){
        gw.thermostat('292638')
        .details()
        .then(function (details) {
          details.mode.should.eql('auto');
          details.fan.should.be.false;
          details.date.should.eql({day:2, hour:9, minute:35, seconds:39});
          details.setpoints.should.eql({
            cool: 73,
            heat: 68,
            highHumidity: 70,
            lowHumidity: 35
          });

          details.humidity.should.eql(57);
          details.temperature.should.eql(72.32);
          details.cooling.should.be.false;
          details.heating.should.be.false;
          details.energySaving.should.be.false;
          details.hold.should.be.false;
          details.unit.should.eql('F');
          details.backlight.should.eql(30);
          details.delay.should.eql(6);
          details.energyOffset.should.eql(5);

        })
        .then(done, done);
      });
    });


  }); //discribe Thermostat Commands

});
