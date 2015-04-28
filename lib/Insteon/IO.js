var utils = require('./utils');

function IO(id, insteon) {
  this.id = id;
  this.insteon = insteon;
}

IO.prototype.on = function (port) {
  port = utils.toByte(port | 0);
  return this.insteon.directCommand(this.id, '45', port);
};

IO.prototype.off = function (port) {
  port = utils.toByte(port | 0);
  return this.insteon.directCommand(this.id, '46', port);
};

IO.prototype.set = function (data) {
  data = utils.toByte(data | 0);
  return this.insteon.directCommand(this.id, '48', data);
};


IO.prototype.cancelPending = function(port) {
  if(port !== null && port !== undefined) {
    port = utils.toByte(port | 0);
    var portMatch = new RegExp('^....' + this.id + '..4[5-6]' + port + '$');
    this.insteon.cancelPending(portMatch);
  } else {
    this.insteon.cancelPending(this.id);
  }
};

module.exports = IO;
