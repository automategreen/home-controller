var util = require('util');
var events = require('events');
var debug = require('debug')('home-controller:insteon:leak');

function Leak(id, insteon) {
  this.id = id;
  this.insteon = insteon;

  this.emitOnAck = true;
}

util.inherits(Leak, events.EventEmitter);


Leak.prototype.handleAllLinkBroadcast = function (group, cmd1, cmd2) {

  debug('Emitting BC command for device (%s) - group: %s, cmd1: %s, cmd2: %s', this.id, group, cmd1, cmd2);
  this.emit('command', group, cmd1, cmd2);

  switch (group) {
  case 1:
    this.emit('dry');
    break;
  case 2:
    this.emit('wet');
    break;
  case 4:
    this.emit('heartbeat');
    if(cmd1 === '11') {
      this.emit('dry');
    } else if (cmd1 === '13') {
      this.emit('wet');
    }
    break;
  default:
    debug('No event for command - %s, %s', cmd1, group);
  }
};


module.exports = Leak;