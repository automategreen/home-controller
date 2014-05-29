var utils = require('./utils');
var Q = require('q');
var toByte = utils.toByte;
var debug = require('debug')('home-controller:insteon:light');

function Light(id, insteon) {
  this.id = id;
  this.insteon = insteon;
}



Light.prototype.turnOn = function (level, rate, next) {
  var id = this.id;
  if (typeof rate === 'function') {
    next = rate;
    rate = null;
  } else if (typeof level === 'function') {
    next = level;
    level = 100;
    rate = null;
  }
  if (rate !== null && rate !== undefined) {
    switch(rate) {
    case 'slow':
      rate = 47000;
      break;
    case 'fast':
      rate = 100;
      break;
    }

    var rampAndLevel = utils.levelToHexHalfByte(level) + utils.rampRateToHexHalfByte(rate);
    return this.insteon.directCommand(id, '2E', rampAndLevel, next);
  } else {
    return this.insteon.directCommand(id, '11', utils.levelToHexByte(level), next);
  }
};

/**
 * Turn Light On fast (no ramp) to pre saved level
 *
 * 12 -- ON FAST command
 *
 * @param  {String}   id
 * @param  {Function} next
 */
Light.prototype.turnOnFast = function (next) {
  return this.insteon.directCommand(this.id, '12', next);
};

/**
 * Turn Light Off
 *
 * 13 -- OFF command
 *
 * @param  {String}   id
 * @param  {Function} next
 */
Light.prototype.turnOff = function (rate, next) {
  var id = this.id;
  if (typeof rate === 'function') {
    next = rate;
    rate = null;
  }
  if (rate !== null && rate !== undefined) {
    switch(rate) {
    case 'slow':
      rate = 47000; // 47 sec in msec
      break;
    case 'fast':
      rate = 100; // .1 sec in msec
      break;
    }

    var rampAndLevel = '0' + utils.rampRateToHexHalfByte(rate);
    return this.insteon.directCommand(id, '2F', rampAndLevel, next);
  } else {
    return this.insteon.directCommand(id, '13', next);
  }
};


/**
 * Turn Light Off fast (no ramp)
 *
 * 13 -- OFF command
 *
 * @param  {String}   id
 * @param  {Function} next
 */
Light.prototype.turnOffFast = function (next) {
  return this.insteon.directCommand(this.id, '14', next);
};


/**
 * Brighten Light
 *
 * 15 -- Brighten command
 *
 * @param  {String}   id
 * @param  {Function} next
 */
Light.prototype.brighten = function (next) {
  return this.insteon.directCommand(this.id, '15', next);
};

/**
 * Dim Light
 *
 * 16 -- Dim command
 *
 * @param  {String}   id
 * @param  {Function} next
 */
Light.prototype.dim = function (next) {
  return this.insteon.directCommand(this.id, '16', next);
};


/**
 * Light Instant Change
 * Check for light level.
 *
 * 19 -- STATUS command
 *
 * 21 -- Instant Change command
 *
 * @param  {String}   id
 * @param  {Number}   level
 * @param  {Function} next
 */
Light.prototype.level = function (level, next) {
  if (typeof level === 'function') {
    next = level;
    level = null;
  }

  var id = this.id;

  if (level){
    return this.insteon.directCommand(id, '21', utils.levelToHexByte(level), next);
  } else {
    var deferred = Q.defer();
    deferred.resolve(
      this.insteon.directCommand(id, '19')
      .then(function (status) {

        if(!status || !status.response || !status.response.standard) {
          debug('No response for level request for device %s', id);
          return null;
        }

        var level = ~~ (parseInt(status.response.standard.command2, 16) * 100 / 255);
        return level;
      })
    );
    return deferred.promise.nodeify(next);
  }
};

Light.prototype.rampRate = function (btn, rate, next) {
  if (typeof btn === 'function') {
    next = btn;
    btn = 1;
    rate = null;
  } else if (typeof rate === 'function') {
    next = rate;
    rate = btn;
    btn = 1;
  }
  if(btn !== null && btn !== undefined && (rate === null || rate === undefined)) {
    rate = btn;
    btn = 1;
  }
  if(!btn) {
    btn = 1;
  }
  var id = this.id;

  var cmd = {cmd1: '2E', cmd2: '00', extended: true};

  btn = toByte(btn);

  if (rate) {
    cmd.userData = [btn, '05', utils.rampRateToHexByte(rate)];

    return this.insteon.directCommand(id, cmd, next);

  } else {

    cmd.userData = [btn];
    var deferred = Q.defer();
    deferred.resolve(
      this.insteon.directCommand(id, cmd)
      .then(function (status) {
        if(!status || !status.response || !status.response.extended) {
          debug('No response for ramp rate request for device %s', id);
          return null;
        }
        var rate = parseInt(status.response.extended.userData[6], 16);
        return utils.RAMP_RATES[rate];
      })
    );
    return deferred.promise.nodeify(next);
  }
};

Light.prototype.onLevel = function (btn, level, next) {
  if (typeof btn === 'function') {
    next = btn;
    btn = 1;
    level = null;
  } else if (typeof level === 'function') {
    next = level;
    level = btn;
    btn = 1;
  }
  var id = this.id;

  var cmd = {cmd1: '2E', cmd2: '00', extended: true};

  btn =toByte(btn);


  if (level) {
    cmd.userData = [btn, '06', utils.levelToHexByte(level)];

    return this.insteon.directCommand(id, cmd, next);

  } else {
    cmd.userData = [btn];

    var deferred = Q.defer();
    deferred.resolve(
      this.insteon.directCommand(id, cmd)
      .then(function (status) {
        if(!status || !status.response || !status.response.extended) {
          debug('No response for on level request for device %s', id);
          return null;
        }

        var rate = ~~ (parseInt(status.response.extended.userData[7], 16) * 100 / 255);
        return rate;
      })
    );
    return deferred.promise.nodeify(next);
  }
};


module.exports = Light;
