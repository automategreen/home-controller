home-controller
===============

Introduction
------------

home-controller is a node package to control Insteon home automation devices.  To control the Insteon devices, either an [Insteon Hub](http://www.insteon.com/2242-222-insteon-hub.html) or an [Insteon SmartLinc](http://www.insteon.com/2412n-smartlinc-central-controller.html) must be accessible from the app.

Features
--------
	
- Device and Gateway Info
- Linking and Group Control
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

### Insteon Linking and Scene Functions

#### gw.link([device,] [options,] callback)

Links device(s) to gateway. Callback return link object as second argument (see `gw.links`).

`device` is the device to link.  It can either be a device id (6 digit hex String), an Array of ids, or null.  If a device id is provided, the device will be linked. If an array of ids is provided, each devices will be configured linked. If device is `null`, the  device must be put into linking state manually (hold set button). The device will be setup as the responder, unless the `isController` option is true.

`options` is an Object with the options to be used during linking. 

##### Link Options Object

```js
{
  isController: Boolean, // link the device(s) as a controller(s)
  group: Number, // controller group/button
  timeout: Number // timeout for manual linking
}
```

`group` is the controller group to link the responders to.  Valid group numbers vary by device type.  The hub supports group numbers 0-255. Default is 1.

`timeout` is the number of seconds to wait for linking to complete. (Remember you have to hold the set button for at least 10 seconds.)Default is 30.


#### gw.scene(controller, responder, [options,] callback)

Creates scene controller with responder(s). All devices must be available and linked to the gateway.

`controller` is the device to setup as controller.  It can either be a device id (6 digit hex String), the string 'gw', or null.  If a device id is provided, the device will be configured as the controller.  If controller is `'gw'` the gateway will be configured as the controller.

`responder` is the device to setup as responder.  It can either be a responder object or an Array of responder objects. The responder object can also be the device id (6 digit hex String); default scene values will be used.

##### Responder Object

```js
{
  id: String, // device id (6 digit hex String)
  level: Number, // See level in gw.on()
  rate: Number, // See rate in gw.on()
  data: Array  // data to be configure for scene (overrides level and rate)]
}
```

`options` is an Object with the options to be used during linking. 

##### Scene Options Object

```js
{
  group: Number, // controller group/button (default: 1)
  remove: boolean // remove existing responders if not passed in responder (default: false)
}
```

`group` is the controller group to link the responders to.  Valid group numbers vary by device type.  The hub supports group numbers 0-255. Default is 1.

`timeout` is the number of seconds to wait for linking to complete. (Remember you have to hold the set button for at least 10 seconds.) Default is 30.

##### Examples


```js
var gw = Insteon('my.home.com');

// Link two devices with for 2nd button on dimmer
gw.link('AABBCC', '112233', {group: 2}, function(error, link) {
  // link data from responder, 11.22.33
});

// Link gateway to multiple devices
gw.link('gw', ['111111', '222222', '333333'], function(error, link) {
  // link data from last responder, 33.33.33
})

// Link device to gateway
gw.link('ABCDEF', 'gw', function(error, link) {
  // link data from gateway
});

// Shorthand to link gateway to unknown device
gw.link(function(error, link) { // link('gw', null, fn)
  // link data from unknown device (responder)
});

// Link unknown device to gateway (same as link(null, 'gw', fn))
gw.link(null, 'gw', function(error, link) {
  // link data from gateway
});

// Shorthand to a device to an unknown device 
gw.link('123456', function(error, link) {  // link('123456', null, fn)
  // link data from gateway
});
```


#### gw.unlink([[controller,] responder,] [options,] callback)

Unlinks device from the gateway

See `link` for usage.

#### gw.cancelLinking(callback)

Cancels linking/unlinking

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

### Insteon Information Functions

#### gw.info([id,] callback)

Gets the product information about the gateway or a device. Product info object is returned in callback.

`id` is the id (6 digit hex String) of the device from which to get the product info.  If not provided, the gateway's product info will be returned.  

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

#### gw.ping(id, callback)

Sends a Insteon ping to a device. Response object is returned in the callback, if the ping was successful.

`id` is the id (6 digit hex String) of the device from which to get the product info.

#### gw.version(id, callback)

Gets the version information about a device. Version object is returned in callback. Valid version names are i1, i2, and i2cs. 

`id` is the id (6 digit hex String) of the device from which to get the product info.

##### Version Object

```js
{
  code: Number,
  name, String,
}
```

### Insteon Lighting Functions

#### gw.on(id, [level, [rate,]] callback)

Turns an Insteon dimmer switch on to the provided level

`id` is the id (6 digit hex String) of the light switch

`level` is the percentage (0-100) of full to which the dimmer is set. Non-dimmable switches ignore this and turn on to full. Defaults to 100 percent.

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
- [Automate Green Blog](http://blog.automategreen.com)
