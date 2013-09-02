home-controller
===============

Introduction
------------

home-controller is a node package to control Insteon home automation devices.  To control the Insteon devices either an [Insteon Hub](http://www.insteon.com/2242-222-insteon-hub.html) or an [Insteon SmartLinc](http://www.insteon.com/2412n-smartlinc-central-controller.html) must be accessible from the app.

Features
--------
	
- Device and Gateway Info
- Linking
- Group/Scene Control **Coming soon**
- Lighting Control
- Thermostat Control **Coming soon**

Installation
------------

Install via npm.

`npm install home-controller`

Add requires statement to the app to access the Insteon object

	var Insteon = require('home-controller').Insteon;

API
---

### Insteon Gateway

#### Insteon(host[, port[, username, password]])

Constructor for Insteon gateway.  If no port is provided, port 80 is used.  If no username or password is povided then authentication is not used.

##### Examples

```js
var gw = Insteon('my.home.com')
var gw = Insteon('192.168.10.10', 25105)
var gw = Insteon('192.168.10.10', 25105, 'user', 'pass')
```

#### Insteon.auth([username, password,] callback)

Update the authentication on the gateway.  If username or password are blank, then auth is disabled.

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

#### Insteon.link([group,] [timeout,] callback)

Link device to the gateway.  *Currently requires manually holding set button.*

`group` is the group number to add the device to.  The default group is 1.

`timeout` is the number of seconds to wait for linking to complete. (remember you have to hold the set button for at least 10 seconds.)  If timeout is not defined, the callback function will be executed as soon as the linking command is sent.  This requires `checkForLink` to be manually called to see if linking has completed. 


#### Insteon.unlink([group,] [timeout,] callback)

Unlink device from the gateway. *Currently requires manually holding the set button.*

See `link` for usage.

#### Insteon.checkForLink([timeout,] callback)

Checks to see if linking/unlinking has completed. Used when `timeout` is not provided for `link` or `unlink`.

`timeout` is the number of seconds to wait for linking to complete.

#### Insteon.cancelLinking(callback)

Cancels linking/unlinking.  Like `checkForLink` it is used when `timeout` is not provided for `link` or `unlink`.

#### Insteon.links([id,] callback)

Gets the links of a device or the gateway.  Links are returned in the callback as an Array of link Objects.

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

#### Insteon.firstLink(callback)

Gets the first link record on the gateway.

#### Insteon.nextLink(callback)

Gets the next link record on the gateway.

#### Insteon.linkAt(id, at, callback)

Gets the link at a memory address on a device.

`id` is the id (6 digit hex String) of the device

`at` is the memory address.  Address start at 4095 (0xFFF) and count down by 8. (4095, 4087, 4079, ... ).

### Insteon Group/Scene Functions

**Coming Soon**

### Insteon Information Functions

#### Insteon.info([id,] callback)

Gets the product information about the gateway or a device.

`id` is the id (6 digit hex String) of the device from witch to get the product info.  If not provided, the gateway's product info will be returned.  Product info object is returned in callback.

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

#### Insteon.on(id, level, [rate,] callback)

Turns an Insteon dimmer switch on to the provided level.

`id` is the id (6 digit hex String) of the light switch

`level` is the percentage (0-100) of full to witch the dimmer is set. None dimmable switches ignore this and turn on to full.

`rate` is the speed the light is turn on to the `level`. If not provided, the default saved ramp rate of the device is used.  The rate value can either be 'slow', 'fast', or the number of milliseconds. 'fast' is 0.1 seconds.  'slow' is 1 minute.  If milliseconds is provided, the closes defined ramp rate less than the value is used.

#### Insteon.onFast(id, callback)

Turn Light On fast (no ramp) to pre saved level.

`id` is the id (6 digit hex String) of the light switch

#### Insteon.off(id, [rate,] callback)

Turns an Insteon switch off.

`id` is the id (6 digit hex String) of the light switch

`rate` is the speed the light turns off.  See `on` for values.

#### Insteon.offFast(id, callback)

Turns light off fast (no ramp).

`id` is the id (6 digit hex String) of the light switch

#### Insteon.brighten(id, callback)

Brightens the light one step. 

`id` is the id (6 digit hex String) of the light switch

#### Insteon.dim(id, callback)

Dims the light one step.

`id` is the id (6 digit hex String) of the light switch

#### Insteon.level(id, [level,] callback)

Gets or sets the lights current level.

`id` is the id (6 digit hex String) of the light switch

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

#### Insteon.sendCommand(command, [timeout,] callback)

Send command to PLM function (/3) on the gateway

`command` can either be the string (hex byte) for the PLM command or can be the command object with a raw property

command object:

```js
{
  raw: String,
  type: String
}
```

`timeout` is the number of milliseconds to wait before checking the status.  If time is omitted or null, the command doesn't check the status.  timeout should be set to zero to check immediately

#### Insteon.directCommand(id, command, [param,] [timeout,] callback)

Send direct command to Insteon device.

`id` is a hex string of length 6.

`command` can either be a hex string (length 2) or an object. The string must be a standard direct command. If command is a string, then `param` can also be passed. The `param` will be defaulted to `'00'`.  If the command is an extended command, it must be passed as an object with the extended property.

Standard command object:

```js
{
  cmd1: String,
  cmd2: String
}
```

Extended command object:

```js
{
  extended: true,
  cmd1: String,
  cmd2: String,
  userData: Array
}
```

#### Insteon.checkStatus(callback)

Checks the status of the gateways buffer.  This is used to read response messages.  This buffer must be check after each command if a response is expected. The buffer is overwritten each time a command is sent.

##### Examples

```js
var gw = Insteon('my.home.com');
gw.checkStatus(function(error, status) {
  // For details on the status object see below.
});
```

##### Status Object

A status object will be returned in the callback.  The status object format depends on the response type.


Get Modem Info Response (0x60) status object:

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
Send Message Response (0x62) status object:

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

All-Linking Response (0x64)

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

Get All-Link Record Response (0x69 & 0x6A)

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
- [Insteon Developers Guide](http://www.insteon.com/pdf/insteon_developers_guide_20070816a.pdf)
- [Insteon Command Tables](http://www.insteon.com/pdf/INSTEON_Command_Tables_20070925a.pdf)
- [Insteon Device Categories](http://www.insteon.com/pdf/insteon_devcats_and_product_keys_20081008.pdf)
- [Ramp Rates](http://www.madreporite.com/insteon/ramprate.htm)