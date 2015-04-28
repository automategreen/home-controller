var util = require('util');
var Q = require('q');
var events = require('events');
// var debug = require('debug')('home-controller:insteon:meter');

function Meter(id, insteon) {
  this.id = id;
  this.insteon = insteon;
}

util.inherits(Meter, events.EventEmitter);

Meter.prototype.statusAndReset = function (next) {

  var meter = this;

  var deferred = Q.defer();

  deferred.resolve(
    meter.status()
    .then(function (details) {
      return meter.reset()
      .then(function () {
        return details;
      });
    })
  );

  return deferred.promise.nodeify(next);

};

Meter.prototype.reset = function (next) {
  var cmd = {
    cmd1: '80',
    cmd2: '00'
  };

  return this.insteon.directCommand(this.id, cmd, next);

};

Meter.prototype.status = function (next) {

  var cmd = {
    cmd1: '82',
    cmd2: '00',
    waitForExtended: true
  };

  var insteon = this.insteon;
  var id = this.id;


  var details = {};
  var data;

  var deferred = Q.defer();

  deferred.resolve(
    insteon.directCommand(id, cmd)
    .then(function (status) {
      data = status.response.extended.userData;

      if(parseInt(data[8], 16) >= 254){
        details.energy = 0;
      } else {
        details.energy = parseInt(data[8] + data[9] + data[10] + data[11], 16);
      }

      // Convert Accumulated Energy value into kW-h
      details.energy = details.energy* 65535 / (1000 * 60 * 60 * 60);

      // Watts
      details.power = parseInt(data[6] + data[7], 16);

      if(details.power > 32767){
        details.power = details.power - 65535;
      }
      return details;
    })

  );

  return deferred.promise.nodeify(next);

};

Meter.prototype.cancelPending = function() {
  this.insteon.cancelPending(this.id);
};

module.exports = Meter;
