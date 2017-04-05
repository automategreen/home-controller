/**
 * HTTP client for the Insteon hub 2245
 *
 * This client is somewhat unique in that it is trying to access a simple GET-based
 * API which is a bridge to the insteon Serial PLM inside the hub.
 *
 * This implementation is mainly made complex because the hub's HTTP API is
 * single-threaded, and will not accept more than a single TCP connection,
 * and Node's callback-based implementation of an HTTP client means we need
 * to do our own tracking and queueing to implement our own "single threaded"
 * implementation which never tries to make concurrent requests to the hub.
 */
var Q = require('q');
var http = require('http');
var debug = require('debug')('home-controller:http');
var utils = require('./utils');

function httpClient(insteon, config, connectListener) {
  var maxDelay = config.maxDelay || 5000;
  var knownBufferPage = '';
  var inRequest = false;
  var running = true;
  var queue = [];
  var currentDelay = 100;
  var agent = new http.Agent({
    maxSockets: 1,  // Most important config: insteon hub does not like having tons of sockets
    keepAlive: true,
    keepAliveMsecs: 5000 // Be nice and give the socket back in 5sec.
  });

  var defaultOptions = {
    agent: agent,
    hostname: config.host,
    port: config.port
  };
  if (config.user) {
    defaultOptions.auth = config.user + ':' + config.password;
  }

  function httpOptions(x) { return utils.assignDefaults(defaultOptions, x); }

  function finish() {
    inRequest = false;
    if (queue.length) {
      getData(queue.shift());
    }
  }

  function getData(input) {
    var deferred = input._promise || Q.defer();
    if (inRequest) {
      input._promise = deferred;
      queue.push(input);
      return deferred.promise;
    }
    debug('making request', input.options.path);
    inRequest = true;
    http.request(input.options, function(response) {
      if (response.statusCode !== 200) {
        var err = new Error('Status code expected 200, got ' + response.statusCode);
        err.response = response;
        deferred.reject(err);
        return finish();
      }

      var rawData = '';

      response.on('data', function(chunk) {
        rawData += chunk;
      });

      response.on('end', function() {
        deferred.resolve(rawData, response);
        finish();
      });
    }).on('error', function(err) {
      finish();
      deferred.reject(err);
    }).end();

    return deferred.promise;
  }

  function clearBuf() {
    debug('buffer clearing');
    return getData({
      options: httpOptions({path: '/1?XB=M=1'}),
    });
  }


  function fetchBuf() {
    return getData({
      options: httpOptions({path: '/buffstatus.xml'})
    }).then(function(data) {
      // data looks like <response><BS>(202 characters of hex)</BS></response>
      // in lieu of using an XML parser adding another library dependency, we will
      // just use a bit of regex to parse it.
      var raw = /BS>([^<]+)<\/BS/g.exec(data)[1];
      if (raw.length === 202) {
        // The last 2 bytes are the length of 'good' data
        var length = parseInt(raw.substr(200), 16);
        raw = raw.substring(0, length);
      }
      var result = raw;
      if (knownBufferPage.length && raw.substring(0, knownBufferPage.length) === knownBufferPage) {
        result = raw.substr(knownBufferPage.length);
      }
      knownBufferPage = raw;
      if (result.length) {
        debug('good buffer', result);
        insteon.buffer += result;
        insteon.checkStatus();
        currentDelay = 100;
      }

      if (raw.length > 30) {
        return clearBuf();
      }
    });
  }


  function delayFetch() {
    if (!running) {
      return;
    }
    if (!inRequest) {
      fetchBuf();
    }
    if (currentDelay < maxDelay) {
      currentDelay += 100;
    }
    setTimeout(delayFetch, currentDelay);
  }

  insteon.write = function(hex) {
    return getData({ options: httpOptions({path: '/3?' + hex + '=I=3'}) })
      .then(function() {
        debug('command sent');
        currentDelay = 0;
        setTimeout(fetchBuf, 50); // It's typical to need at least 50ms to see a result
      });
  };

  insteon.close = function(had_error) {
    running = false;
    currentDelay = 0;
    // Running an extra fetchBuf ensures queue is cleared
    return fetchBuf().then(function() {
      // Shutdown after all delays are done
      agent.destroy();
      insteon.emit('close', had_error);
    });
  };

  // Start up the event loop by first clearing the insteon buffer and then fetching events.
  // It would be neat to not clear the buffer, except that some commands that arrive before
  // there is a 'status' object would bork our system.
  return clearBuf()
    .then(function() {
      delayFetch();
      if (connectListener) {
        connectListener();
      }
    });
}

module.exports = httpClient;
