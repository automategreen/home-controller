var Q = require('q');
var events = require('events');
var util = require('util');
var debug = require('debug')('home-controller:insteon:iolinc');

function IOLinc(id, insteon) {
  this.id = id;
  this.insteon = insteon;

  this.emitOnAck = true;
}

util.inherits(IOLinc, events.EventEmitter);

IOLinc.prototype.relayOn = function (next) {
  var id = this.id;
  return this.insteon.directCommand(id, '11', 'FF', next);
};

IOLinc.prototype.relayOff = function (next) {
  var id = this.id;
  return this.insteon.directCommand(id, '13', next);
};


IOLinc.prototype.status = function(next) {

  var insteon = this.insteon;
  var id = this.id;

  var deferred = Q.defer();
  var stat = {};
  deferred.resolve(
    insteon.directCommand(id, '19', '00') // Relay status
    .then(function (status) {
      if(!status || !status.response || !status.response.standard) {
        debug('No response for IO Linc Relay request for device %s', id);
      } else {
        var relayStatus =  parseInt(status.response.standard.command2, 16);
        stat.relay = relayStatus === 0 ? 'off' : 'on';
      }
      return insteon.directCommand(id, '19', '01'); // Sensor status
    })
    .then(function (status) {
      if(!status || !status.response || !status.response.standard) {
        debug('No response for IO Linc Sensor request for device %s', id);
      } else {
        var sensorStatus =  parseInt(status.response.standard.command2, 16);
        stat.sensor = sensorStatus === 0 ? 'off' : 'on';
      }
      return stat;
    })
  );
  return deferred.promise.nodeify(next);
};


IOLinc.prototype.handleAllLinkBroadcast = function (group, cmd1, cmd2) {

  debug('Emitting BC command for device (%s) - group: %s, cmd1: %s, cmd2: %s', this.id, group, cmd1, cmd2);
  this.emit('command', group, cmd1, cmd2);

  switch (cmd1 + group) {
  case '110':
    this.emit('relayOn', group);
    break;
  case '111':
    this.emit('sensorOn', group);
    break;
  case '130':
    this.emit('relayOff', group);
    break;
  case '131':
    this.emit('sensorOff', group);
    break;
  default:
    debug('No event for command - %s', cmd1);
  }
};

IOLinc.prototype.handleAck = function (cmd1, cmd2) {

  if(!this.emitOnAck) {
    return;
  }

  debug('Emitting ACK command for device (%s) - cmd1: %s, cmd2: %s', this.id, cmd1, cmd2);

  this.emit('command', null, cmd1, cmd2);
  switch (cmd1) {
  case '11': // turnOn
    this.emit('relayOn');
    break;
  case '13': // turnOff
    this.emit('relayOff');
    break;
  default:
    debug('No event for command - %s', cmd1);
  }

};



IOLinc.prototype.cancelPending = function() {
  this.insteon.cancelPending(this.id);
};


module.exports = IOLinc;