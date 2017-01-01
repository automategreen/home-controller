var Q = require('q');
var utils = require('./utils');
var debug = require('debug')('home-controller:insteon:x10');
var toByte = utils.toByte;


var CODES = [0x6, 0xE, 0x2, 0xA, 0x1, 0x9, 0x5, 0xD, 0x7, 0xF, 0x3, 0xB, 0x0, 0x8, 0x4, 0xC];
var ON_CODE = 0x2;
var OFF_CODE = 0x3;


function X10(id, insteon) {
  this.id = id;
  this.house = id.substring(0,1);
  this.unit = id.substring(1);

  var houseCodeIndex = this.house.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
  var unitCodeIndex = parseInt(this.unit) - 1;

  this.houseCode = CODES[houseCodeIndex] << 4;
  this.unitCode = CODES[unitCodeIndex];

  this.unitCmd = {
    exitOnAck: true,
    raw: '0263' + toByte(this.houseCode + this.unitCode) + '00',
    id: this.id
  };

  this.insteon = insteon;
}
X10.prototype.turnOn = function (next) {
  return this.send(ON_CODE, next);
};

X10.prototype.turnOff = function (next) {
  return this.send(OFF_CODE, next);
};

X10.prototype.send = function(code, next) {
  var insteon = this.insteon;

  var cmd = {
    exitOnAck: true,
    raw: '0263' + toByte(this.houseCode + code) + '80',
    id: this.id
  };

  debug('sending x10 unit', this.unitCmd);

  var deferred = Q.defer();
  deferred.resolve(
    insteon.sendCommand(this.unitCmd)
    .then(function () {
      debug('sending x10 cmd', cmd);
      return insteon.sendCommand(cmd);
    })
  );

  return deferred.promise.nodeify(next);
};




X10.prototype.cancelPending = function() {
  this.insteon.cancelPending(this.id);
};


module.exports = X10;