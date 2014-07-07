var util = require('util');
var events = require('events');
var debug = require('debug')('home-controller:insteon:leak');

function Leak(id, insteon) {
  this.id = id;
  this.insteon = insteon;

  this.emitOnAck = true;
}

util.inherits(Leak, events.EventEmitter);



Leak.prototype.handleCommand = function (cmd) {
  if(!cmd || !cmd.standard || cmd.standard.id.toUpperCase() !== this.id.toUpperCase()) {
    debug('Ignoring invalid command or not from this device (%s) : ', this.id, cmd);
    return;
  }

  if(cmd.standard.messageType === 6 && cmd.standard.gatewayId.indexOf('0000') === 0){
    var group = parseInt(cmd.standard.gatewayId, 16);
    return this.handleAllLinkBroadcast(group, cmd.standard.command1, cmd.standard.command2);
  }

  debug('No event for command message type for device (%s) : ', this.id, cmd);
};

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
  case 3:
    this.emit('battery'); // No sure it this is supported
    break;
  case 4:
    this.emit('heartbeat');
    break;
  default:
    debug('No event for command - %s, %s', cmd1, group);
  }
};


module.exports = Leak;