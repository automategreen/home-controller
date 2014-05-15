'use strict';


var net = require('net');
var util = require('util');
var events = require('events');
var Q = require('q');
var serialport = require('serialport');


var debug = require('debug')('home-controller:insteon');

var utils = require('./utils');
var toByte = utils.toByte;
var DEV_CAT_NAMES = utils.DEV_CAT_NAMES;

var Light = require('./Light');
var Thermostat = require('./Thermostat');

var Insteon = function () {

  this.queue = [];
  this.buffer = '';
  this.commandTimeout = 5000; // default 5 second timeout
  this.commandRetries = 1;

  this.defaultTempUnits = Insteon.defaultTempUnits;

};


util.inherits(Insteon, events.EventEmitter);

Insteon.prototype.connect = function(host, port, connectListener) {

  var that = this;

  if(typeof port !== 'number') {
    connectListener = port;
    port = 9761;
  }

  this.host = host;
  this.port = port || 9761;
  debug('connecting', this.port, this.host);

  var socket = this.socket = new net.Socket();
  socket.setEncoding('hex');
  socket.setKeepAlive(true, 30000);


  socket.on('connect', function() {
    debug('connected');
    that.emit('connect');
  });

  socket.on('data', function(data) {
    debug('Rcvd:', Date.now(), data);
    that.buffer = that.buffer + data;
    that.checkStatus();
  });

  socket.on('error', function(err) {
    that.emit('error', err);
  });

  socket.on('close', function(had_error) {
    that.emit('close', had_error);
  });
  this.write = function(raw) { return this.socket.write(raw, 'hex'); };
  this.close = this.socket.end;

  this.socket.connect(this.port, this.host, connectListener);
};

Insteon.prototype.serial = function(comName, options, connectListener) {

  var that = this;

  if (typeof options === 'function') {
    connectListener = options;
    options = null;
  }
  if (!options) { options = { }; }
  if (typeof options.baudrate === 'undefined') { options.baudrate = 19200; }
  if (typeof options.databits === 'undefined') { options.databits = 8;     }
  if (typeof options.parity   === 'undefined') { options.parity = 'none';  }
  if (typeof options.stopbits === 'undefined') { options.stopbits = 1;     }
  options.parser = serialport.parsers.raw;

  this.comName = comName;
  this.options = options;
  debug('connecting', this.comName);

  this.socket = new serialport.SerialPort(comName, this.options).on('open', function() {
    debug('connected');
    that.emit('connect');
    if (!!connectListener) { connectListener(that.comName); }
  }).on('data', function(data) {
    data = data.toString('hex');
    debug('Rcvd:', Date.now(), data);
    that.buffer = that.buffer + data;
    that.checkStatus();
  }).on('error', function(err) {
    that.emit('error', err);
  }).on('close', function(had_error) {
    that.emit('close', had_error);
  });
  this.write = function(raw) { return that.socket.write(new Buffer(raw, 'hex')); };
  this.close = this.socket.close;

  this.socket.open();
};

/**************************************************************************
 * Command Functions
 **************************************************************************/



Insteon.prototype.sendCommand = function (cmd, timeout, next) {
  if (typeof timeout === 'function') {
    next = timeout;
    timeout = null;
  }
  if (typeof cmd === 'string') {
    cmd = {
      raw: '02' + cmd,
      type: cmd
    };
  }
  timeout = timeout || this.commandTimeout;

  var deferred = Q.defer();

  var status = {command: cmd, deferred: deferred, timeout: timeout};

  sendCommand(this, status);

  return deferred.promise.nodeify(next);
};

function sendCommand(gw, status) {
  if(!status) {
    return;
  }

  if(gw.status) {
    debug('Already running a command - queuing command: %j', cmd);
    return gw.queue.push(status);
  }

  var cmd = status.command;
  var timeout = status.timeout;
  gw.status = status;

  debug('Send: %j', status);

  setTimeout(function() { // slowing down writes reduces errors
    try {
      gw.write(status.command.raw);
    } catch (err) {
      debug('Error writing to socket', err);
      status.deferred.reject(err);
      delete gw.timeout;
      delete gw.status;
      return sendCommand(gw, gw.queue.shift());
    }
    gw.timeout = setTimeout(function() {
      sendCommandTimout(gw, timeout, gw.commandRetries);
    }, timeout);
  }, 10);

}

function sendCommandTimout(gw, timeout, retries) {
  var status = gw.status;
  debug('sendCommandTimout - status: %j', status);
  var resp = status.command.response;
  if(retries-- <= 0 || (resp && resp.standard && status.command.waitForExtended )) { // don't retry if we got a standard response
    delete gw.timeout;
    delete gw.status;
    status.deferred.resolve(status);
    sendCommand(gw, gw.queue.shift());
  } else {
    debug('Resend: %j', status);
    try {
      gw.write(status.command.raw);
    } catch (err) {
      debug('Error writing to socket', err);
      status.deferred.reject(err);
      delete gw.timeout;
      delete gw.status;
      return sendCommand(gw, gw.queue.shift());
    }
    gw.timeout = setTimeout(function() {
      sendCommandTimout(gw, timeout, retries);
    }, timeout);
  }
}


Insteon.prototype.directCommand = function (id, cmd, param, timeout, next) {
  if (typeof param === 'function') {
    next = param;
    param = '00';
  } else if (typeof timeout === 'function') {
    next = timeout;
    timeout = null;
  }
  if (typeof param === 'number') {
    timeout = param;
    param = '00';
  }
  if(!param) {
    param = '00';
  }
  if (typeof cmd === 'string') {
    cmd = {
      cmd1: cmd,
      cmd2: param
    };
  }

  id = id || '';
  id = id.trim().replace('.', '');

  if(!/^[0-9a-fA-F]{6}$/.test(id)) {
    var msg = 'Invalid Insteon ID - ' + id;
    debug(msg);
    var deferred = Q.defer();
    deferred.reject(new Error(msg));
    return deferred.promise.nodeify(next);
  }

  var type = cmd.type = '62';
  var userData = '';
  var flags = '0F'; // standard command
  if (cmd.extended) {
    flags = '1F';
    var pad = '0000000000000000000000000000';
    userData = (cmd.userData ? cmd.userData.join('') : '');
    userData = userData.substring(0, pad.length);
    userData = userData + pad.substring(0, pad.length - userData.length);

    // create checksum for i2cs devices
    var fullCmd = cmd.cmd1 + cmd.cmd2 + userData;
    if(cmd.crc) {
      userData = userData.substring(0, pad.length - 4) + genCrc(fullCmd);
    } else {

      var checksum = 0;
      fullCmd.match(/.{1,2}/g).forEach(function(b) {
        checksum += parseInt(b, 16);
      });

      checksum = ((~checksum) + 1) & 255;
      cmd.checksum = checksum;
      userData = userData.substring(0, pad.length - 2) + toByte(checksum);
    }
  }

  cmd.raw = '02' + type + id + flags + cmd.cmd1 + cmd.cmd2 + userData;
  cmd.id = id;

  return this.sendCommand(cmd, timeout, next);

};

function genCrc (cmd) {
  var crc = 0;
  cmd.substring(0, 28).match(/.{1,2}/g).forEach(function(byte) {
    byte = parseInt(byte, 16);
    for(var bit = 0; bit < 8; bit++) {
      var fb = byte & 1;
      fb = (crc & 0x8000) ? fb ^ 1 : fb;
      fb = (crc & 0x4000) ? fb ^ 1 : fb;
      fb = (crc & 0x1000) ? fb ^ 1 : fb;
      fb = (crc & 0x0008) ? fb ^ 1 : fb;
      crc = (crc << 1) & 0xFFFF | fb;
      byte = byte >> 1;
    }
  });
  return toByte(crc, 2);
}


Insteon.prototype.checkStatus = function () {
  var raw = this.buffer;
  debug('checkStatus - buffer: %s', raw);
  var status = this.status;
  debug('checkStatus - status: %j', status);

  var cmd;
  if(raw.length <= 2) {
    return; // buffering
  }

  var nextCmdAt = raw.substr(2).search(/02(5[0-8]|6[0-9a-f]|7[0-3])/i);
  if(nextCmdAt > 0) {
    this.buffer = raw.substr(nextCmdAt+2);
  }

  var type = raw.substr(0, 4);

  var msgType;
  switch(type.toUpperCase()) {
  case '0250': // Standard Command
    debug('checkStatus - Standard Command');
    if(raw.length < 22) {
      return; // still buffering
    }
    this.buffer = raw.substr(22);
    cmd = parseRecieved(raw);
    debug('Parsed command: %j', cmd);
    debug('Status: %j', status);
    msgType = cmd.standard.messageType;
    if(!status || !status.command || !status.command.id ||
      (status.command.id.toUpperCase() !== cmd.standard.id.toUpperCase())) { // command isn't a response for a command we sent
      this.emit('command', cmd);
      break;
    }
    if(!status.response) {
      status.response = {};
    }
    var responseCount = status.command.responseCount;
    if(responseCount) {
      status.response.standard = status.response.standard || [];
      status.response.standard.push(cmd.standard);
      status.success = status.response.standard.length === responseCount;
    } else {
      status.response.standard = cmd.standard;
      status.success = cmd.standard !== undefined && cmd.standard !== null &&
        (!status.command.extended || status.command.isStandardResponse) &&
        !status.command.waitForExtended && !status.command.waitForLinking;
    }

    break;
  case '0251': // Extended Command
    debug('checkStatus - Extended Command');
    if(raw.length < 50) {
      return; // still buffering
    }
    this.buffer = raw.substr(50);
    cmd = parseRecieved(raw);
    debug('Parsed command: %j', cmd);
    debug('Status: %j', status);
    msgType = cmd.extended.messageType;
    if(!status ||
      status.command.id.toUpperCase() !== cmd.extended.id.toUpperCase()) { // command isn't a response for a command we sent
      this.emit('command', cmd);
      break;
    }
    if(!status.response) {
      status.response = {};
    }
    status.response.extended = cmd.extended;
    status.success = cmd.extended !== undefined && cmd.extended !== null;
    break;
  case '0253': // Link Command
    debug('checkStatus - Link Command');
    if(raw.length < 20) {
      return; // still buffering
    }
    this.buffer = raw.substr(20);
    cmd = parseRecieved(raw);
    if(!status) {
      this.emit('command', cmd);
      break;
    }
    if(!status.response) {
      status.response = {};
    }
    status.response.link = cmd.link;
    status.success = cmd.link !== undefined && cmd.link !== null;
    break;
  case '0257'://
    debug('checkStatus - Link Record Command');
    if(raw.length < 20) {
      return; // still buffering
    }
    if(!status) {
      return;
    }
    this.buffer = raw.substr(20);
    status.response = {};
    status.response.raw = raw;
    status.response.type = raw.substr(2, 2);
    status.response.link = parseLinkRecord(raw.substr(4,16));
    status.success = true;
    break;
  case '0258'://
    debug('checkStatus - ALL-Link Cleanup Status Report');
    if(raw.length < 6) {
      return; // still buffering
    }
    if(!status) {
      return;
    }
    this.buffer = raw.substr(6);
    status.report = {
      completed: raw.substr(4, 2) === '06',
      aborted: raw.substr(4, 2) === '15'
    };
    status.success = true;
    break;
  case '0260': // Get IM Info
    debug('checkStatus - Get IM Info Command');
    if(raw.length < 18) {
      return; // still buffering
    }
    if(!status) {
      return;
    }
    this.buffer = raw.substr(18);
    status.ack =raw.substr(16, 2) === '06';
    status.nack =raw.substr(16, 2) === '15';
    status.response = parseGetInfo(raw.substr(0,16));
    status.success = true;
    break;
  case '0261': // ALL-Link Command
    debug('checkStatus - ALL-Link Command');
    if(raw.length < 10) {
      return; // still buffering
    }
    if(!status) {
      this.buffer = raw.substr(10);
      break; // TODO: this.emit('command', parsedCmd);
    }
    if(raw.length < 12) {
      return; // still buffering
    }

    this.buffer = raw.substr(12);
    status.ack =raw.substr(10, 2) === '06';
    status.nack =raw.substr(10, 2) === '15';
    break;
  case '0262':
    debug('checkStatus - Direct Command');
    if(raw.length < status.command.raw.length + 2) {
      return; // still buffering
    }
    this.buffer = raw.substr(status.command.raw.length + 2);
    if(!status) {
      break; // TODO: this.emit('command', parsedCmd);
    }
    status.ack = raw.substr(status.command.raw.length, 2) === '06';
    status.nack = raw.substr(status.command.raw.length, 2) === '15';
    break;
  case '0264':
    if(!status) {
      return;
    }
    if(raw.length < 10) {
      return; // still buffering
    }
    this.buffer = raw.substr(10);
    status.ack = raw.substr(8, 2) === '06';
    status.nack = raw.substr(8, 2) === '15';
    status.success = !status.command.waitForLinking;
    break;
  case '0265':
    if(!status) {
      return;
    }
    if(raw.length < 6) {
      return; // still buffering
    }
    this.buffer = raw.substr(6);
    status.ack =raw.substr(4, 2) === '06';
    status.nack =raw.substr(4, 2) === '15';
    status.success = true;
    break;
  case '0269':
  case '026A':
    if(!status) {
      return;
    }
    if(raw.length < 6) {
      return; // still buffering
    }
    this.buffer = raw.substr(6);
    status.ack =raw.substr(4, 2) === '06';
    status.nack =raw.substr(4, 2) === '15';
    break;
  case '026F':
    if(!status) {
      return;
    }
    if(raw.length < 24) {
      return; // still buffering
    }
    this.buffer = raw.substr(24);
    status.ack =raw.substr(22, 2) === '06';
    status.nack =raw.substr(22, 2) === '15';
    status.command.code = raw.substr(4, 2);
    if(status.command.code !== '00' && status.command.code !== '01') {
      status.success = status.ack;
    }
    break;
  default:
    if(this.buffer.length > raw.length) {
      this.buffer = this.buffer.substr(raw.length);
    } else {
      this.buffer = '';
    }
  }
  debug('checkStatus - status (after parsing): %j', status);
  if(status) {
    if(status.command.exitOnAck) {
      status.success = status.ack;
    }
    if(status.nack || (status.success && status.ack)) {
      if(this.timeout) {
        clearTimeout(this.timeout);
        delete this.timeout;
      }
      delete this.status;
      status.deferred.resolve(status);
      sendCommand(this, this.queue.shift());

    }
  }
  if(this.buffer.length > 2) { // needs to be at least a full command
    this.checkStatus();
  }
};

function parseRecieved(raw) {
  var resp = {};
  var type;
  while((type = /^02(5[013])/.exec(raw))) {
    if (type[1] === '51') {
      resp.extended = parseMessageRecieved(raw);
      raw = raw.substr(resp.extended.raw.length);
    } else if (type[1] === '50') {
      resp.standard = parseMessageRecieved(raw);
      raw = raw.substr(resp.standard.raw.length);
    } else {
      resp.link = parseLinkingComplete(raw);
      raw = raw.substr(resp.link.raw.length);
    }
  }
  return resp;
}

function parseMessageRecieved(raw) {
  var cmd = {};
  cmd.type = raw.substr(2, 2);
  if (cmd.type !== '51' && cmd.type !== '50') {
    return null;
  }
  cmd.id = raw.substr(4, 6);
  cmd.gatewayId = raw.substr(10, 6);
  var typeFlag = parseInt(raw.substr(16, 1), 16);
  cmd.extended = typeFlag & 1 !== 0; // bit mask 0001
  cmd.messageType =  typeFlag >> 1;
  var hopFlag = parseInt(raw.substr(17, 1), 16);
  cmd.hopsLeft = hopFlag >> 2;
  cmd.maxHops = hopFlag & 3; // bit mask 0011
  cmd.command1 = raw.substr(18, 2);
  cmd.command2 = raw.substr(20, 2);

  if (cmd.extended) {
    cmd.userData = [];
    for(var i = 0; i < 14; i++) {
      cmd.userData.push(raw.substr(22+(i*2), 2));
    }
    cmd.raw = raw.substr(0, (25*2));
  } else {
    cmd.raw = raw.substr(0, (11*2));
  }
  return cmd;
}

function parseGetInfo(raw) {
  var resp = {};
  resp.raw = raw;
  resp.type = raw.substr(2, 2);
  resp.id = raw.substr(4, 6);
  resp.deviceCategory = { id: parseInt(raw.substr(10, 2), 16) };
  resp.deviceCategory.name = DEV_CAT_NAMES[resp.deviceCategory.id];
  resp.deviceSubcategory = { id: parseInt(raw.substr(12, 2), 16) };
  resp.firmwareVersion = raw.substr(14, 2);
  return resp;
}


function parseLinkRecord(raw) {
  var link = {};
  var flags = parseInt(raw.substr(0, 2), 16);
  link.controller = (flags & 64) !== 0;  // bit mask 0100 0000
  link.isInUse = (flags & 128) !== 0;  // bit mask 1000 0000
  link.hasBeenUsed = (flags & 2) !== 0;  // bit mask 0000 0010
  link.isLast = flags === 0;
  link.group = parseInt(raw.substr(2, 2), 16);
  link.id = raw.substr(4, 6);
  link.data = [raw.substr(10, 2), raw.substr(12, 2), raw.substr(14, 2)];
  return link;
}

function parseLinkingComplete(raw) {
  var r = /^02(53)(\w{2})(\w{2})(\w{6})(\w{2})(\w{2})(\w{2})/.exec(raw);
  if (!r) { return {}; }
  var devCatId = parseInt(r[5], 16);
  return {
    raw: r[0],
    type: r[1],
    controller: r[2] === '01',
    wasDeleted: r[2].toUpperCase() === 'FF',
    group: parseInt(r[3], 16),
    id: r[4],
    deviceCategory: {
      id: devCatId,
      name: DEV_CAT_NAMES[devCatId]
    },
    deviceSubcategory: {id: parseInt(r[5], 16)},
    firmwareVersion: r[6]
  };
}




/**************************************************************************
 * Linking Functions
 **************************************************************************/

/**
 * link or unlink a device(s) to the gateway
 *
 * options object:
 * {
 *   controller: Boolean
 *   group: Number,
 *   timeout: Number,
 *   unlink: Boolean
 * }
 *
 * default values:
 * {
 *   controller: false,
 *   group: 1, // contoller group/button
 *   timeout: 30 // 30 secondes to press set button - hurry up
 *   unlink: false
 * }
 *
 *
 *
 * @param  {String|Array}   device
 * @param  {Object}         options
 * @param  {Function}       next
 */
Insteon.prototype.link = function () {
  var args = Array.prototype.slice.call(arguments);
  return link.apply(null, [this, false, null].concat(args));
};

/**
 * Unlink a device from the gateway.
 *
 * @param  {String}         controller
 * @param  {String|Array}   responder
 * @param  {Object}         options
 * @param  {Function}       next
 */
Insteon.prototype.unlink = function () {
  var args = Array.prototype.slice.call(arguments);
  return link.apply(null, [this, true, null].concat(args));
};

function link(gw, unlink, links, device, options, next) {

  if (typeof options === 'function') {
    next = options;
    options = null;
    if (!Array.isArray(device) && typeof device === 'object') {
      options = device;
      device = null;
    }
  } else if (typeof device === 'function') {
    next = device;
    device = null;
  }
  var defaults = {
    controller: false,
    group: 1,
    timeout: 30000,  // only used for manual linking (i.e. waiting for set button)
    unlink: unlink
  };

  options = utils.assignDefaults(defaults, options);

  debug('link options: %j', options);

  var gwCmd = {
    type: '64',
    group: options.group,
    waitForLinking: !device,
    raw: (
      options.unlink ? '0264FF' : (
        options.controller ?  '026400'  : '026401')
      ) + toByte(options.group)
  };

  var allLinkCmd = {
    cmd1: options.unlink ? '0A' :'09',
    cmd2: '00',
    extended: !options.unlink,
    waitForLinking: true
  };


  var deferred = Q.defer();

  if (options.controller) {
    // Make sure all linkng is cancel before trying to create a link
    deferred.resolve(
      gw.cancelLinking()
      .then(function () {
        if(device) { // device is controller
          if(Array.isArray(device)){
            device = device.pop(); // When device is controller only one device supported
          }
          allLinkCmd.cmd2 = toByte(options.group);
          allLinkCmd.isStandardResponse = true;

          return sendLinkCommand(gw, gwCmd)
          .then(function () {
            return gw.directCommand(device, allLinkCmd);
          })
          .then(function (status) {
            if(status.response) {
              return status.response.link;
            } else {
              return null;
            }
          });
        } else { // unknown device is controller - press set button prior to calling function
          return sendLinkCommand(gw, gwCmd);
        }
      })
    );
  } else { // gw is contoller
    if (device) {
      deferred.resolve(
        linkResponders(gw, links, device, gwCmd, allLinkCmd)
      );
    } else { // unknown device is responder -- press set button
      // Make sure all linkng is cancel before trying to create a link
      deferred.resolve(
        gw.cancelLinking()
        .then(function (){
          return sendLinkCommand(gw, gwCmd, options.timeout);
        })

      );
    }
  }
  return deferred.promise.nodeify(next);
}

function sendLinkCommand(gw, cmd, timeout) {
  debug('sendLinkCommand: %j', cmd);
  return gw.sendCommand(cmd, timeout)
  .then(function (status) {
    if(status.response) {
      return status.response.link;
    } else {
      return null;
    }
  });
}

function linkResponders(gw, links, devices, gwCmd, allLinkCmd) {
  debug(
    'linkResponders - links: %j, devices: %j, gwCmd: %j, allLinkCmd: %j',
    links, devices, gwCmd, allLinkCmd
  );
  var responder;
  if (!Array.isArray(devices)) {
    responder = devices;
    devices = [];
  } else {
    links = links || [];
    responder = devices.shift();
  }
  // Make sure all linkng is cancel before trying to create a link
  return gw.cancelLinking()
  .then(function () {
    gwCmd.exitOnAck = true;
    return gw.sendCommand(gwCmd);
  })
  .then(function (gwStatus) {
    if (!gwStatus.ack) {
      debug('linkResponders - gwStatus: %j', gwStatus);
      return null;
    }
    allLinkCmd.waitForLinking = true;

    return gw.directCommand(responder, allLinkCmd)
    .then(function (status) {
      if (!status) {
        return null;
      }
      if (devices.length === 0) {
        if (links) {
          if(status.response) {
            links.push(status.response.link);
          }
          return links;
        } else {
          if(status.response) {
            return status.response.link;
          } else {
            return null;
          }
        }
      } else {
        if(status.response) {
          links.push(status.response.link);
        }
        return linkResponders(gw, links, devices,  gwCmd, allLinkCmd);
      }
    });
  });
}


/**
 * Cancel linking/unlinking
 *
 * @param  {Function} next
 */
Insteon.prototype.cancelLinking = function (next) {
  debug('insteon.cancelLinking');
  return this.sendCommand('65', next);
};

/**
 * Gets the links of a device or the gateway.  Links are returned in the
 * callback as an Array of link Objects.
 *
 * @param  {String}   id
 * @param  {Function} next
 */
Insteon.prototype.links = function (id, next) {
  if (typeof id === 'function') {
    next = id;
    id = null;
  }
  debug('insteon.links - id: %j', id);
  if (id && id.length === 6) {
    return this.linkAt(id, 4095, [], next); // start at 0xFFF (4095)
  } else {
    return this.firstLink([], next);
  }
};

/**
 * Gets the first link record on the gateway.
 *
 * If links Array is provided, the function will add all links recursivly to
 * the links Array.
 *
 * @param  {Array}   links
 * @param  {Function} next
 */
Insteon.prototype.firstLink = function (links, next) {
  if (typeof links === 'function') {
    next = links;
    links = null;
  }
  var insteon = this;

  var deferred = Q.defer();
  deferred.resolve(
    insteon.sendCommand('69')
    .then(function (status) {
      if (status.ack) {
        if (links && status.response) {
          return insteon.nextLink([status.response.link]);
        } else {
          if(status.response) {
            return status.response.link;
          } else {
            return null;
          }
        }
      } else {
        return links;
      }
    })
  );
  return deferred.promise.nodeify(next);

};

/**
 * Gets the next link record on the gateway.
 *
 * If links Array is provided, the function will add all links recursivly to
 * the links Array.
 *
 * @param  {Array}   links
 * @param  {Function} next
 */
Insteon.prototype.nextLink = function (links, next) {
  if (typeof links === 'function') {
    next = links;
    links = null;
  }
  var insteon = this;

  var deferred = Q.defer();
  deferred.resolve(
    insteon.sendCommand('6A')
    .then(function (status) {
      if (status.ack) {
        if (links && status.response) {
          links.push(status.response.link);
          return insteon.nextLink(links);
        } else {
          if(status.response) {
            return status.response.link;
          } else {
            return null;
          }
        }
      } else {
        return links;
      }
    })
  );
  return deferred.promise.nodeify(next);
};

/**
 * Gets the link at a memory address on a device.
 *
 * If links Array is provided, the function will add all links recursivly to
 * the links Array.
 *
 * @param  {String}   id
 * @param  {Number}   at
 * @param  {Array}   links (optional)
 * @param  {Function} next
 */
Insteon.prototype.linkAt = function (id, at, links, next) {
  if (typeof links === 'function') {
    next = links;
    links = null;
  }
  var insteon = this;

  var cmd = {cmd1: '2F', cmd2: '00', extended: true};

  cmd.userData = ['00', '00', toByte(at, 2), '01'];


  var deferred = Q.defer();
  deferred.resolve(
    this.directCommand(id, cmd)
    .then(function (status) {
      if (status.ack && status.response && status.response.extended) {
        var data = status.response.extended.userData;
        var rawLink = data[5] + data[6] + data[7] + data[8] + data[9] + data[10] + data[11] + data[12];
        var link = parseLinkRecord(rawLink);
        link.at = parseInt(data[2] + data[3], 16);

        if (link.isLast) {
          return links;
        }
        if (links) {
          links.push(link);
          return insteon.linkAt(id, at-8, links);
        } else {
          return link;
        }
      } else {
        return links;
      }
    })
  );
  return deferred.promise.nodeify(next);
};

Insteon.prototype.writeLinkData = function(id, at, link, next) {
  if (typeof link === 'object' && at) {
    link.at = at;
  }
  if (typeof link === 'function' || !link) {
    next = link;
    link = at;
    if(typeof id === 'number') {
      link.at = id;
      id = 'gw';
    }
  }
  if (typeof at === 'function' || !at) {
    link = id;
    next = at;
    id = 'gw';
  }


  debug('writeLinkData - id: %s, link: %j', id, link);

  /*in use (bit 7), controller (6), and used (1) */
  var ctrlBits = 1 << 1;

  // update (0x20), add controller (0x40), add responder (0x41), delete (0x80)
  var code = '41';

  if(link.controller){
    ctrlBits |= 1 << 6;
    code = '40';
  }

  if(link.remove) {
    code = '80';
  } else {
    ctrlBits |= 1 << 7;
  }


  if(id === 'gw') {
    var manageLinkRecordCmd = {
      type: '6F', /*Manage ALL-Link Record*/
      code: code,
      raw: '026F'+ code + ctrlBits + toByte(link.group) + link.id + link.data.join('')
    };
    var insteon = this;
    var deferred = Q.defer();

    deferred.resolve(
      insteon.sendCommand(manageLinkRecordCmd)
      .then(function (status) {
        if(status.ack || link.remove) {
          return status;
        }
        // Try update since add failed with NACK (already exists)
        code = '20';
        manageLinkRecordCmd = {
          type: '6F', /*Manage ALL-Link Record*/
          code: code,
          raw: '026F'+ code + ctrlBits +
               toByte(link.group) + link.id + link.data.join('')
        };

        return insteon.sendCommand(manageLinkRecordCmd);
      })
    );
    return deferred.promise.nodeify(next);
  } else {
    var cmd = {cmd1: '2F', cmd2: '00', extended: true};

    cmd.userData = [
      '00',
      '02', /* write */
      toByte(link.at, 2),
      '08', /* length */
      toByte(ctrlBits), /* control bits*/
      toByte(link.group),
      link.id];
    cmd.userData = cmd.userData.concat(link.data);
    cmd.isStandardResponse = true;

    return this.directCommand(id, cmd, next);
  }
};

Insteon.prototype.scene = function (controller, responders, options, next) {
  if (typeof options === 'function') {
    next = options;
    options = {};
  }
  options = options || {};

  utils.assignDefaults({group: 1}, options);

  responders = responders || [];

  if(!Array.isArray(responders)) {
    responders = [responders];
  }
  if(typeof controller === 'string') {
    controller =  {id: controller};
  }
  controller.controller = true;

  var devices = [controller];

  responders.forEach(function (responder, i, arr) {
    if(typeof responder === 'string') {
      responder = {id: responder};
    }

    if(!responder.data || !Array.isArray(responder.data)) {
      responder.data = ['00', '00', '00'];
    }
    while(responder.data.length < 3){
      responder.data.push('00');
    }
    if(responder.level) {
      responder.data[0] = utils.levelToHexByte(responder.level);
    }
    if(responder.ramp) {
      responder.data[1] = utils.rampRateToHexByte(responder.ramp);
    }

    arr[i] = responder;
    devices.push(responder);
  });

  var gw = this;

  var updateList = [];
  var addList = [];
  var removeList = [];

  var deferred = Q.defer();
  deferred.resolve(
    gw
    .info()
    .then(function (info) {
      gw.id = info.id;
      gw.info = info;

      return loadLinks(gw, devices);
    })
    .then(function () {

      var current = [];
      controller.links.forEach(function (link) {
        if(link.group === options.group && link.controller && link.isInUse) {
          current.push(link.id);
        }
      });

      var r;
      while(r = responders.pop()) {
        var i = current.indexOf(r.id);
        if(i >= 0) {
          updateList.push(r);
          current.splice(i, 1);
        } else {
          addList.push(r);
        }
      }

      current.forEach(function (id) {
        removeList.push({id: id});
      });


      return modLinks(gw, 'update', controller, options.group, updateList);
    })
    .then( function () {
      return modLinks(gw, 'add', controller, options.group, addList);
    })
    .then(function () {
      if(options.remove) {
        return loadLinks(gw, removeList)
        .then( function () {
          return modLinks(gw, 'remove', controller, options.group, removeList);
        });
      } else {
        return null;
      }
    })
  );
  return deferred.promise.nodeify(next);
};

function loadLinks (gw, devices) {

  var _loadLinks = function (i) {
    if(devices.length === i) {
      return null;
    }
    var device = devices[i];
    return gw.links(device.id)
    .then(function(links) {
      device.links = links;
      return _loadLinks(i+1);
    });
  };

  return _loadLinks(0);
}


function modLinks(gw, mod, controller, group, responders) {

  if(responders.length === 0) {
    return null;
  }

  var responder = responders.pop();


  var code, ctrlBits;
  switch (mod) {
    case 'add':
      code = '41';
      ctrlBits = '82';/* in use and used*/
      break;
    case 'update':
      code = '20';
      ctrlBits = '82';/* in use and used*/
      break;
    case 'remove':
      code = '80';
      ctrlBits = '02'; /* clear in use */
      break;
  }

  if(responder.id === 'gw') {
    var manageLinkRecordCmd = {
      type: '6F', /*Manage ALL-Link Record*/
      code: code,
      raw: '026F'+ code + ctrlBits +
           toByte(group) + controller.id + responder.data.join('')
    };

    return gw
    .sendCommand(manageLinkRecordCmd)
    .then(function() {
      if(mod === 'update') { // no need to update controller links
        return modLinks(gw, mod, controller, group, responders);
      } else {
        return modCtlLink(gw, mod, controller, group, responder, responders);
      }
    });
  } else {
    var ctrlID = controller.id;
    if(controller.id === 'gw') {
      ctrlID = gw.id;
    }

    // figure out where to write the record
    // if it new then find the first unused or sub 8 from last
    // if it update or remove find the address of the existing record
    var at = 4095; /* 0x0FFF */
    var i, l;
    if(mod === 'add') {
      for (i = responder.links.length - 1; i >= 0; i--) {
        l = responder.links[i];
        if (!l.isInUse) {
          at = l.at;
          break;
        }
        if (l.at <= at) {
          at = l.at - 8;
        }
      }
    } else {
      for (i = responder.links.length - 1; i >= 0; i--) {
        l = responder.links[i];
        if(!l.controller && l.group === group && l.id === ctrlID) {
          at = l.at;
          break;
        }
      }
    }

    var link = {
      group: group,
      id: ctrlID,
      data: responder.data,
      controller: false,
      remove: (mod === 'remove')
    };

    return gw
    .writeLinkData(responder.id, at, link)
    .then(function() {
      if(mod === 'update') { // no need to update controller links
        return modLinks(gw, mod, controller, group, responders);
      } else {
        return modCtlLink(gw, mod, controller, group, responder, responders);
      }
    });
  }

}

function modCtlLink(gw, mod, controller, group, responder, responders) {


  var code, ctrlBits;
  switch (mod) {
    case 'add':
      code = '40';
      ctrlBits = 'C2';/* in use (bit 7), controller (6), and used (1) */
      break;
    case 'update':
      code = '20';
      ctrlBits = 'C2';/* in use (bit 7), controller (6), and used (1) */
      break;
    case 'remove':
      code = '80';
      ctrlBits = '02'; /* clear in use */
      break;
  }

  if(controller.id === 'gw') {
    var manageLinkRecordCmd = {
      type: '6F', /*Manage ALL-Link Record*/
      code: code, /* Add new Controller code */
      raw: '026F' + code + ctrlBits + toByte(group) + responder.id + responder.data.join('')
    };

    return gw
    .sendCommand(manageLinkRecordCmd)
    .then(function () {
      return modLinks(gw, mod, controller, group, responders);
    });
  } else {
    var rspdID = responder.id;
    if(responder.id === 'gw') {
      rspdID = gw.id;
    }
    var at = 4095; /* 0x0FFF */
    var i, l;
    if(mod === 'add') {
      for (i = controller.links.length - 1; i >= 0; i--) {
        l = controller.links[i];
        if (!l.isInUse) {
          at = l.at;
          break;
        }
        if (l.at <= at) {
          at = l.at - 8;
        }
      }
    } else {
      for (i = controller.links.length - 1; i >= 0; i--) {
        l = controller.links[i];
        if(l.controller && l.group === group && l.id === rspdID) {
          at = l.at;
          break;
        }
      }
    }

    var link = {
      group: group,
      id: rspdID,
      data: responder.data,
      controller: true,
      remove: (mod === 'remove')
    };

    return gw
    .writeLinkData(controller.id, at, link)
    .then(function () {
      return modLinks(gw, mod, controller, group, responders);
    });
  }
}


/**************************************************************************
 * Group/Scene Functions
 **************************************************************************/
Insteon.prototype.sendAllLinkCmd = function (group, command, next) {
  var sendAllLinkCmd = {
    type: '61',
    group: group,
    command: command,
    raw: '0261'+ toByte(group) + command + '00'
  };


  var deferred = Q.defer();
  deferred.resolve(
    this.sendCommand(sendAllLinkCmd)
    .then(function (status) {
      return status.report;
    })
  );
  return deferred.promise.nodeify(next);
};


Insteon.prototype.sceneOn = function (group, next) {
  debug('sceneOn - group: %d', group);
  return this.sendAllLinkCmd(group, '11', next);
};

Insteon.prototype.sceneOnFast = function (group, next) {
  debug('sceneOnFast - group: %d', group);
  return this.sendAllLinkCmd(group, '12', next);
};

Insteon.prototype.sceneOff = function (group, next) {
  debug('sceneOff - group: %d', group);
  return this.sendAllLinkCmd(group, '13', next);
};

Insteon.prototype.sceneOffFast = function (group, next) {
  debug('sceneOffFast - group: %d', group);
  return this.sendAllLinkCmd(group, '14', next);
};

Insteon.prototype.sceneDim = function (group, next) {
  debug('sceneDim - group: %d', group);
  return this.sendAllLinkCmd(group, '15', next);
};

Insteon.prototype.sceneBrighten = function (group, next) {
  debug('sceneBrighten - group: %d', group);
  return this.sendAllLinkCmd(group, '16', next);
};



/**************************************************************************
 * Basic Functions
 **************************************************************************/

Insteon.prototype.info = function (id, next) {
  if (typeof id === 'function') {
    next = id;
    id = null;
  }
  var deferred = Q.defer();

  if (id){
    var cmd = {cmd1: '03', cmd2: '00', waitForExtended: true};
    deferred.resolve(
      this.directCommand(id, cmd)
      .then(function onDeviceProfileRequest(status) {
        debug('Info: %j', status);
        if (!status.response || !status.response.standard) {
          return null;
        }
        if (!status.response.extended) {
          return {id: status.response.standard.id}; // not all device support the ED response
        }

        return buildInfo(status.response.extended);
      })
    );
  } else {
    deferred.resolve(
      this.sendCommand('60')
      .then( function (status) {
        return status.response;
      })
    );
  }
  return deferred.promise.nodeify(next);
};


function buildInfo(resp) {
  var info = {
    id: resp.id,
    productKey: resp.userData[1] + resp.userData[2] + resp.userData[3],
    deviceCategory: {id: parseInt(resp.userData[4], 16)},
    deviceSubcategory: {id: parseInt(resp.userData[5], 16)},
    isDimmable: false,
    isLighting: false,
    isThermostat: false
  };

  if (info.deviceCategory.id < DEV_CAT_NAMES.length) {
    info.deviceCategory.name = DEV_CAT_NAMES[info.deviceCategory.id];
  }

  switch(info.deviceCategory.id) {
  case 1:
    info.isDimmable = true;
    info.isLighting = true;
    break;
  case 2:
    info.isLighting = true;
    break;
  case 5:
    info.isThermostat = true;
  }

  return info;
}

Insteon.prototype.version = function(id, next) {
  var deferred = Q.defer();
  deferred.resolve(
    this.directCommand(id, '0D')
    .then(function recievedVersion(status) {
      if (!status || !status.response || !status.response.standard) {
        return null;
      }
      var resp = status.response.standard;
      var version = {
        code: parseInt(resp.command2, 16),
        name: utils.VERSIONS[resp.command2]
      };
      return version;
    })
  );
  return deferred.promise.nodeify(next);
};


Insteon.prototype.ping = function(id, next) {
  var deferred = Q.defer();
  deferred.resolve(
    this.directCommand(id, '0F')
    .then(function recievedVersion(status) {
      if (!status || !status.response || !status.response.standard) {
        return null;
      }
      return status.response.standard;
    })
  );
  return deferred.promise.nodeify(next);
};



Insteon.prototype.idRequest = function(id, next) {
  var deferred = Q.defer();
  deferred.resolve(
    this.directCommand(id, '10')
    .then(function recievedIdRequest(status) {
      if (!status || !status.response || !status.response.standard) {
        return null;
      }
      return status.response.standard;
    })
  );
  return deferred.promise.nodeify(next);
};

/**************************************************************************
 * Lighting Functions (deprecated)
 **************************************************************************/

Insteon.prototype.turnOn = function (id, level, rate, next) {
  console.trace('Insteon.trunOn(id, ...) is deprecated and will be removed in v1.0. Use Insteon.light(id).turnOn(...).');
  return this.light(id).turnOn(level, rate, next);
};

Insteon.prototype.turnOnFast = function (id, next) {
  console.trace('Insteon.turnOnFast(id, ...) is deprecated and will be removed in v1.0. Use Insteon.light(id).turnOnFast(...).');
  return this.light(id).turnOnFast(next);
};

Insteon.prototype.turnOff = function (id, rate, next) {
  console.trace('Insteon.turnOff(id, ...) is deprecated and will be removed in v1.0. Use Insteon.light(id).turnOff(...).');
  return this.light(id).turnOff(rate, next);
};

Insteon.prototype.turnOffFast = function (id, next) {
  console.trace('Insteon.turnOffFast(id, ...) is deprecated and will be removed in v1.0. Use Insteon.light(id).turnOffFast(...).');
  return this.light(id).turnOffFast(next);
};

Insteon.prototype.brighten = function (id, next) {
  console.trace('Insteon.brighten(id, ...) is deprecated and will be removed in v1.0. Use Insteon.light(id).brighten(...).');
  return this.light(id).brighten(next);
};

Insteon.prototype.dim = function (id, next) {
  console.trace('Insteon.dim(id, ...) is deprecated and will be removed in v1.0. Use Insteon.light(id).dim(...).');
  return this.light(id).dim(next);
};

Insteon.prototype.level = function (id, level, next) {
  console.trace('Insteon.level(id, ...) is deprecated and will be removed in v1.0. Use Insteon.light(id).level(...).');
  return this.light(id).level(level, next);
};

Insteon.prototype.rampRate = function (id, btn, rate, next) {
  console.trace('Insteon.rampRate(id, ...) is deprecated and will be removed in v1.0. Use Insteon.light(id).rampRate(...).');
  return this.light(id).rampRate(btn, rate, next);
};

Insteon.prototype.onLevel = function (id, btn, level, next) {
  console.trace('Insteon.onLevel(id, ...) is deprecated and will be removed in v1.0. Use Insteon.light(id).onLevel(...).');
  return this.light(id).onLevel(btn, level, next);
};

Insteon.prototype.light = function (id) {
  return new Light(id, this);
};

Insteon.prototype.thermostat = function (id) {
  return new Thermostat(id, this);
};

Insteon.defaultTempUnits = 'F';

module.exports = Insteon;
