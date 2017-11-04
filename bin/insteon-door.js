var Insteon = require('../').Insteon;
var host = 'COM10';

function logAllEmitterEvents(eventEmitter)
{
    var emitToLog = eventEmitter.emit;

    eventEmitter.emit = function () {
        var event = arguments[0];
        console.log('event emitted: ' + event);
        emitToLog.apply(eventEmitter, arguments);
    };
}

console.log('Connecting to ' + host);
var gw = new Insteon();

gw.on('connect', function () {
  var d = gw.door('2d4a42');
  logAllEmitterEvents(d);

  gw.info('2d4a42', function(err, info) {
    console.log('err', err);
    console.log('info', info);
  });
  /*

  console.log('Listening for events');*/
});

gw.on('close', function() {
  console.log('Connection closed');
});

gw.serial(host);
