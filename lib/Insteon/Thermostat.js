var utils = require('./utils');
var toByte = utils.toByte;
var convertTemp = utils.convertTemp;
var util = require('util');
var Q = require('q');
var events = require('events');
var debug = require('debug')('home-controller:insteon:thermostat');

function Thermostat(id, insteon) {
  this.id = id;
  this.insteon = insteon;
}

util.inherits(Thermostat, events.EventEmitter);

Thermostat.prototype.tempUp = function (change, next) {
  if(typeof change === 'function') {
    next = change;
    change = 1;
  }

  if(change === null || change === undefined) {
    change = 1;
  }

  change = toByte(change * 2);

  var cmd = {
    cmd1: '68',
    cmd2: change,
    extended: true,
    isStandardResponse: true
  };

  return this.insteon.directCommand(this.id, cmd, next);
};

Thermostat.prototype.tempDown = function (change, next) {
  if(typeof change === 'function') {
    next = change;
    change = 1;
  }

  if(change === null || change === undefined) {
    change = 1;
  }

  change = toByte(change * 2);

  var cmd = {
    cmd1: '69',
    cmd2: change,
    extended: true,
    isStandardResponse: true
  };

  return this.insteon.directCommand(this.id, cmd, next);

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

  var deferred = Q.defer();

  if(mode) {
    var modeCmd = MODE_CMDS[mode.toLowerCase()];
    if(!modeCmd) {
      deferred.reject(new Error(
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

    deferred.resolve(this.insteon.directCommand(this.id, cmd));

  }


  deferred.resolve(
    this.insteon.directCommand(this.id, '6B', '02')
    .then( function (status) {
      var mode = parseInt(status.response.standard.command2, 16);
      return MODES[mode];
    })
  );

  return deferred.promise.nodeify(next);

};



Thermostat.prototype.coolTemp = function (temp, next) {

  temp = toByte(temp * 2);

  var cmd = {
    cmd1: '6C',
    cmd2: temp,
    extended: true,
    isStandardResponse: true
  };


  return this.insteon.directCommand(this.id, cmd, next);

};

Thermostat.prototype.heatTemp = function (temp, next) {

  temp = toByte(temp * 2);

  var cmd = {
    cmd1: '6D',
    cmd2: temp,
    extended: true,
    isStandardResponse: true
  };

  return this.insteon.directCommand(this.id, cmd, next);

};

Thermostat.prototype.highHumidity = function (humidity, next) {
  var cmd = {
    cmd1: '2E',
    cmd2: '00',
    extended: true,
    exitOnAck: true,
    userData: ['01','0B', toByte(humidity)]
  };


  return this.insteon.directCommand(this.id, cmd, next);
};

Thermostat.prototype.lowHumidity = function (humidity, next) {
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

  if(typeof date === 'function') {
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
    this.status()
    .then(function (status) {
      details = status || {};
    }).
    then(function() {
      return insteon.directCommand(id, cmdDataSet00);
    })
    .then(function (status) {
      var response = ((status || {}).response || {}).extended || {};
      data = response.userData;
      if(!data) {
        return null;
      }

      details.backlight = parseInt(data[9], 16);
      details.delay = parseInt(data[10], 16);
      details.energyOffset = parseInt(data[11], 16);
    })
    .then( function () {
      return insteon.directCommand(id, cmdDataSet01);
    })
    .then(function (status) {
      var response = ((status || {}).response || {}).extended || {};
      data = response.userData;
      if(!data) {
        return null;
      }

      details.setpoints = details.setpoints || {};

      details.setpoints.highHumidity = parseInt(data[3], 16);
      details.setpoints.lowHumidity = parseInt(data[4], 16);

      return details;
    })

  );

  return deferred.promise.nodeify(next);

};


Thermostat.prototype.status = function (next) {

  var cmd02 = {
    cmd1: '2E',
    cmd2: '02',
    extended: true,
    crc: true
  };

  var insteon = this.insteon;
  var id = this.id;


  var details = {};
  var data;

  var deferred = Q.defer();

  deferred.resolve(
    insteon.directCommand(id, cmd02)
    .then(function (status) {
      var response = ((status || {}).response || {}).extended || {};
      data = response.userData;

      if(!data) {
        return null;
      }

      if(!response.crc) {
        return null;
      }

      details.date = {
        day: parseInt(data[1], 16),
        hour: parseInt(data[2], 16),
        minute: parseInt(data[3], 16),
        seconds: parseInt(data[4], 16)
      };

      var rawMode = parseInt(data[5], 16);
      var modes = ['off', 'auto', 'heat', 'cool', 'program'];

      details.mode = modes[rawMode >> 4];
      details.fan = !!(rawMode & 1);

      details.setpoints = {
        cool: convertTemp('F', insteon.defaultTempUnits, parseInt(data[6], 16)),
        heat: convertTemp('F', insteon.defaultTempUnits, parseInt(data[11], 16))
      };

      details.humidity = parseInt(data[7], 16);

      var tempC = parseInt(data[8] + data[9], 16) / 10;

      details.temperature = convertTemp('C', insteon.defaultTempUnits, tempC);

      var rawState = parseInt(data[10], 16);

      details.cooling = !!(rawState & 1);
      details.heating = !!((rawState >> 1) & 1);
      details.energySaving = !!((rawState >> 2) & 1);
      details.unit = ((rawState >> 3) & 1) ? 'C' : 'F';
      details.hold = !!((rawState >> 4) & 1);

      return details;
    })

  );

  return deferred.promise.nodeify(next);

};

Thermostat.prototype.monitor = function (enable, next) {
  if(enable === null || enable === undefined) {
    enable = true;
  }

  if(enable) {
    return this.insteon.scene(this.id, 'gw', {group: 0xFE}, next);
  }

  return this.insteon.scene(this.id, null, {group: 0xFE, remove: true}, next);

};

Thermostat.prototype.handleAllLinkBroadcast = function (group, cmd1) {

  this.emit('command', group, cmd1);

  switch(cmd1) {
  case '11':
    this.emit(['cooling', 'heating', 'highHumidity', 'lowHumidity'][group-1]);
    break;
  case '13':
    if(group === 3 || group === 4) {
      this.emit('normalHumidity');
    } else {
      this.emit('off');
    }
    break;
  default:
      debug('No event for command - %s', cmd1);
  }

};


Thermostat.prototype.cancelPending = function() {
  this.insteon.cancelPending(this.id);
};

module.exports = Thermostat;
