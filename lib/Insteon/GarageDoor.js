//var utils = require('./utils');
var q = require('q');
var debug = require('debug')('home-controller:insteon:garage');
var util = require('util');
var events = require('events');


function GarageDoor(id, insteon) {
  this.id = id;
  this.insteon = insteon;
  this.isLockedOut = false;
  this.LOCKOUT_TIME = 15000; // 15 seconds
}

util.inherits(GarageDoor, events.EventEmitter);

GarageDoor.prototype.open = function () {
  return toggle(this, 'open');
};

GarageDoor.prototype.close = function () {
  return toggle(this, 'closed');
};

function toggle(self, state) {
  if (self.isLockedOut) {
    return q.fcall(function () { return false; });
  }

  self.isLockedOut = true;

  return self.status()
    .then(function (status) {
      if (status !== state) {
        self.emit(state === 'open' ? 'opening' : 'closing');

        setTimeout(function () {
          self.isLockedOut = false;
          self.emit(state);
        }, self.LOCKOUT_TIME);

        return self.insteon.directCommand(self.id, '11', 'ff')
          .then(function () {
            return true;
          });
      } else {
        self.isLockedOut = false;
        return q.fcall(function () { return false; });
      }
    });
}

GarageDoor.prototype.status = function () {
  return this.insteon.directCommand(this.id, '19', '01')
    .then(function (status) {
      if (!status || !status.response || !status.response.standard) {
        debug('No response for ramp rate request for device %s', this.id);
        return null;
      }

      if (parseInt(status.response.standard.command2)) {
        return 'closed';
      } else {
        return 'open';
      }
    });
};

GarageDoor.prototype.cancelPending = function () {
  this.insteon.cancelPending(this.id);
};

module.exports = GarageDoor;
