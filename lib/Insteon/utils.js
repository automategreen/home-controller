

var DEV_CAT_NAMES = ['Generalized Controllers', 'Dimmable Lighting Control',
  'Switched Lighting Control', 'Network Bridges', 'Irrigation Control',
  'Climate Control', 'Pool and Spa Control', 'Sensors and Actuators',
  'Home Entertainment', 'Energy Management', 'Built-In Appliance Control',
  'Plumbing', 'Communication', 'Computer Control', 'Window Coverings',
  'Access Control', 'Security', 'Surveillance', 'Automotive', 'Pet Care',
  'Toys', 'Timekeeping', 'Holiday'];

var VERSIONS = {
  '00': 'i1',
  '01': 'i2',
  '02': 'i2cs'
};

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

function byteToLevel(byte) {
  return Math.ceil(parseInt(byte, 16) * 100 / 255);
}

function byteToRampRate(byte) {
  return RAMP_RATES[parseInt(byte, 16)];
}


function lookupRampRateIndex(rate) {

    for(var i = 1; i < RAMP_RATES.length; i++) {
      if (rate >= RAMP_RATES[i]) {
        return i;
      }
    }

    return RAMP_RATES.length - 1;
}

function rampRateToHexByte(rate) {
  return toByte(lookupRampRateIndex(rate));
}

function rampRateToHexHalfByte(rate) {
  return (~~((lookupRampRateIndex(rate))/2)).toString(16).toUpperCase();
}

function toByte(value, length) {
  length = length || 1;
  value = value.toString(16).toUpperCase();
  var pad = new Array((length * 2) + 1).join('0');
  return pad.substring(0, pad.length - value.length) + value;
}

function assignDefaults(defaults, options) {
  if (!options) {
    options = defaults;
    return options;
  }
  for(var key in defaults) {
    options[key] = (typeof options[key] === 'undefined') ? defaults[key] : options[key];
  }

  return options;
}

function convertTemp(from, to, val) {
  if(from === to) {
    return val;
  }

  if(from === 'F') {
    var c = (val - 32) * 5/9;
    if(to === 'K') {
      return c + 273.15;
    }
    return c;
  }

  if(from === 'K') {
    val = val - 273.15;
  }

  if(to === 'C') {
    return val;
  }

  return (val * 9/5) + 32;
}



module.exports = {
  levelToHexByte: levelToHexByte,
  levelToHexHalfByte: levelToHexHalfByte,
  rampRateToHexByte: rampRateToHexByte,
  rampRateToHexHalfByte: rampRateToHexHalfByte,
  byteToLevel: byteToLevel,
  byteToRampRate: byteToRampRate,
  toByte: toByte,
  assignDefaults: assignDefaults,
  convertTemp: convertTemp,
  DEV_CAT_NAMES: DEV_CAT_NAMES,
  VERSIONS: VERSIONS,
  RAMP_RATES: RAMP_RATES
};
