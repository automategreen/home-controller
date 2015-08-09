home-controller [![Build Status](https://travis-ci.org/automategreen/home-controller.png)](https://travis-ci.org/automategreen/home-controller)
===============
> a node package to control Insteon home automation devices
> 
> **WARNING** The new Insteon Hub (2245) does NOT have the required PLM over TCP interface.
***

Overview
--------

home-controller is a node package to control Insteon home automation devices.  The API uses the direct PLM connection over TCP, Serial connection or the cloud.  To control the Insteon devices on of the following is needed

  - [Automate Green WiFi Hub i](https://github.com/automategreen/hub-i)
  - [Automate Green PLM WiFi Adapter](http://blog.automategreen.com/post/plm-wifi-adapter)  - [Insteon Hub 2242](http://www.insteon.com/2242-222-insteon-hub.html)
  - [Insteon SmartLinc](http://www.insteon.com/2412n-smartlinc-central-controller.html)
  - [Insteon PowerLinc Modem](http://www.insteon.com/2412s-powerlinc-modem-serial.html) is required.

**The new Insteon Hub 2245 is not supported.  Insteon has removed the PLM over TCP interface.**

Table of Contents
-----------------

- [Overview](#overview)
- [Features](#features)
- [Getting Started](#getting-started)
- [API](#api)
  + [Insteon Gateway](#insteon-gateway)
  + [Linking Functions](#linking-functions)
  + [Scene Functions](#scene-functions)
  + [Information Functions](#information-functions)
  + [Lighting Functions](#lighting-functions)
  + [Fan Functions](#fan-functions)
  + [Lighting Events](#lighting-events)
  + [Thermostat Functions](#thermostat-functions)
  + [Thermostat Events](#thermostat-events)
  + [Motion Sensor Functions](#motion-sensor-functions)
  + [Motion Sensor Events](#motion-sensor-events)
  + [Door (Open/Close) Sensor Functions](#door-openclose-sensor-functions)
  + [Door Sensor Events](#door-sensor-events)
  + [Leak Sensor Functions](#leak-sensor-functions)
  + [Leak Sensor Events](#leak-sensor-events)
  + [Meter Functions](#meter-functions)
  + [IO Sensor and Actuator Functions](#io-sensor-and-actuator-functions)
  + [Core Functions](#core-functions)
- [Testing](#testing)
- [References](#references)

Features
--------

- Device and Gateway Info
- Linking and Group Control
- Scene Control
- Lighting Control
- Thermostat Control
- Sensor Control

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

**0.6.0 Update Hightlights:**

  - Add support for IO
  - Add support for FanLinc (light)
  - Add support for Node 0.12
  - Add support for Spark based devices
  - Bug fixes

**0.5.2 Update Hightlights:**

  - Add support for iMeter (meter)

**0.5 Update Hightlights:**

  - Add events for devices
  - Add sensors support (motion, door, & leak)
  - Node.js 0.11 support
  - As always, a few bug fixes

**0.4.3 Update Highlights:**

  - Add thermostat.status()
  - Several bug fixes

**0.4.2 Update Highlights:**

  - Add connect.serial()

**0.4 Update Highlights:**

  - Major refactoring of the code structure.
  - All functions return promises (via [Q](https://github.com/kriskowal/q)). The callback function is now optional.
  - The lighting function have been moved to the light class.  Old function are deprecated and will be removed with a later release.
  - Thermostat control is now available
  - As always, several bug were fixed (and probably several new one introduced).  Please open an issue if you find a bug.
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


##### Examples

```js
var insteon = new Insteon();
insteon.connect('192.168.10.10', function(){
  console.log('Connected!');
});
```

#### insteon.serial(comName, [options], [connectListener])

Creates a connection to a PowerLinc USB driver residing at the specified USB serial device.
The 'options' parameter, if present, contains values suitable for use with the
[serialport](https://github.com/voodootikigod/node-serialport)
[constructor](https://github.com/voodootikigod/node-serialport#to-use).
The 'connectListener' parameter, if present, will be invoked once the connection is open;

**Warning** serialport is not supported in all environments. Verify serialport installed successfully before using this functionality.

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


#### insteon.emitOnAck

By default, events will be emitted for both device triggered (button presses) and hub triggered actions.  If you don't want that behavior, disable it by setting `emitOnAct` to false.


**Example:**
```js
var hub = new Insteon();
var light = hub.light('112233');

hub.connect(...);

light.turnOn(); // Emits 'turnOn' event

hub.emitOnAck = false; // Disables events on command ack

light.turnOn(); // Does not emit event
```


#### insteon.emitDuplicates

By default, duplicate events for devices will be suppressed.  If you want to see the duplicate events, you must enable them by setting `emitDuplicates` to true.


**Example:**
```js
var hub = new Insteon();

hub.emitDuplicates = true; // Enabled duplicate events
```



### Linking Functions

#### insteon.link([device,] [options,] [callback])

Links device(s) to gateway

Callback return link object as second argument (see `insteon.links`).

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
insteon.link('gw', ['111111', '222222', '333333'], function(error, link) {
  // link data from last responder, 33.33.33
})

// Link device to gateway
insteon.link('ABCDEF', 'gw', function(error, link) {
  // link data from gateway
});

// Shorthand to link gateway to unknown device
insteon.link(function(error, link) { // link('gw', null, fn)
  // link data from unknown device (responder)
});

// Link unknown device to gateway (same as link(null, 'gw', fn))
insteon.link(null, 'gw', function(error, link) {
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

Creates scene controller with responder(s)

All devices must be available and linked to the gateway.

`controller` is the device to setup as controller.  It can either be a device id (6 digit hex String), the string 'gw', or null.  If a device id is provided, the device will be configured as the controller.  If controller is `'gw'` the gateway will be configured as the controller.

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
	remove: boolean // remove existing responders (default: false)
}
```

`group` is the controller group to link the responders to.  Valid group numbers vary by device type.  The hub supports group numbers 0-255. Default is 1.

`remove` is the boolean flag used to delete a responder(s) from the scene.

#### insteon.sendAllLinkCmd (group, command, [callback])

Sends an Insteon All-link command for a link group

Used by sceneXX commands.

`group` is the controller group on the gateway for which to trigger the command.

`command` is the insteon command (2 digit hex String) to send to the group.

#### insteon.sceneOn (group, [callback])

Turn on a scene group

`group` is the controller group on the gateway for which to trigger the command.

#### insteon.sceneOnFast (group, [callback])

Turn on fast a scene group

`group` is the controller group on the gateway for which to trigger the command.

#### insteon.sceneOff (group, [callback])

Turn off a scene group

`group` is the controller group on the gateway for which to trigger the command.

#### insteon.sceneOffFast (group, [callback])

Turn off fast a scene group

`group` is the controller group on the gateway for which to trigger the command.

#### insteon.sceneDim (group, [callback])

Dim by one step a scene group

`group` is the controller group on the gateway for which to trigger the command.

#### insteon.sceneBrighten (group, [callback])

Brighten by one step a scene group

`group` is the controller group on the gateway for which to trigger the command.


### Information Functions

#### insteon.info([id,] [callback])

Gets the product information about the gateway or a device

Product info object is returned in callback.

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

Sends a Insteon ping to a device

Response object is returned in the callback, if the ping was successful.

`id` is the id (6 digit hex String) of the device from which to get the product info.

#### insteon.version(id, [callback])

Gets the version information about a device

Version object is returned in callback. Valid version names are i1, i2, and i2cs.

`id` is the id (6 digit hex String) of the device from which to get the product info.

##### Version Object

```js
{
  code: Number,
  name, String,
}
```

### Lighting Functions

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

### Fan Functions

Fan functions are part of the light class.  The FanLinc is more or less a dimmer with fan control.  All the normal dimmer controls work the same.

#### light.fanOn([callback]), light.fanMedium([callback]), light.fan('medium', [callback])

Turn the fan on to medium speed

#### light.fanOff([callback]), light.fan('off', [callback])

Turn the fan off

#### light.fanLow([callback]), light.fan('low', [callback])

Turn the fan on to low speed

#### light.fanHigh([callback]), light.fan('high', [callback])

Turn the fan on to high speed


### Lighting Events

#### Events Overview

The light object allows you to trigger on events from the device. This allows for functionality such as, send me a text when my light is turned on. Why would you want this?  I don't know, but I'll just assume you're a little crazy.

**Example:**
```js
var hub = new Insteon();
var light = hub.light('112233');

light.on('turnOn', function () {
  sendTxt('My light is on');
});

hub.connect(...);
```

There are several event's that could tell you your lights are on.  You may want the text for all of them (again crazy).

**Example:**
```js
var hub = new Insteon();
var light = hub.light('112233');

light.on('turnOn', sendOnTxt);
light.on('turnOnFast', sendOnTxt);
light.on('brightened', sendOnTxt);

function sendOnTxt() {
  sendTxt('My light is on');
}

hub.connect(...);
```


#### Event: 'turnOn'

Event emitted when a light's on button is tapped once

**Callback arguments**

- `group` the group/button for which the command was sent
- `level` if provided, the level to which the light was turned on. Not provided for device trigged events.

#### Event: 'turnOnFast'

Event emitted when a light's on button is tapped twice

**Callback arguments**

- `group` the group/button for which the command was sent

#### Event: 'turnOff'

Event emitted when a light's off button is tapped once

**Callback arguments**

- `group` the group/button for which the command was sent

#### Event: 'turnOffFast'

Event emitted when a light's off button is tapped twice

**Callback arguments**

- `group` the group/button for which the command was sent

#### Event: 'brightening'

Event emitted when a light's on button is held

**Callback arguments**

- `group` the group/button for which the command was sent

#### Event: 'brightened'

Event emitted when a light's on button is released

**Callback arguments**

- `group` the group/button for which the command was sent

#### Event: 'dimming'

Event emitted when a light's off button is held

**Callback arguments**

- `group` the group/button for which the command was sent

#### Event: 'dimmed'

Event emitted when a light's off button is released

**Callback arguments**

- `group` the group/button for which the command was sent

#### Event: 'command'

Generic event emitted when a device generates a command

Only needed if you want direct access to the command data.

**Callback arguments**

- `group` the group/button for which the command was sent
- `command1` the first command (the command type)
- `command2` the second command (the command options)


### Thermostat Functions

#### insteon.thermostat(id)

Creates a Thermostat object with the Insteon id

`id` is the id (6 digit hex String) of the thermostat.

#### thermostat.tempUp([change,] [callback])

Increases the set point by `change`

If `change` is not provided, increases the set point by 1 degree.

`change` is the number of degrees to increase the set point. Defaults to 1.

#### thermostat.tempDown([change,] [callback])

Decreases the set point by `change`

If `change` is not provided, decreases the set point by 1 degree.

`change` is the number of degrees to decrease the set point. Defaults to 1.

#### thermostat.temp([zone,] [callback])

Gets the current air temperature for the `zone`

If no `zone` is provided, the default zone (0) is assumed.

`zone` is the zone number. Defaults to 0.

#### thermostat.setpoints([zone,] [callback])

Gets the current set points for the `zone`

If no `zone` is provided, the default zone (0) is assumed. Set points are provided as an array of either one or two set points depending on the mode.

`zone` is the zone number. Defaults to 0.

#### thermostat.mode([mode,] [callback])

Gets or sets the mode

If no `mode` parameter is provided, then the current mode is returned.

`mode` can be one of the following: 'off', 'heat', 'cool', 'auto', 'fan', 'program', 'program heat', 'program cool', or 'fan auto'.  

*Note: Not all thermostats support all modes.*

#### thermostat.coolTemp(temperature, [callback])

Sets the cool temperature set point to `temperature`

`temperature` is the integer value to set the cool set point to.

#### thermostat.heatTemp(temperature, [callback])

Sets the heat temperature set point to `temperature`

`temperature` is the integer value to set the heat set point to.

#### thermostat.highHumidity(level, [callback])

Sets the high humidity to `level`

`level` is the integer value from 1 to 100.

#### thermostat.lowHumidity(level, [callback])

Sets the low humidity to `level`

`level` is the integer value from 1 to 100.

#### thermostat.backlight(delay, [callback])

Sets how long the back light will stay lit to `delay` in seconds

`delay` is the integer value in seconds for how long the back light should stay lite. A value of 0 turns off the back light.

#### thermostat.cycleDelay(delay, [callback])

Sets how long to delay between cycles

`delay` is the integer value in minutes for how long to delay between cycles.

#### thermostat.energyChange(change, [callback])

Sets how many degrees change should be applied when the thermostat is in energy saving mode

`change` is the integer value in degrees of change.

#### thermostat.date(date, [callback])

Sets the date (day of week, hour, minute, seconds)

`date` is the Date object to set the thermostat to.  If `date` is not a Date object, it is converged to a Date object with `new Date(date)`.  The default value is `new Date()`.

#### thermostat.details([callback])

Gets all the details about the thermostat

The returned details object is described below:

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

#### thermostat.status([callback])

Gets the status of the thermostat. This is a subset of `.details()`, but it only requires a single Insteon command (i.e. faster).  The returned status object (subset of details object) is described below:

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
    heat: Number
  },
  humidity: Number, // Current air humidity
  temperature: Number, // Current air temperature
  unit: String, // 'F' or 'C'
  cooling: Boolean, // true if the system is currently cooling
  heating: Boolean, // true if the system is currently heating
  energySaving: Boolean, // true if energy saving mode is active
  hold: Boolean, // true if hold is enabled
}
```


### Thermostat Events

#### Events Overview

The thermostat object allows you to trigger on events from the device. If you want to know how many times a day your AC turns on, you can count the 'cooling' events.

**Example:**
```js
var hub = new Insteon();
var thermostat = hub.thermostat('112233');

var count = 0;
thermostat.on('cooling', function () {
  console.log('AC turned count:' ++count);
});

hub.connect(...);
```

#### thermostat.monitor([enable,] [next])

By default, the thermostat will not send events to the hub.  You must enable this functionality.  This can be done with the `.monitor()` function.  This only needs to be done once.

`enable` is a boolean flag that can be used to control if monitoring is enabled or disabled by the function.  Passing a value of `false` disables monitoring. The default value is `true`.

**Example:**
```js
var hub = new Insteon();
var thermostat = hub.thermostat('112233');

hub.connect(host, function () {
  thermostat.monitor();
});
```


#### Event: 'cooling'

Event emitted when the thermostat starts cooling

#### Event: 'heating'

Event emitted when the thermostat starts heating

#### Event: 'off'

Event emitted when the thermostat stops heating or cooling (i.e. System is off.)

#### Event: 'highHumidity'

Event emitted when humidity goes above the high humidity set point

#### Event: 'lowHumidity'

Event emitted when humidity goes below the low humidity set point

#### Event: 'normalHumidity'

Event emitted when humidity returns to normal levels (i.e. Humidity is between high and low set points.)


### Motion Sensor Functions

#### insteon.motion(id)

Creates a Motion object with the Insteon id

`id` is the id (6 digit hex String) of the motion sensor.

#### `wait` parameter

All function for the motion sensor have an optional `wait` parameter.  This parameter is used to control when the command is sent to the sensor.  The sensor is normally sleeping and cannot receive commands.  

If `wait` is true, then the command will not be sent until activity is detected (i.e. the sensor is awake). **Default Behavior**

If `wait` is false, the command will be sent immediately and the sensor must be in an active state.  Typically, this is done by setting the sensor into linking mode (Hold the set button until LED flashes. Then tap set button. The LED should be double blinking.)

#### motion.status([wait], [callback])

Gets the status of the motion sensor

The returned status object is described below:

```js
{
  ledLevel: Number, // 0 to 100
  clearTimer: Number, // seconds in 30 second increments
  duskThreshold: Number, // 0 to 100 - light level at to trigger dawn/dusk 
  options: {
    occupancyMode: Boolean, // 'motion' event every ~4 sec
    ledOn: Boolean, // turn on or off the LED when motion is detected
    nightMode: Boolean, // Only send events when light level is below threshold
    onOnlyMode: Boolean // Only send 'motion' events - no 'clear' event
  },
  jumpers: {
    j1: Boolean,
    j2: Boolean,
    j3: Boolean,
    j4: Boolean,
    j5: Boolean
  },
  lightLevel: Number, // 0 to 100 - Current light level
  batteryLevel: Number, // Approximate voltage
}
```

#### motion.options(options, [wait], [callback])

Sets the configurable motion sensor options

`options` is the options object.  Below are the defaults:

```js
{
  occupancyMode: false,
  ledOn: true,
  nightMode: false,
  onOnlyMode: false
}
```

#### motion.clearTimer(timeout, [wait], [callback])

Sets the clear timer timeout for the motion sensor

`timeout` is the timeout value in seconds (rounded up to nearest 30 second interval).  Defaults to 30 seconds (minimum value)


#### motion.duskThreshold(threshold, [wait], [callback])

Sets the dusk light level threshold for the motion sensor

`threshold` is the light level (0 to 100) to trigger the dawn/dusk event.

### Motion Sensor Events

#### Events Overview

The motion object allows you to trigger on events from the device.

#### Event: 'motion'

Event emitted when motion is detected

#### Event: 'clear'

Event emitted when clear timer expires after motion was detected

#### Event: 'dawn'

Event emitted when the light level crosses the dusk threshold from night to day

#### Event: 'dusk'

Event emitted when the light level crosses the dusk threshold from day to night

#### Event: 'battery'

Event emitted when the battery is low


### Door (Open/Close) Sensor Functions

#### insteon.door(id)

Creates a Door object with the Insteon id

`id` is the id (6 digit hex String) of the door sensor.

### Door Sensor Events

#### Event: 'opened'

Event emitted when the sensor is opened

#### Event: 'closed'

Event emitted when the sensor is closed

#### Event: 'heartbeat'

Event emitted every 24 hours by the sensor to inform you it is alive

A 'opened' or 'closed' event is also emitted depending on the state provided by the heartbeat event.

### Leak Sensor Functions

#### insteon.leak(id)

Creates a Leak object with the Insteon id

`id` is the id (6 digit hex String) of the motion sensor.

### Leak Sensor Events

#### Event: 'dry'

Event emitted when the sensor no longer detects moisture

#### Event: 'wet'

Event emitted when the sensor detects moisture

The event is emitted every 15 seconds while water is present

#### Event: 'heartbeat'

Event emitted every 24 hours by the sensor to inform you it is alive

A 'wet' or 'dry' event is also emitted depending on the state provided by the heartbeat event.



### Meter Functions

Functions to control Insteon's iMeter.

#### insteon.meter(id)

Creates a Meter object with the Insteon id

`id` is the id (6 digit hex String) of the meter.

#### meter.status([callback])

Gets the status of the meter

The returned status object is described below:

```js
{
  energy: Number, // Accumulated energy in kW-hours
  power: Number // Current power in watts
}
```

#### meter.reset([callback])

Resets the energy accumulation

#### meter.statusAndReset([callback])

Combines the status and reset commands


### IO Sensor and Actuator Functions

#### insteon.io(id)

Creates an IO object with the Insteon id

`id` is the id (6 digit hex String) of the IO sensor/actuator.

### IO Sensor Events

Not implemented yet.

### IO Functions

#### io.on(port)

Turns on the actuator port.  For a relay device like the EZIO4O, this command activates the relay numbered `port`.

#### io.off(port)

Turns off the actuator port.  For a relay device like the EZIO4O, this command resets the relay numbered `port`.

#### io.set(data)

Sets all actuator ports based on the data number. Each port is represented by one bit in the data.  E.G. the data value `13` will clear all ports except ports 0, 1, and 4, which will be set.


### Core Functions

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
