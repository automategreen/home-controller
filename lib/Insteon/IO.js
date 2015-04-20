
function IO(id, insteon) {
  this.id = id;
  this.insteon = insteon;
}

IO.prototype.on = function (port) {
  return this.insteon.directCommand(this.id, '45', port);
};

IO.prototype.off = function (port) {
  return this.insteon.directCommand(this.id, '46', port);
};

IO.prototype.set = function (data) {
  return this.insteon.directCommand(this.id, '48', data);
};

module.exports = IO;
