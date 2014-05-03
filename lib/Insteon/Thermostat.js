var utils = require('./utils');
var toByte = utils.toByte;
var convertTemp = utils.convertTemp;
var util = require('util');
var Q = require('q');
// var debug = require('debug')('home-controller:insteon:thermostat');

function Thermostat(id, insteon) {
  this.id = id;
  this.insteon = insteon;
}



Thermostat.prototype.tempUp = function (change, next) {
  if(typeof change === 'function') {
    next = change;
    change = 1;
  }

  change = toByte(change * 2);

  return this.insteon.directCommand(this.id, '68', change, next);
};

Thermostat.prototype.tempDown = function (change, next) {
  if(typeof change === 'function') {
    next = change;
    change = 1;
  }

  change = toByte(change * 2);

  return this.insteon.directCommand(this.id, '69', change, next);

};


Thermostat.prototype.info = function (type, divisor, zone, next) {
  if(typeof zone === 'function') {
    next = zone;
    zone = 0;
  }
  zone = zone || 0;

  var cmd2 = toByte(type << 5 | zone);

  var deferred = Q.defer();

  deferred.resolve(
    this.insteon.directCommand(this.id, '6A', cmd2)
    .then(function (status) {
      return parseInt(status.response.standard.command2, 16)/divisor;
    })
  );

  return deferred.promise.nodeify(next);

};

Thermostat.prototype.temp = function (zone, next) {
  return this.info(0, 2, zone, next);
};

Thermostat.prototype.setpoints = function (zone, next) {
  if(typeof zone === 'function') {
    next = zone;
    zone = 0;
  }
  if(!zone) {
    zone = 0;
  }

  var cmd2 = toByte(1 << 5 | zone);

  var deferred = Q.defer();

  deferred.resolve(
    this.insteon.directCommand(this.id, {cmd1: '6A', cmd2: cmd2, responseCount: 2})
    .then(function (status) {
      return status.response.standard.map(function (resp) {
        return parseInt(resp.command2, 16) / 2;
      });
    })
  );
  return deferred.promise.nodeify(next);
};

Thermostat.prototype.humidity = function (zone, next) {
  return this.info(3, 1, zone, next);
};


var MODES = [
  'off',
  'heat',
  'cool',
  'auto',
  'fan',
  'program',
  'program heat',
  'program cool',
  'fan auto'
];

var MODE_CMDS = {
  off: '09',
  heat: '04',
  cool: '05',
  auto: '06',
  fan: '07',
  'fan auto': '08',
  'program heat': '0A',
  'program cool': '0B',
  'program auto': '0C'
};

Thermostat.prototype.mode = function (mode, next) {
  if(typeof mode === 'function') {
    next = mode;
    mode = null;
  }
  if(mode) {
    var modeCmd = MODE_CMDS[mode.toLowerCase()];
    if(!modeCmd) {
      return next(new Error(
        'Invalthis.id mode.  Must be one of the following: ' +
        MODES.join(', ')
      ));
    }
    var cmd = {
      cmd1: '6B',
      cmd2: modeCmd,
      extended: true,
      exitOnAck: true
    };

    return this.insteon.directCommand(this.id, cmd, next);

  }

  var deferred = Q.defer();

  deferred.resolve(
    this.insteon.directCommand(this.id, '6B', '02')
    .then( function (status) {
      var mode = parseInt(status.response.standard.command2, 16);
      return MODES[mode];
    })
  );

  return deferred.promise.nodeify(next);

};


Thermostat.prototype.state = function (next) {

  var deferred = Q.defer();

  deferred.resolve(
    this.insteon.directCommand(this.id, '6B', '0E')
    .then(function (status) {
      var state = {};
      var s = parseInt(status.response.standard.command2, 16);
      state.cool  = (s & 1) > 0;
      state.heat = (s & 2) > 0;
      state.energy = (s & 4) > 0;
      state.unit = (s & 8) ? 'C' : 'F';
      state.hode = (s & 16) > 0;

      return state;
    })
  );

  return deferred.promise.nodeify(next);

};


Thermostat.prototype.coolTemp = function (temp, next) {

  temp = toByte(temp * 2);

  return this.insteon.directCommand(this.id, '6C', temp, next);

};

Thermostat.prototype.heatTemp = function (temp, next) {

  temp = toByte(temp * 2);

  return this.insteon.directCommand(this.id, '6D', temp, next);

};

Thermostat.prototype.highhumidity = function (humidity, next) {
  var cmd = {
    cmd1: '2E',
    cmd2: '00',
    extended: true,
    exitOnAck: true,
    userData: ['01','0B', toByte(humidity)]
  };


  return this.insteon.directCommand(this.id, cmd, next);
};

Thermostat.prototype.lowhumidity = function (humidity, next) {
  var cmd = {
    cmd1: '2E',
    cmd2: '00',
    extended: true,
    exitOnAck: true,
    userData: ['01','0C', toByte(humidity)]
  };


  return this.insteon.directCommand(this.id, cmd, next);

};

Thermostat.prototype.backlight  = function (delay, next) {
  var cmd = {
    cmd1: '2E',
    cmd2: '00',
    extended: true,
    exitOnAck: true,
    userData: ['01','05', toByte(delay)]
  };


  return this.insteon.directCommand(this.id, cmd, next);

};

Thermostat.prototype.cycleDelay  = function (delay, next) {
  var cmd = {
    cmd1: '2E',
    cmd2: '00',
    extended: true,
    exitOnAck: true,
    userData: ['01','06', toByte(delay)]
  };


  return this.insteon.directCommand(this.id, cmd, next);

};

Thermostat.prototype.energyChange  = function (change, next) {
  var cmd = {
    cmd1: '2E',
    cmd2: '00',
    extended: true,
    exitOnAck: true,
    userData: ['01','07', toByte(change)]
  };


  return this.insteon.directCommand(this.id, cmd, next);

};


Thermostat.prototype.date = function (date, next) {

  if(!next) {
    next = date;
    date = new Date();
  }

  if(!util.isDate(date)) {
    date = new Date(date);
  }

  var cmd = {
    cmd1: '2E',
    cmd2: '02',
    extended: true,
    exitOnAck: true,
    crc: true,
    userData: [
      '02',
      toByte(date.getDay()),
      toByte(date.getHours()),
      toByte(date.getMinutes()),
      toByte(date.getSeconds())
    ]
  };


  return this.insteon.directCommand(this.id, cmd, next);

};


Thermostat.prototype.details = function (next) {

  var cmd02 = {
    cmd1: '2E',
    cmd2: '02',
    extended: true,
    crc: true
  };

  var cmdDataSet00 = {
    cmd1: '2E',
    cmd2: '00',
    extended: true,
    crc: true
  };

  var cmdDataSet01 = {
    cmd1: '2E',
    cmd2: '00',
    extended: true,
    crc: true,
    userData: ['00', '00', '01']
  };

  var insteon = this.insteon;
  var id = this.id;


  var details = {};
  var data;

  var deferred = Q.defer();

  deferred.resolve(
    insteon.directCommand(id, cmd02)
    .then(function (status) {
      data = status.response.extended.userData;

      details.date = {
        day: parseInt(data[1], 16),
        hour: parseInt(data[2], 16),
        minute: parseInt(data[3], 16),
        seconds: parseInt(data[4], 16)
      };

      var rawMode = parseInt(data[5], 16);
      var modes = ['off', 'auto', 'heat', 'cool', 'program'];

      details.mode = modes[rawMode >> 4];
      details.fan = (rawMode & 1) === 1;

      details.setpoints = {
        cool: convertTemp('F', insteon.defaultTempUnits, parseInt(data[6], 16)),
        heat: convertTemp('F', insteon.defaultTempUnits, parseInt(data[11], 16))
      };

      details.humidity = parseInt(data[7], 16);

      var tempC = ((parseInt(data[8], 16) >> 8) + parseInt(data[9], 16)) / 10;

      details.tempature = convertTemp('C', insteon.defaultTempUnits, tempC);

      var rawState = parseInt(data[10], 16);

      details.cooling = rawState & 1 === 1;
      details.heeting = (rawState >> 1) & 1 === 1;
      details.energy = (rawState >> 2) & 1 === 1;
      details.unit = ((rawState >> 3) & 1) ? 'C' : 'F';
      details.hold = (rawState >> 4) & 1 === 1;

    }).
    then(function() {
      return insteon.directCommand(id, cmdDataSet00);
    })
    .then(function (status) {
      data = status.response.extended.userData;

      details.backlight = parseInt(data[9], 16);
      details.delay = parseInt(data[10], 16);
      details.energyOffset = parseInt(data[11], 16);
    })
    .then( function () {
      return insteon.directCommand(id, cmdDataSet01);
    })
    .then(function (status) {
      data = status.response.extended.userData;

      details.setpoints.highhumidity = parseInt(data[3], 16);
      details.setpoints.lowhumidity = parseInt(data[4], 16);

      return details;
    })

  );

  return deferred.promise.nodeify(next);

};


module.exports = Thermostat;
