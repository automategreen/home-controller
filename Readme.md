home-controller
===============

Introduction
------------

home-controller is a node package to control Insteon home automation devices.  To control the Insteon devices, either an [Insteon Hub](http://www.insteon.com/2242-222-insteon-hub.html) or an [Insteon SmartLinc](http://www.insteon.com/2412n-smartlinc-central-controller.html) must be accessible from the app.

Features
--------
	
- Device and Gateway Info
- Linking
- Group/Scene Control **Coming soon**
- Lighting Control
- Thermostat Control **Coming soon**

Installation
------------

Install via npm:

`npm install home-controller`

Add `require` statement to the app to access the Insteon object

	var Insteon = require('home-controller').Insteon;

API
---

### Insteon Gateway

#### Insteon(host[, port[, username, password]])

Constructor for Insteon gateway

If no port is provided, port 80 is used.  If no username or password is provided, then authentication is not used.

##### Examples

```js
var gw = Insteon('my.home.com')
var gw = Insteon('192.168.10.10', 25105)
var gw = Insteon('192.168.10.10', 25105, 'user', 'pass')
```

#### gw.auth([username, password,] callback)

Updates the authentication on the gateway

If username or password are blank, then authentication is disabled.

##### Examples

```js
var gw = Insteon('my.home.com');
gw.auth('admin', 'password', function(error) {
	// User name and password updated
});

gw.auth(function(error) {
	// Username and password cleared - auth disabled
});
```

### Insteon Linking Functions

#### gw.link([group,] [timeout,] callback)

Links device to the gateway

*Currently requires manually holding set button.*

`group` is the group number to which the device is added.  The default group is 1.

`timeout` is the number of seconds to wait for linking to complete. (Remember you have to hold the set button for at least 10 seconds.)  If `timeout` is not defined, the callback function will be executed as soon as the linking command is sent.  This requires `checkForLink` to be manually called to see if linking has completed. 


#### gw.unlink([group,] [timeout,] callback)

Unlinks device from the gateway

*Currently requires manually holding the set button.*

See `link` for usage.

#### gw.checkForLink([timeout,] callback)

Checks to see if linking/unlinking has completed

Used when `timeout` is not provided for `link` or `unlink`.

`timeout` is the number of seconds to wait for linking to complete.

#### gw.cancelLinking(callback)

Cancels linking/unlinking

Like `checkForLink`, it is used when `timeout` is not provided for `link` or `unlink`.

#### gw.links([id,] callback)

Gets the links of a device or the gateway

Links are returned in the callback as an Array of Link Objects.

`id` is the id (6 digit hex String) of the device from which to retrieve the links.

##### Link Object

```js
{
	id: String,
	group: Number,
	isController: Boolean,
	isInUse: Boolean,
	hasBeenUsed: Boolean,
	isLast: Boolean,
	data: Array(3)
}
```

#### gw.firstLink(callback)

Gets the first link record on the gateway

#### gw.nextLink(callback)

Gets the next link record on the gateway

#### gw.linkAt(id, at, callback)

Gets the link at a memory address on a device

`id` is the id (6 digit hex String) of the device

`at` is the memory address.  Addresses start at 4095 (0xFFF) and count down by 8. (4095, 4087, 4079, ... ).

### Insteon Group/Scene Functions

**Coming Soon**

### Insteon Information Functions

#### gw.info([id,] callback)

Gets the product information about the gateway or a device

`id` is the id (6 digit hex String) of the device from which to get the product info.  If not provided, the gateway's product info will be returned.  Product info object is returned in callback.

##### Example

```js
var gw = Insteon('my.home.com');

// Get gateway info
gw.checkStatus(function(error, info) {
  // For details on the info object see below.
});

// Get Device info
gw.checkStatus('AABBCC', function(error, info) {
  // For details on the info object see below.
});
```

##### Info Object

```js
{
  id: String,
  productKey, String,
  deviceCategory: {
    id: Number,
    name: String
  },
  deviceSubCategory: {
    id: Number
  },
  isDimmable: Boolean,
  isLighting: Boolean,
  isThermostat: Boolean
}
```

### Insteon Lighting Functions

#### gw.on(id, level, [rate,] callback)

Turns an Insteon dimmer switch on to the provided level

`id` is the id (6 digit hex String) of the light switch

`level` is the percentage (0-100) of full to which the dimmer is set. Non-dimmable switches ignore this and turn on to full.

`rate` is the speed at which the light is turned on to the provided `level`. If not provided, the default saved ramp rate of the device is used.  The rate value can either be 'slow', 'fast', or the number of milliseconds. 'fast' is 0.1 seconds.  'slow' is 1 minute.  If milliseconds is provided, the closest defined ramp rate less than the provided value is used.

#### gw.onFast(id, callback)

Turn light on fast (no ramp) to pre-saved level

`id` is the id (6 digit hex String) of the light switch.

#### gw.off(id, [rate,] callback)

Turns light off

`id` is the id (6 digit hex String) of the light switch.

`rate` is the speed the light turns off.  See `on` for values.

#### gw.offFast(id, callback)

Turns light off fast (no ramp)

`id` is the id (6 digit hex String) of the light switch.

#### gw.brighten(id, callback)

Brightens the light one step

`id` is the id (6 digit hex String) of the light switch.

#### gw.dim(id, callback)

Dims the light one step

`id` is the id (6 digit hex String) of the light switch.

#### gw.level(id, [level,] callback)

Gets or sets the light's current level

`id` is the id (6 digit hex String) of the light switch.

`level` is the percentage (0-100) of full to which the dimmer is set. If not provided, then the current level of the device is returned in the callback.

##### Example

```js
var gw = Insteon('my.home.com');

// Set light level
gw.level('AABBCC', 50, function(error) {

  // Get light level
  gw.level('AABBCC', function(error, level)){
    console.log(level); // Should print 50
  }
});
```

### Insteon Thermostat Functions

**Coming Soon**

### Insteon Core Functions

*For advanced users only.  These function are leveraged by the higher level functions.*

#### gw.sendCommand(command, [timeout,] callback)

Sends command to PLM function on the gateway

`command` can either be the String (hex byte) for the PLM command or the Command Object with a raw property.

Command Object:

```js
{
  raw: String,
  type: String
}
```

`timeout` is the number of milliseconds to wait before checking the status.  If `timeout` is omitted or null, the command doesn't check the status.  `timeout` should be set to zero to check immediately.

#### gw.directCommand(id, command, [param,] [timeout,] callback)

Sends direct command to Insteon device

`id` is the id (6 digit hex String) of the device.

`command` can either be a hex String (length 2) or an Object. The String must be a standard direct command. If command is a String, then `param` can also be passed. The `param` will be defaulted to `'00'`.  If the command is an extended command, it must be passed as an Object with the extended property.

Standard Command Object:

```js
{
  cmd1: String,
  cmd2: String
}
```

Extended Command Object:

```js
{
  extended: true,
  cmd1: String,
  cmd2: String,
  userData: Array
}
```

#### gw.checkStatus(callback)

Checks the status of the gateway's buffer

This is used to read response messages.  This buffer must be checked after each command if a response is expected. The buffer is overwritten each time a command is sent.

##### Examples

```js
var gw = Insteon('my.home.com');
gw.checkStatus(function(error, status) {
  // For details on the status object see below.
});
```

##### Status Object

A Status Object will be returned in the callback.  The Status Object format depends on the response type.


Get Modem Info Response (0x60) Status Object:

```js
{
  command: Object,
  ack: Boolean,
  response: {
    raw: String,
    type: String,
    id: String,
    deviceCategory: {
      id: Number,
      name: String
    },
    deviceSubcategory: {
      id: Number
    },
    firewareVersion: String
  }
}
```
Send Message Response (0x62) Status Object:

```js
{
  command: Object,
  ack: Boolean,
  response: {
    raw: String,
    type: String,
    id: String,
    standard: {
      id: String,
      gatewayId: String,
      extended: false,
      messageType: Number,
      hopsLeft: Number,
      maxHops: Number,
      command1: String,
      command2: String,
      raw: String
    },
    extended: {
      id: String,
      gatewayId: String,
      extended: true,
      messageType: Number,
      hopsLeft: Number,
      maxHops: Number,
      command1: String,
      command2: String,
      userData: Array(14),
      raw: String
    }
  }
}
```

All-Linking Response (0x64) Status Object:

```js
{
  command: Object,
  ack: Boolean,
  response: {
    raw: String,
    type: String,
    isController: Boolean,
    wasDeleted: Boolean,
    group: Number,
    id: String,
    deviceCategory: {
      id: Number,
      name: String
    },
    deviceSubcategory: {
      id: Number
    },
    firmwareVersion: String
  }
}
```

Get All-Link Record Response (0x69 & 0x6A) Status Object:

```js
{
  command: Object,
  ack: Boolean,
  response: {
    raw: String,
    type: String,
    link: {
      isController: Boolean,
      isInUse: Boolean,
      hasBeenUsed: Boolean,
      isLast: Boolean,
      group: Number,
      id: String,
      data: Array(3)
    }
  }
}
```

Testing
-------

To test the package run:

	grunt test

References
----------

- [Insteon Details](http://www.insteon.com/pdf/insteondetails.pdf)
- [Insteon Developer's Guide](http://www.insteon.com/pdf/insteon_developers_guide_20070816a.pdf)
- [Insteon Command Tables](http://www.insteon.com/pdf/INSTEON_Command_Tables_20070925a.pdf)
- [Insteon Device Categories](http://www.insteon.com/pdf/insteon_devcats_and_product_keys_20081008.pdf)
- [Ramp Rates](http://www.madreporite.com/insteon/ramprate.htm)