var http = require('http');

var TIMEOUT = 15000;

var DELAY = 1000; //milliseconds to wait for response

var DEV_CAT_NAMES = ['Generalized Controllers', 'Dimmable Lighting Control',
'Switched Lighting Control', 'Network Bridges', 'Irrigation Control',
'Climate Control', 'Pool and Spa Control', 'Sensors and Actuators',
'Home Entertainment', 'Energy Management', 'Built-In Appliance Control',
'Plumbing', 'Communication', 'Computer Control', 'Window Coverings',
'Access Control', 'Security', 'Surveillance', 'Automotive', 'Pet Care',
'Toys', 'Timekeeping', 'Holiday'];

/**
 * Ramp rates in milliseconds 
 * @type {Array}
 */
var RAMP_RATES = [
  2000, // shouldn't be used
  480000,
  420000,
  360000,
  300000,
  270000,
  240000,
  210000,
  180000,
  150000,
  120000,
  90000,
  60000,
  47000,
  43000,
  38500,
  34000,
  32000,
  30000,
  28000,
  26000,
  23500,
  21500,
  19000,
  8500,
  6500,
  4500,
  2000,
  500,
  300,
  200,
  100
];

/**
 * Create Insteon Gateway
 *
 * Examples:
 *   Insteon('my.home.com')
 *   Insteon('192.168.10.10', 25105)
 *   Insteon('192.168.10.10', 25105, 'user', 'pass')
 *
 * 
 * @param  {String} host
 * @param  {Number} port (optional - defualt:80)
 * @param  {String} username (optional)
 * @param  {String} password (optional)
 * @return {Object}
 */
var Insteon = function (host, port, username, password) {
  this.host = host;
  this.port = port;
  this._auth = null;
  this._username = username;
  this._password = password;
  if(username && password) {
    this._auth = username + ':' + password;
  }
  this.url = 'http://' + host + (port ? ':' + port : '');
  this.status = {};


  /**
   * Sends http request
   * 
   * Both node http and jQuery ajax are supported
   * 
   * @param  {String}   method
   * @param  {String}   path
   * @param  {Function} next
   * @return {Object}
   */
  this.req = function (method, path, next) {
    if(arguments.length === 2) {
      next = path;
      path = method;
      method = 'GET';
    }
    var options = {
      hostname: this.host,
      port: this.port,
      path: path,
      method: method
    };
    if(this._auth) {
      options.auth = this._auth;
    }
    var req = http.request(options, function onResp(resp) {
      resp.setEncoding('utf8');
      var data = '';
      resp.on('data', function onData(chunk) {
        data += chunk;
      });
      resp.on('end', function onEnd() {
        next(null, resp, data);
      });
    });
    req.on('error', function (e) {
      next(e);
    });

    req.setTimeout(TIMEOUT);
    req.end();
    return req;
  };
};

/**
 * Update the authentication on the gateway.  If username or password are 
 * blank, then auth is disabled.
 * 
 * @param  {String}   username 
 * @param  {String}   password
 * @param  {Function} next
 */
Insteon.prototype.auth = function (username, password, next) {
  if(arguments.length === 1) {
    username = null;
    password = null;
  }
  var path = '/1?L=' + username + '=1=' + password;
  var newAuth = username + ':' + password;

  // very odd way to clear the values
  if(!username || !password) {
    path = '/1?L=*=1=*';
    newAuth = null;
  }

  var that = this;

  this.req('POST', path, function onPost(err, resp) {
    if (err) { return next(err); }

    if (resp.statusCode === 200) {
      that._auth = newAuth;
      next();
    } else {
      next(new Error(resp.statusCode));
    }
  });
};



/**************************************************************************
 * Command Functions
 **************************************************************************/


/**
 * Send comand to PLM function (/3) on the gateway
 *
 * command can either be the string (hex byte) for the PLM command 
 * or can be the command object with a raw property
 *
 * command object
 *   {
 *     raw: String,
 *     type: String
 *   }
 *
 * timeout is the number of milliseconds to wait before checking 
 * the status.  If time is omited or null, the command doesn't check
 * the status.  timeout should be set to zero to check imidiatly
 * 
 * @param  {String|Object}   cmd
 * @param  {Number}   timeout
 * @param  {Function} next
 */
Insteon.prototype.sendCommand = function (cmd, timeout, next) {
  if(arguments.length === 2) {
    next = timeout;
    timeout = null;
  }
  if (typeof cmd === 'string') {
    cmd = {
      raw: '02' + cmd,
      type: cmd
    };
  }
  var that = this;
  this.status = {};

  this.req('/3?' + cmd.raw + '=I=3',
    function onSentCommand(err, resp) {
      if (err) { return next(err); }
      if (resp.statusCode === 200) {
        that.status.command = cmd;
        if(timeout === null || timeout === undefined){
          next();
        } else {
          setTimeout(function() {
            that.checkStatus(next);
          }, timeout);
        }
      } else {
        next(new Error(resp.statusCode));
      }
    });
};

/**
 * Send direct command
 *
 * /3?0262 <device id> <flags> <command> <parameter> =I=3
 *
 * 0262: Insteon Serial Send Message (Standard or Extended)
 *   02: 
 *   62: Send Message
 *
 * Flags
 *   0F Direct Standard Command (0) with Max hop of 3 and hops left 3 (F)
 *   1F Direct Extended Command (1) with Max hop of 3 and hops left 3 (F)
 *
 * @param  {String}   id
 * @param  {String|Object}   cmd
 * @param  {String|Function} param or next
 * @param  {Function} next
 */
Insteon.prototype.directCommand = function (id, cmd, param, timeout, next) {
  if (arguments.length === 3) {
    next = param;
    param = '00';
  } else if(arguments.length === 4) {
    next = timeout;
    timeout = null;
  }
  if (typeof param === 'number') {
    timeout = param;
    param = '00';
  }
  if (typeof cmd === 'string') {
    cmd = {
      cmd1: cmd,
      cmd2: param
    };
  }
  var type = cmd.type = '62';
  var userData = '';
  var flags = '0F'; // standard command
  if(cmd.extended) {
    flags = '1F';
    var pad = '0000000000000000000000000000';
    userData = (cmd.userData ? cmd.userData.join('') : '');
    userData = userData + pad.substring(0, pad.length - userData.length);
  }

  cmd.raw = '02' + type + id + flags + cmd.cmd1 + cmd.cmd2 + userData;

  this.sendCommand(cmd, timeout, next);

};


/**
 * Check the status buffer
 *
 * Read with /buffstatus.xml
 *
 * <response><BS>status value</BS></response>
 *
 * Status value formate:
 *
 * 02620EA7220F117F   06              0250          0EA722
 * Last Command     + Response Flag + Return Flag + Target Device +
 *   16A944      2     B           11         7F
 *   Insteon + Ack + Hop Count + Command1 + Command2
 *
 * @param  {Function} next
 */
Insteon.prototype.checkStatus = function (next) {
  var status = this.status;

  this.req('/buffstatus.xml', function onGet(err, resp, xml) {
    var raw = /BS>([^<]+)<\/BS/g.exec(xml)[1];
    raw = raw + raw;  // For extended commands the buffer may wrap
    status.ack = false;

    switch(status.command.type) {
    case '60':
      status.ack =raw.substr(16, 2) === '06';
      status.response = parseGetInfo(raw.substr(0,16));
      break;
    case '62':
      status.ack = raw.substr(status.command.raw.length, 2) === '06';
      var rawResp = raw.substr(status.command.raw.length + 2);
      status.response = parseRecieved(rawResp);
      break;
    case '64':
      status.ack = raw.substr(8, 2) === '06';
      status.response = parseRecieved(raw.substr(10));
      break;
    case '69':
    case '6A':
      status.ack =raw.substr(4, 2) === '06';
      status.response = {};
      status.response.raw = raw.substr(6,20);
      status.response.type = raw.substr(8, 2);
      status.response.link = parseLinkRecord(raw.substr(10,16));
      break;
    }

    next(null, status);
  });
};

function parseRecieved(raw) {
  var resp = {};
  var type;
  while((type = /^02(5[013])/.exec(raw))) {
    if(type[1] === '51') {
      resp.extended = parseMessageRecieved(raw);
      raw = raw.substr(resp.extended.raw.length);
    } else if(type[1] === '50') {
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
  if(cmd.type !== '51' && cmd.type !== '50') {
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

  if(cmd.extended) {
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
  link.isController = (flags & 64) !== 0;  // bit mask 0100 0000
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
  if(!r) { return {}; }
  var devCatId = parseInt(r[5], 16);
  return {
    raw: r[0],
    type: r[1],
    isController: r[2] === '01',
    wasDeleted: r[2] === 'FF',
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
 * link or unlink a device from the gateway
 * 
 * @param  {Boolean}   unlink
 * @param  {Number}   group
 * @param  {Number}   timeout
 * @param  {Function} next
 */
Insteon.prototype.link = function (unlink, group, timeout, next) {
  if(arguments.length === 3) {
    next = timeout;
    timeout = group;
    group = unlink;
  } else if(arguments.length === 2) {
    next = group;
    timeout = unlink;
    group = 1;
  } else if(arguments.length === 1) {
    next = group;
    timeout = null;
    group = 1;
  }
  if(arguments.length < 4) {
    unlink = false;
  }

  var cmd = {
    type: '64',
    group: group,
    raw: '0264'+ (unlink ? 'FF' : '01') + toByte(group)
  };

  var that = this;
  this.sendCommand(cmd, function onSentLinking(err) {
    if (err) { return next(err); }
    that.checkForLink(timeout, next);
  });
};

Insteon.prototype.checkForLink = function (timeout, next) {
  if(arguments.length === 1) {
    next = timeout;
    timeout = null;
  }
  var that = this;
  this.checkStatus(function (err, status) {
    if(status.response.link) {
      next(null, status.response.link);
    } else if (timeout === null || timeout === undefined || !status.ack) {
      next();
    } else if(timeout <= 0) {
      that.cancelLinking(next);
    } else {
      setTimeout(function waitingForLink() {
        that.checkForLink(timeout - 1, next);
      }, 1000);
    }
  });
};

/**
 * Unlink a device from the gateway.
 * 
 * @param  {Number}   group
 * @param  {Number}   timeout
 * @param  {Function} next
 */
Insteon.prototype.unlink = function (group, timeout, next) {
  this.link(true, group, timeout, next);
};

/**
 * Cancel linking/unlinking
 * 
 * @param  {Function} next
 */
Insteon.prototype.cancelLinking = function (next) {
  this.sendCommand('65', next);
};

/**
 * Gets the links of a device or the gateway.  Links are returned in the 
 * callback as an Array of link Objects.
 * 
 * @param  {String}   id
 * @param  {Function} next
 */
Insteon.prototype.links = function (id, next) {
  if(arguments.length === 1) {
    next = id;
    id = null;
  }
  if(id) {
    this.linkAt(id, 4095, [], next); // start at 0xFFF (4095)
  } else {
    this.firstLink([], next);
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
  if(arguments.length === 1) {
    next = links;
    links = null;
  }
  var that = this;

  this.sendCommand('69', function onGetFirstLink(err) {
    if (err) { return next(err); }
    that.checkStatus(function (err, status) {
      if (err) { return next(err); }
      if(status.ack) {
        if(links) {
          that.nextLink([status.response.link], next);
        } else {
          next(null, status.response.link);
        }
      } else {
        next(null, links);
      }
    });
  });

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
  if(arguments.length === 1) {
    next = links;
    links = null;
  }
  var that = this;
  this.sendCommand('6A', function onGetVersion(err) {
    if (err) { return next(err); }
    that.checkStatus(function (err, status) {
      if (err) { return next(err); }
      if(status.ack) {
        if(links) {
          links.push(status.response.link);
          that.nextLink(links, next);
        } else {
          next(null, status.response.link);
        }
      } else {
        next(null, links);
      }
    });
  });
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
  if(arguments.length === 3) {
    next = links;
    links = null;
  }
  var that = this;

  var cmd = {cmd1: '2F', cmd2: '00', extended: true};

  cmd.userData = ['00', '00', toByte(at, 2), '01'];
  this.directCommand(id, cmd, DELAY, function waitingForLinkAt(err, status) {
    if (err) { return next(err); }

    if(status.ack && status.response && status.response.extended) {
      var data = status.response.extended.userData;
      var rawLink = data[5] + data[6] + data[7] + data[8] + data[9] + data[10] + data[11] + data[12];
      var link = parseLinkRecord(rawLink);
      link.at = parseInt(data[2] + data[3], 16);
      if(link.isLast) {
        return next(null, links);
      }
      if(links) {
        links.push(link);
        that.linkAt(id, at-8, links, next);
      } else {
        next(null, link);
      }
    } else {
      next(null, links);
    }
  });
};


/**************************************************************************
 * TODO Group/Scene Functions
 **************************************************************************/

/**************************************************************************
 * Info Functions
 **************************************************************************/

/**
 * Gets the device product profile (product data).
 *
 * The profile object is returned in the callback
 *
 * info Object: 
 *   {
 *     id: String,
 *     productKey: String,
 *     deviceCategory: {
 *       id: Number,
 *       name: String
 *     },
 *     deviceSubcategory: {
 *       id: Number
 *     }
 *     isDimmable: Boolean,
 *     isLighting: Boolean,
 *     isThermostat: Boolean
 *   }
 * 
 * @param  {String}   id   Device ID in hex
 * @param  {Function} next callback(err, profile)
 */
Insteon.prototype.info = function (id, next) {
  if(arguments.length === 1) {
    next = id;
    id = null;
  }
  if(id){
    this.directCommand(id, '03', DELAY, function onDeviceProfileRequest(err, status) {
      if (err) { return next(err); }
      if(!status.response) {
        return next(new Error('no response -- device missing?'));
      }
      if(!status.response.extended) {
        return next(new Error('invalid response, expected extended response'));
      }

      next(null, buildInfo(status.response.extended));
    });
  } else {
    this.sendCommand('60', DELAY, function (err, status) {
      if (err) { return next(err); }
      next(null, status.response);
    });
  }
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

  if(info.deviceCategory.id < DEV_CAT_NAMES.length) {
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



/**************************************************************************
 * Lighting Functions
 **************************************************************************/

/**
 * Turn Light On to level
 *
 * 11 -- ON command
 * 2E -- ON at Ramp Rate 
 *
 * rate value in msec (optional)
 *   default - use device stored rate
 *   'fast' - instant on to level (.1 sec)
 *   'slow' - slowly turn on (1 min)
 *   value - ramp rate value (1-100)
 *
 * @param  {String}   id
 * @param  {Number}   level
 * @param  {Number|String} rate (optional)
 * @param  {Function} next
 */
Insteon.prototype.on = function (id, level, rate, next) {
  if (arguments.length === 3) {
    next = rate;
    rate = null;
  }
  if(rate) {
    switch(rate) {
    case 'slow':
      rate = 60000;
      break;
    case 'fast':
      rate = 100;
      break;
    }

    var rampAndLevel = levelToHexHalfByte(level) + rampRateToHexHalfByte(rate);
    this.directCommand(id, '2E', rampAndLevel, next);
  } else {
    this.directCommand(id, '11', levelToHexByte(level), next);
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
Insteon.prototype.onFast = function (id, next) {
  this.directCommand(id, '12', next);
};

/**
 * Turn Light Off
 *
 * 13 -- OFF command
 *
 * @param  {String}   id
 * @param  {Function} next
 */
Insteon.prototype.off = function (id, rate, next) {
  if (arguments.length === 2) {
    next = rate;
    rate = null;
  }
  if(rate) {
    switch(rate) {
    case 'slow':
      rate = 600000; // 1 min in msec
      break;
    case 'fast':
      rate = 100; // .1 sec in msec
      break;
    }

    var rampAndLevel = '0' + rampRateToHexHalfByte(rate);
    this.directCommand(id, '2F', rampAndLevel, next);
  } else {
    this.directCommand(id, '13', next);
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
Insteon.prototype.offFast = function (id, next) {
  this.directCommand(id, '14', next);
};


/**
 * Brighten Light
 *
 * 15 -- Brighten command
 *
 * @param  {String}   id
 * @param  {Function} next
 */
Insteon.prototype.brighten = function (id, next) {
  this.directCommand(id, '15', next);
};

/**
 * Dim Light
 *
 * 16 -- Dim command
 *
 * @param  {String}   id
 * @param  {Function} next
 */
Insteon.prototype.dim = function (id, next) {
  this.directCommand(id, '16', next);
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
Insteon.prototype.level = function (id, level, next) {
  if(arguments.length === 2) {
    next = level;
    level = null;
  }

  if(level){
    this.directCommand(id, '21', levelToHexByte(level), next);
  } else {
    this.directCommand(id, '19', DELAY, function (err, status) {
      if (err) { return next(err); }

      var level = ~~ (parseInt(status.response.standard.command2, 16) * 100 / 255);
      next(null, level);
    });
  }
};

Insteon.prototype.rampRate = function (id, btn, rate, next) {
  if (arguments.length === 2) {
    next = btn;
    btn = 1;
    rate = null;
  } else if (arguments.length === 3) {
    next = rate;
    rate = btn;
    btn = 1;
  }

  var cmd = {cmd1: '2E', cmd2: '00', extended: true};

  btn = toByte(btn);

  if(rate) {
    cmd.userData = [btn, '05', rampRateToHexByte(rate)];

    this.directCommand(id, cmd, next);

  } else {

    cmd.userData = [btn];

    this.directCommand(id, cmd, DELAY, function onRampRateRequest(err, status) {
      if (err) { return next(err); }
      var rate = parseInt(status.response.extended.userData[6], 16);
      next(null, RAMP_RATES[rate]);
    });
  }
};

Insteon.prototype.onLevel = function (id, btn, level, next) {
  if (arguments.length === 2) {
    next = btn;
    btn = 1;
    level = null;
  } else if (arguments.length === 3) {
    next = level;
    level = btn;
    btn = 1;
  }

  var cmd = {cmd1: '2E', cmd2: '00', extended: true};

  btn =toByte(btn);


  if(level) {
    cmd.userData = [btn, '06', levelToHexByte(level)];

    this.directCommand(id, cmd, next);

  } else {
    cmd.userData = [btn];

    this.directCommand(id, cmd, DELAY, function onOnLevelRequest(err, status) {
      if (err) { return next(err); }

      var rate = ~~ (parseInt(status.response.extended.userData[7], 16) * 100 / 255);
      next(null, rate);
    });
  }
};

/**************************************************************************
 * TODO: Thermostat Controls
 **************************************************************************/


/**************************************************************************
 * Utility Functions
 **************************************************************************/

function levelToHexByte(level) {
  if (level < 0 || level > 100) {
    throw new Error('level must be between 0 and 100');
  }
  // scale level to a max of 0xFF (255)
  level = ~~ (255 * level / 100);

  return toByte(level);

}

function levelToHexHalfByte(level) {
  if (level < 0 || level > 100) {
    throw new Error('level must be between 0 and 100');
  }
  // scale level to a max of 0xF (15)
  level = ~~ (15 * level / 100);

  return level.toString(16).toUpperCase();

}

function rampRateToHexByte(rate) {

  for(var i = 1; i < RAMP_RATES.length; i++) {
    if(rate >= RAMP_RATES[i]) {
      break;
    }
  }

  return toByte(i);
}

function rampRateToHexHalfByte(rate) {

  for(var i = 0; i < RAMP_RATES.length; i++) {
    if(rate <= RAMP_RATES[i]) {
      break;
    }
  }

  return toByte(~~((i)/2));
}

function toByte(value, length) {
  length = length || 1;
  value = value.toString(16).toUpperCase();
  var pad = new Array((length * 2) + 1).join('0');
  return pad.substring(0, pad.length - value.length) + value;
}

module.exports = Insteon;

