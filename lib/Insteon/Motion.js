var util = require('util');
var events = require('events');
var Q = require('q');
var debug = require('debug')('home-controller:insteon:motion');

var utils = require('./utils');
var toByte = utils.toByte;
var assignDefaults = utils.assignDefaults;

function Motion(id, insteon) {
  this.id = id;
  this.insteon = insteon;

  this.emitOnAck = true;
}

util.inherits(Motion, events.EventEmitter);

Motion.prototype.status = function(wait, next) {
  if(typeof wait === 'function') {
    next = wait;
    wait = true;
  }

  if(wait === null || wait === undefined) {
    wait = true;
  }

  var cmd = {
    cmd1: '2E',
    cmd2: '00',
    extended: true
  };

  var insteon = this.insteon;
  var id = this.id;


  var details = {};
  var data;

  var deferred = Q.defer();

  function status() {
    deferred.resolve(
      insteon.directCommand(id, cmd)
      .then(function (status) {
        data = status.response.extended.userData;

        details.ledLevel = parseInt(data[2], 16);
        details.clearTimer = (parseInt(data[3], 16) + 1) * 30; // secondes
        details.duskThreshold = Math.floor(parseInt(data[4], 16) * 100 / 255);

        var optionFlags = parseInt(data[5], 16);
        details.options = {
          occupancyMode: !!(optionFlags & 0x10),
          ledOn: !!(optionFlags & 0x08),
          nightMode: !(optionFlags & 0x04),
          onOnlyMode: !(optionFlags & 0x02)
        };

        var jumperFlags = parseInt(data[8], 16);
        details.jumpers = {
          j2: !(jumperFlags & 0x08),
          j3: !(jumperFlags & 0x04),
          j4: !(jumperFlags & 0x02),
          j5: !(jumperFlags & 0x01)
        };
        details.lightLevel = Math.floor(parseInt(data[10], 16) * 100 / 255);
        details.batteryLevel = parseInt(data[11], 16) / 10;

        return details;
      })
    );
  }

  if(wait) {
    this.once('command', status);
  } else {
    status();
  }

  return deferred.promise.nodeify(next);
};

Motion.prototype.setWaitCmd = function (wait, userData, next) {

  var insteon = this.insteon;

  var deferred = Q.defer();

  var id = this.id;


  var cmd = {
    cmd1: '2E',
    cmd2: '00',
    extended: true,
    isStandardResponse: true,
    userData: userData
  };


  function setOptions() {
    deferred.resolve(insteon.directCommand(id, cmd));
  }

  if(wait) {
    this.once('command', setOptions);
  } else {
    setOptions();
  }

  return deferred.promise.nodeify(next);
};

Motion.prototype.options = function (options, wait, next) {
  if(typeof options !== 'object') {
    next = wait;
    wait = options;
    options = null;
  }

  if(typeof wait === 'function') {
    next = wait;
    wait = true;
  }

  if(wait === null || wait === undefined) {
    wait = true;
  }

  var defaults = {
    occupancyMode: false,
    ledOn: true,
    nightMode: false,
    onOnlyMode: false
  };

  options = assignDefaults(defaults, options);

  var optionBytes = toByte(
    (options.occupancyMode ? 0x10 : 0) |
    (options.ledOn ? 0x08 : 0) |
    (options.nightMode ? 0 : 0x04) |
    (options.onOnlyMode ? 0 : 0x02)
  );



  var userData = ['00', '05', optionBytes];

  return this.setWaitCmd(wait, userData, next);

};



Motion.prototype.clearTimer = function(timeout, wait, next) {
  if(typeof timeout !== 'number') {
    next = wait;
    wait = timeout;
    timeout = 30; // default timeout
  }

  if(typeof wait === 'function') {
    next = wait;
    wait = true;
  }

  if(wait === null || wait === undefined) {
    wait = true;
  }

  timeout = Math.ceil((timeout / 30)) - 1;
  timeout = timeout < 0 ? 0 : timeout;

  timeout = toByte(timeout);

  var userData = ['00', '03', timeout];

  return this.setWaitCmd(wait, userData, next);
};

Motion.prototype.duskThreshold = function(threshold, wait, next) {
  if(typeof threshold !== 'number' && typeof threshold !== 'string') {
    next = wait;
    wait = threshold;
    threshold = 50; // default threshold
  }

  if(typeof wait === 'function') {
    next = wait;
    wait = true;
  }

  if(wait === null || wait === undefined) {
    wait = true;
  }

  if(threshold === 'alwaysDay') {
    threshold = 0;
  }

  if(threshold === 'alwaysNight') {
    threshold = 100;
  }

  if(typeof threshold === 'string') {
    threshold = 50; // default threshold
  }

  threshold = Math.ceil((threshold / 100 * 255));
  threshold = threshold < 0 ? 0 : threshold;
  threshold = threshold > 255 ? 255 : threshold;

  threshold = toByte(threshold);

  var userData = ['00', '04', threshold];

  return this.setWaitCmd(wait, userData, next);
};


Motion.prototype.handleAllLinkBroadcast = function (group, cmd1, cmd2) {

  debug('Emitting BC command for device (%s) - group: %s, cmd1: %s, cmd2: %s', this.id, group, cmd1, cmd2);
  this.emit('command', group, cmd1, cmd2);

  switch (group) {
  case 1:
    if(cmd1 === '11') {
      this.emit('motion');
    } else if(cmd1 === '13') {
      this.emit('clear');
    }
    break;
  case 2:
    if(cmd1 === '11') {
      this.emit('dusk');
    } else if(cmd1 === '13') {
      this.emit('dawn');
    }
    break;
  case 3:
    this.emit('battery');
    break;
  default:
    debug('No event for command - %s, %s', cmd1, group);
  }
};


Motion.prototype.cancelPending = function() {
  this.insteon.cancelPending(this.id);
};


module.exports = Motion;