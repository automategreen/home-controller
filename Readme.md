home-controller [![Build Status](https://travis-ci.org/automategreen/home-controller.png)](https://travis-ci.org/automategreen/home-controller)
===============



Introduction
------------

home-controller is a node package to control Insteon home automation devices.  The API uses the direct PLM connection over TCP.  To control the Insteon devices, either an [Insteon Hub](http://www.insteon.com/2242-222-insteon-hub.html) or an [Insteon SmartLinc](http://www.insteon.com/2412n-smartlinc-central-controller.html) must be accessible from the app.

Features
--------

- Device and Gateway Info
- Linking and Group Control
- Scene Control
- Lighting Control
- Thermostat Control

Getting Started
---------------

### Install

Install via npm:

`npm install home-controller`

### Example

The example below is a simple RESTful interface using the home-controller module and Express.

```js
var Insteon = require('home-controller').Insteon;
var hub = new Insteon();
var express = require('express');
var app = express();

app.get('/light/:id/on', function(req, res){
  var id = req.params.id;
  hub.light(id).turnOn()
  .then(function (status) {
    if(status.response) {
      res.send(200);
    } else {
      res.send(404);
    }
  });
});

hub.connect(process.env.HUB_IP, function () {
  app.listen(3000);
});
```

### [Additional Examples](http://blog.automategreen.com/tag/home-controller-examples)

API
---

**0.4.1 Update Highlights:**

  - Add connect.serial()

**0.4 Update Highlights:**

  - Major refactoring of the code structure.
  - All functions return promises (via [Q](https://github.com/kriskowal/q)). The callback function is now optional.
  - The lighting function have been moved to the light class.  Old function are deprecated and will be removed with a later release.
  - Thermostat control is now available
  - As always, several bug wer fixed (and probably several new one introduced).  Please open an issue if you find a bug.
  - [Full releases notes](http://blog.automategreen.com/post/home-controller-0.4.0)

### Insteon Gateway

#### Class: Insteon()

Add `require` statement to the app to access the Insteon class

```js
var Insteon = require('home-controller').Insteon;
```

The Insteon class inherits [EventEmitter](http://nodejs.org/api/events.html)


#### insteon.connect(host, [port], [connectListener])

Creates a connection to the gateway.

When the 'connect' event is emitted the connection is established. If there is a problem connecting, the 'connect' event will not be emitted, the 'error' event will be emitted with the exception. ([See socket.connect](http://nodejs.org/api/net.html#net_socket_connect_path_connectlistener));

`connectListener`  will be added as an listener for the 'connect' event.

#### insteon.serial(comName, [options], [connectListener])

Creates a connection to a PowerLinc USB driver residing at the specified USB serial device.
The 'options' parameter, if present, contains values suitable for use with the 
[serialport](https://github.com/voodootikigod/node-serialport)
[constructor](https://github.com/voodootikigod/node-serialport#to-use).
The 'connectListener' parameter, if present, will be invoked once the connection is open;

##### Examples

```js
var insteon = new Insteon();
insteon.connect('192.168.10.10', function(){
  console.log('Connected!');
});
```

#### insteon.close()

Closes the connection to the gateway.  The event `'close'` will be emitted once the connection is closed.

#### Event: 'connect'

Emitted when the connection to the gateway is successfully established.

#### Event: 'close'

Emitted once the socket is fully closed. The argument had_error is a boolean which says if the socket was closed due to a transmission error. ([See net.Socket Event: 'close'](http://nodejs.org/api/net.html#net_event_close_1))

**Callback arguments**

- `had_error` Boolean true if the socket had a transmission error

#### Event: 'command'

Emitted when an unsolicited command is received. The argument `command` will be the command object.

**Callback arguments**

- `command` received from gateway

#### Event: 'error'

Emitted when an error occurs. The 'close' event will be called directly following this event.


### Insteon Linking Functions

#### insteon.link([device,] [options,] [callback])

Links device(s) to gateway. Callback return link object as second argument (see `insteon.links`).

`device` is the device to link.  It can either be a device id (6 digit hex String), an Array of ids, or null.  If a device id is provided, the device will be linked. If an array of ids is provided, each devices will be configured linked. If device is `null`, the  device must be put into linking state manually (hold set button). The device will be setup as the responder, unless the `controller` option is true.

`options` is an Object with the options to be used during linking.

##### Link Options Object

```js
{
  controller: Boolean, // link the device(s) as a controller(s)
  group: Number, // controller group/button
  timeout: Number // timeout for manual linking
}
```

`group` is the controller group to link the responders to.  Valid group numbers vary by device type.  The hub supports group numbers 0-255. Default is 1.

`timeout` is the number of milliseconds to wait for linking to complete. (Remember you have to hold the set button for at least 10 seconds.)Default is 30000 ms.


##### Examples


```js
var insteon = Insteon('my.home.com');

// Link two devices with for 2nd button on dimmer
insteon.link('AABBCC', '112233', {group: 2}, function(error, link) {
  // link data from responder, 11.22.33
});

// Link gateway to multiple devices
insteon.link('insteon', ['111111', '222222', '333333'], function(error, link) {
  // link data from last responder, 33.33.33
})

// Link device to gateway
insteon.link('ABCDEF', 'insteon', function(error, link) {
  // link data from gateway
});

// Shorthand to link gateway to unknown device
insteon.link(function(error, link) { // link('insteon', null, fn)
  // link data from unknown device (responder)
});

// Link unknown device to gateway (same as link(null, 'insteon', fn))
insteon.link(null, 'insteon', function(error, link) {
  // link data from gateway
});

// Shorthand to a device to an unknown device
insteon.link('123456', function(error, link) {  // link('123456', null, fn)
  // link data from gateway
});
```


#### insteon.unlink([[controller,] responder,] [options,] [callback])

Unlinks device from the gateway

See `link` for usage.

#### insteon.cancelLinking([callback])

Cancels linking/unlinking

#### insteon.links([id,] [callback])

Gets the links of a device or the gateway

Links are returned in the callback as an Array of Link Objects.

`id` is the id (6 digit hex String) of the device from which to retrieve the links.

##### Link Object

```js
{
	id: String,
	group: Number,
	controller: Boolean,
	isInUse: Boolean,
	hasBeenUsed: Boolean,
	isLast: Boolean,
	data: Array(3)
}
```

#### insteon.firstLink([callback])

Gets the first link record on the gateway

#### insteon.nextLink([callback])

Gets the next link record on the gateway

#### insteon.linkAt(id, at, [callback])

Gets the link at a memory address on a device

`id` is the id (6 digit hex String) of the device

`at` is the memory address.  Addresses start at 4095 (0xFFF) and count down by 8. (4095, 4087, 4079, ... ).

### Scene Functions


#### insteon.scene(controller, responder, [options,] [callback])

Creates scene controller with responder(s). All devices must be available and linked to the gateway.

`controller` is the device to setup as controller.  It can either be a device id (6 digit hex String), the string 'insteon', or null.  If a device id is provided, the device will be configured as the controller.  If controller is `'insteon'` the gateway will be configured as the controller.

`responder` is the device to setup as responder.  It can either be a responder object or an Array of responder objects. The responder object can also be the device id (6 digit hex String); default scene values will be used.

##### Responder Object

```js
{
	id: String, // device id (6 digit hex String)
	level: Number, // See level in insteon.turnOn()
	rate: Number, // See rate in insteon.turnOn()
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

`timeout` is the number of milliseconds to wait for linking to complete. (Remember you have to hold the set button for at least 10 seconds.) Default is 30,000 ms.

#### insteon.sendAllLinkCmd (group, command, [callback])

Sends an Insteon All-link command for a link group. Used by sceneXX commands.

`group` is the controller group on the gateway for which to trigger the command.

`command` is the insteon command (2 digit hex String) to send to the group.

#### insteon.sceneOn (group, [callback])

Turn on a scene group.

`group` is the controller group on the gateway for which to trigger the command.

#### insteon.sceneOnFast (group, [callback])

Turn on fast a scene group.

`group` is the controller group on the gateway for which to trigger the command.

#### insteon.sceneOff (group, [callback])

Turn off a scene group.

`group` is the controller group on the gateway for which to trigger the command.

#### insteon.sceneOffFast (group, [callback])

Turn off fast a scene group.

`group` is the controller group on the gateway for which to trigger the command.

#### insteon.sceneDim (group, [callback])

Dim by one step a scene group.

`group` is the controller group on the gateway for which to trigger the command.

#### insteon.sceneBrighten (group, [callback])

Brighten by one step a scene group.

`group` is the controller group on the gateway for which to trigger the command.


### Insteon Information Functions

#### insteon.info([id,] [callback])

Gets the product information about the gateway or a device. Product info object is returned in callback.

`id` is the id (6 digit hex String) of the device from which to get the product info.  If not provided, the gateway's product info will be returned.  

##### Example

```js
var insteon = Insteon('my.home.com');

// Get gateway info
insteon.info(function(error, info) {
  // For details on the info object see below.
});

// Get Device info
insteon.info('AABBCC', function(error, info) {
  // For details on the info object see below.
});
```

##### Info Object

```js
{
  id: String,
  firmware, String,
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

#### insteon.ping(id, [callback])

Sends a Insteon ping to a device. Response object is returned in the callback, if the ping was successful.

`id` is the id (6 digit hex String) of the device from which to get the product info.

#### insteon.version(id, [callback])

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

**NOTE:** Lighting function have been moved into their own class.

#### insteon.light(id)

Creates a lighting object for the gateway. Use this to access all lighting control.

`id` is the id (6 digit hex String) of the light switch.

#### light.turnOn([level, [rate,]] [callback])

Turns an Insteon dimmer switch on to the provided level

`level` is the percentage (0-100) of full to which the dimmer is set. Non-dimmable switches ignore this and turn on to full. Defaults to 100 percent.

`rate` is the speed at which the light is turned on to the provided `level`. If not provided, the default saved ramp rate of the device is used.  The rate value can either be 'slow', 'fast', or the number of milliseconds. 'fast' is 0.1 seconds.  'slow' is 1 minute.  If milliseconds is provided, the closest defined ramp rate less than the provided value is used.

#### light.turnOnFast([callback])

Turn light on fast (no ramp) to pre-saved level

#### light.turnOff([rate,] [callback])

Turns light off

`rate` is the speed the light turns off.  See `on` for values.

#### light.turnOffFast([callback])

Turns light off fast (no ramp)

#### light.brighten([callback])

Brightens the light one step

#### light.dim([callback])

Dims the light one step

#### light.level([level,] [callback])

Gets or sets the light's current level

`level` is the percentage (0-100) of full to which the dimmer is set. If not provided, then the current level of the device is returned in the callback.

##### Example

```js
var insteon = Insteon();

insteon.connect('my.home.com', function () {

  var light = insteon.light('AABBCC'); // Create light object

  light.level(50) // Set light level
  .then(function() {
    return light.level(); // Get light level
  })
  .then(function(level){
    console.log(level); // 50
  });
});
```

### Insteon Thermostat Functions

#### insteon.thermostat(id)

Creates a Thermostat object with the Insteon id.

`id` is the id (6 digit hex String) of the thermostat.

#### thermostat.tempUp([change,] [callback])

Increases the setpoints by `change`. If `change` is not provided increases the setpoints by 1 degree.

`change` is the number of degrees to increase the setpoints. Defaults to 1.

#### thermostat.tempDown([change,] [callback])

Decreases the setpoints by `change`. If `change` is not provided decreases the setpoints by 1 degree.

`change` is the number of degrees to decrease the setpoints. Defaults to 1.

#### thermostat.temp([zone,] [callback])

Gets the current air temperature for the `zone`.  If no `zone` is provided, the default zone (0) is assumed.

`zone` is the zone number. Defaults to 0.

#### thermostat.setpoints([zone,] [callback])

Gets the current setpoints for the `zone`.  If no `zone` is provided, the default zone (0) is assumed. setpoints are provided as an array of either one or two setpoints depending on the mode.

`zone` is the zone number. Defaults to 0.

#### thermostat.mode([mode,] [callback])

Gets or sets the mode. If no `mode` parameter is provided then the current mode is returned.

`mode` can be one of the following: 'off', 'heat', 'cool', 'auto', 'fan', 'program', 'program heat', 'program cool', or 'fan auto'.  

*Note: Not all thermostats support all modes.*

#### thermostat.coolTemp(temperature, [callback])

Sets the cool temperature setpoint to `temperature`.

`temperature` is the integer value to set the cool setpoint to.

#### thermostat.heatTemp(temperature, [callback])

Sets the heat temperature setpoint to `temperature`.

`temperature` is the integer value to set the heat setpoint to.

#### thermostat.highHumidity(level, [callback])

Sets the high humidity to `level`.

`level` is the integer value from 1 to 100.

#### thermostat.lowHumidity(level, [callback])

Sets the low humidity to `level`.

`level` is the integer value from 1 to 100.

#### thermostat.backlight(delay, [callback])

Sets how long the backlight will stay lite to `delay` in seconds

`delay` is the integer value in seconds for how long the backlight should stay lite. A value of 0 turns off the backlight.

#### thermostat.cycleDelay(delay, [callback])

Sets how long to delay between cycles.

`delay` is the integer value in minutes for how long to delay between cycles.

#### thermostat.energyChange(change, [callback])

Sets how many degrees change should been applied when the thermostat is in engery saving mode.

`change` is the integer value in degrees of change.

#### thermostat.date(date, [callback])

Sets the date (day of week, hour, minute, seconds).

`date` is the Date object to set the thermostat to.  If `date` is not a Date object, it is converged to a Date object with `new Date(date)`.  The default value is `new Date()`.

#### thermostat.details(change, [callback])

Gets all the details about the thermostat.  The returned default object is described below:

```js
{
  date: {
    day: Number, // 0-6 (0=Sunday, 1=Monday, ...)
    hour: Number, // 0-23
    minute: Number, // 0-59
    seconds: Number, // 0-59
  },
  mode: String, // 'off', 'auto', 'heat', 'cool', 'program'
  fan: Boolean, // if fan mode is on, true; if fan mode is auto, false
  setpoints: {
    cool: Number,
    heat: Number,
    highHumidity: Number,
    lowHumidity: Number
  },
  humidity: Number, // Current air humidity
  temperature: Number, // Current air temperature
  unit: String, // 'F' or 'C'
  cooling: Boolean, // true if the system is currently cooling
  heating: Boolean, // true if the system is currently heating
  energySaving: Boolean, // true if energy saving mode is active
  hold: Boolean, // true if hold is enabled
  backlight: Number, // Backlight delay before turning off
  delay: Number, // Delay between cycles
  energyOffset: Number // Number of degree to change the temperature by in energy mode
}
```


### Insteon Core Functions

*For advanced users only.  These function are leveraged by the higher level functions.*

#### insteon.sendCommand(command, [timeout,] [callback])

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
    controller: Boolean,
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
      controller: Boolean,
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

#### insteon.directCommand(id, command, [param,] [timeout,] [callback])

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
