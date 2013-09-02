var Insteon = require('../').Insteon;
var should = require('should');
var nock = require('nock');

var TEST_INSTEON_HOST = 'home.brandongoode.com';
var TEST_INSTEON_PORT = 25105;
var TEST_DEVICE_ID = '23C70B';
var TEST_USERNAME = 'admin';
var TEST_PASSWORD = 'password';

describe('Insteon Gateway', function() {
  this.timeout(16000);

  afterEach(function() {
    nock.cleanAll();
  });

  it('has a url property', function() {
    var gw = new Insteon('192.168.1.200');

    should.exist(gw.url);
    gw.url.should.equal('http://192.168.1.200');

  });

  it('has a url property with a port', function() {
    var gw = new Insteon('192.168.1.200', 8080);

    should.exist(gw.url);
    gw.url.should.equal('http://192.168.1.200:8080');

  });

  // it('get the profile of a valid gateway', function(done) {
  //   var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

  //   nock(gw.url)
  //   .get('/network.htm')
  //   .reply(200, "<html><head><title>Current Version: Alert 2.6</title>\r\n<link href=\"styles.css\" rel=\"stylesheet\" type=\"text/css\">\r\n<script language=\"JavaScript\" SRC=\"myJS.js\"></script>\r\n<script language=\"JavaScript\">\r\nfunction UpdateStatusF(xmlData)\r\n{\r\ndocument.getElementById('FRT').innerHTML = getXMLValue(xmlData, 'FRT');\r\ndocument.getElementById('DAY').innerHTML = getXMLValue(xmlData, 'DAY');\r\nsetTimeout(\"newAJAXCommand('status.xml', UpdateStatusF)\",1000);\r\n}\r\nvar HA = new Array;\r\nHA[0] = \"MyHouse\";\r\nHA[1] = \" General Settings\";\r\nHA[2] = \"00:18\";\r\nvar CD = new Array;\r\nCD[0] = \"false\";\r\nCD[1] = \"true\";\r\nCD[2] = \"false\";\r\nCD[3] = \"false\";\r\nCD[4] = \"false\";\r\nCD[5] = \"false\";\r\nCD[6] = \"false\";\r\nfunction UpdateAll()\r\n{\r\nvar datastr=\"1?D=1=1\";\r\nvar c;\r\nvar str;\r\nfor(c=1;c<=7;c++)\r\n{\r\nstr = \"TD\"+c;\r\nif(document.getElementById(str).checked)\r\n   datastr +=\"=t\";\r\nelse\r\n   datastr +=\"=f\";\r\n}\r\nnewAJAXCommand(datastr);\r\n}\r\n\r\nfunction UpdateDOWChecks()\r\n{\r\nfor (var i=1;i<=7;i++)\r\n    if(CD[i-1] == \"true\")   document.getElementById('TD'+i).checked = true;\r\n    else                   document.getElementById('TD'+i).checked = false;\r\n}\r\n</script></head>\r\n<body bgcolor=\"#F4F4F4\"  onload=\"MakeHeader();UpdateDOWChecks();newAJAXCommand('status.xml', UpdateStatusF);setTimeout(_scrollToTop, 100);\">\r\n<div id=\"Y\"> </div>\r\n<center>\r\n<br>\r\n<table><tr><td>\r\n<span class='spans' id=\"FRT\">00:18:25</span></td><td>\r\n<span class='spans' id=\"DAY\">  Tuesday</span></td></tr></table>\r\n<br><br>\r\n<table cellpadding=\"6\" >\r\n<tr><td><input type='button' class='smbuttons' value='Set Time'onclick='newAJAXCommand(\"1?TD=\"+document.getElementById(\"TD\").value+\"=1\"+\"=\"+document.getElementById(\"TDA\").checked+document.getElementById(\"TDP\").checked)' ></td>\r\n<td class ='set'>\r\n<input type='text' class='itext' value = '00:18' id='TD' size='5'MAXLENGTH = '5'></input>\r\n<input type='Radio' name = 'ADT' class='bc'id='TDA'>AM \r\n<input type='Radio' name = 'ADT' class='bc'id='TDP'>PM</td></tr>\r\n<tr><td><input type='button' class='smbuttons' value='Set Day'onclick='UpdateAll()'></td>\r\n<td colspan=\"2\" class=\"cb\">\r\n<input type=\"Radio\" class='bc'id=\"TD1\" name=\"days\" value=\"1\" >Mon\r\n<input type=\"Radio\" class='bc'id=\"TD2\" name=\"days\" value=\"2\" >Tue\r\n<input type=\"Radio\" class='bc'id=\"TD3\" name=\"days\" value=\"3\" >Wed\r\n<input type=\"Radio\" class='bc'id=\"TD4\" name=\"days\" value=\"4\" >Thur\r\n<input type=\"Radio\" class='bc'id=\"TD5\" name=\"days\" value=\"5\" >Fri\r\n<input type=\"Radio\" class='bc'id=\"TD6\" name=\"days\" value=\"6\" >Sat\r\n<input type=\"Radio\" class='bc'id=\"TD7\" name=\"days\" value=\"7\" >Sun\r\n</td></tr>\r\n<tr><td><input type='button'  class='smbuttons' value='Set House Name'onclick='newAJAXCommand(\"1?MY=\"+document.getElementById(\"MY\").value+\"=1\")' ></td>\r\n<td><input type='text' value = \"MyHouse\" class='itext' id='MY' size='15'MAXLENGTH='15'></td></tr></table><br><br>\r\n<a href='sun.htm?01=01=FN'class='smbuttons'>Los Angeles, CA 05/07</a><br><br>\r\n<input type='button'  class='smbuttons' value='Back to Last Room' onclick=(location.href='r01.htm')><br><br>\r\n<a href='x10.htm' class='smbuttons'target='_blank'>Open X10 Controller</a><br><br>\r\n<a href='rooms.htm'><img class ='icons' src = 'addroom.gif' border='0'></a><br>\r\n<a class = 'set' href='rooms.htm'>Setup Rooms</a><br><br>\r\n<span class=\"spans\">Current Network Settings</span>\r\n<table cellpadding=\"3\" class='sspans'>\r\n<tr><td>PLM Version:</td><td id=\"PV\">9C</td></tr>\r\n<tr><td>Firmware Version:</td><td id=\"EV\">4.8A Build Feb 08 2013</td></tr>\r\n<tr><td>Insteon ID:</td><td id=\"II\">1E.B5.52</td></tr>\r\n<tr><td>MAC Address:</td><td id=\"MA\">00:0E:F3:1E:B5:52</td></tr>\t\r\n<tr><td>Port:</td><td id=\"PT\">25105</td></tr>\t\r\n<tr><td>Mask:</td><td id=\"MK\">255.255.255.0</td></tr>\t\r\n<tr><td>DHCP:</td><td id=\"MK\">Enabled</td></tr>\t\r\n<tr><td>GateWay:</td><td id=\"GW\">192.168.1.1</td></tr>\t\r\n<tr><td>IP:</td><td id=\"IP\">192.168.1.73</td></tr></table><br><br>\r\n<a href='config.htm' class='smbuttons'>Change Network Settings</a><br><br>\r\n<a href='mpfsupload' class='smbuttons'>Download New Application Version</a><br><br>\r\n<span class=\"spans\">Version: Alert 2.6 YF</span><br><br>\r\n<a href='a.htm' class='smbuttons'>Authentication</a><br><br>\r\n<div id=\"foot\"> </div></body></html>", { connection: 'close',
  //     'content-type': 'text/html',
  //     'cache-control': 'no-cache',
  //     'access-control-allow-origin': '*' });



  //   gw.profile(function(err, profile){
  //     should.not.exist(err);
  //     should.exist(profile);
  //     profile.plmVersion.should.equal('9C');
  //     profile.firmwareVersion.should.equal('4.8A Build Feb 08 2013');
  //     profile.insteonId.should.equal('1EB552');
  //     done();
  //   });
  // });



  it('gets the gateway info', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0260=I=3')
    .reply(200, "", { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, "<response><BS>02601EB55203379C060000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n", { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' });


    gw.info(function (err, info) {
      should.not.exist(err);
      should.exist(info);
      info.firmwareVersion.should.equal('9C');
      info.id.should.equal('1EB552');
      info.deviceCategory.id.should.equal(3);
      info.deviceSubcategory.id.should.equal(55);
      done();
    });
  });


  // it('can use basic authentication', function(done) {
  //   var gw = new Insteon(
  //     TEST_INSTEON_HOST,
  //     TEST_INSTEON_PORT,
  //     TEST_USERNAME,
  //     TEST_PASSWORD);


  //   nock(gw.url)
  //   .matchHeader(
  //     'Authorization',
  //     'Basic ' +
  //     (new Buffer(TEST_USERNAME + ':' + TEST_PASSWORD).toString('base64')))
  //   .get('/network.htm')
  //   .reply(200, "<html><head><title>Current Version: Alert 2.6</title>\r\n<link href=\"styles.css\" rel=\"stylesheet\" type=\"text/css\">\r\n<script language=\"JavaScript\" SRC=\"myJS.js\"></script>\r\n<script language=\"JavaScript\">\r\nfunction UpdateStatusF(xmlData)\r\n{\r\ndocument.getElementById('FRT').innerHTML = getXMLValue(xmlData, 'FRT');\r\ndocument.getElementById('DAY').innerHTML = getXMLValue(xmlData, 'DAY');\r\nsetTimeout(\"newAJAXCommand('status.xml', UpdateStatusF)\",1000);\r\n}\r\nvar HA = new Array;\r\nHA[0] = \"MyHouse\";\r\nHA[1] = \" General Settings\";\r\nHA[2] = \"00:18\";\r\nvar CD = new Array;\r\nCD[0] = \"false\";\r\nCD[1] = \"true\";\r\nCD[2] = \"false\";\r\nCD[3] = \"false\";\r\nCD[4] = \"false\";\r\nCD[5] = \"false\";\r\nCD[6] = \"false\";\r\nfunction UpdateAll()\r\n{\r\nvar datastr=\"1?D=1=1\";\r\nvar c;\r\nvar str;\r\nfor(c=1;c<=7;c++)\r\n{\r\nstr = \"TD\"+c;\r\nif(document.getElementById(str).checked)\r\n   datastr +=\"=t\";\r\nelse\r\n   datastr +=\"=f\";\r\n}\r\nnewAJAXCommand(datastr);\r\n}\r\n\r\nfunction UpdateDOWChecks()\r\n{\r\nfor (var i=1;i<=7;i++)\r\n    if(CD[i-1] == \"true\")   document.getElementById('TD'+i).checked = true;\r\n    else                   document.getElementById('TD'+i).checked = false;\r\n}\r\n</script></head>\r\n<body bgcolor=\"#F4F4F4\"  onload=\"MakeHeader();UpdateDOWChecks();newAJAXCommand('status.xml', UpdateStatusF);setTimeout(_scrollToTop, 100);\">\r\n<div id=\"Y\"> </div>\r\n<center>\r\n<br>\r\n<table><tr><td>\r\n<span class='spans' id=\"FRT\">00:18:25</span></td><td>\r\n<span class='spans' id=\"DAY\">  Tuesday</span></td></tr></table>\r\n<br><br>\r\n<table cellpadding=\"6\" >\r\n<tr><td><input type='button' class='smbuttons' value='Set Time'onclick='newAJAXCommand(\"1?TD=\"+document.getElementById(\"TD\").value+\"=1\"+\"=\"+document.getElementById(\"TDA\").checked+document.getElementById(\"TDP\").checked)' ></td>\r\n<td class ='set'>\r\n<input type='text' class='itext' value = '00:18' id='TD' size='5'MAXLENGTH = '5'></input>\r\n<input type='Radio' name = 'ADT' class='bc'id='TDA'>AM \r\n<input type='Radio' name = 'ADT' class='bc'id='TDP'>PM</td></tr>\r\n<tr><td><input type='button' class='smbuttons' value='Set Day'onclick='UpdateAll()'></td>\r\n<td colspan=\"2\" class=\"cb\">\r\n<input type=\"Radio\" class='bc'id=\"TD1\" name=\"days\" value=\"1\" >Mon\r\n<input type=\"Radio\" class='bc'id=\"TD2\" name=\"days\" value=\"2\" >Tue\r\n<input type=\"Radio\" class='bc'id=\"TD3\" name=\"days\" value=\"3\" >Wed\r\n<input type=\"Radio\" class='bc'id=\"TD4\" name=\"days\" value=\"4\" >Thur\r\n<input type=\"Radio\" class='bc'id=\"TD5\" name=\"days\" value=\"5\" >Fri\r\n<input type=\"Radio\" class='bc'id=\"TD6\" name=\"days\" value=\"6\" >Sat\r\n<input type=\"Radio\" class='bc'id=\"TD7\" name=\"days\" value=\"7\" >Sun\r\n</td></tr>\r\n<tr><td><input type='button'  class='smbuttons' value='Set House Name'onclick='newAJAXCommand(\"1?MY=\"+document.getElementById(\"MY\").value+\"=1\")' ></td>\r\n<td><input type='text' value = \"MyHouse\" class='itext' id='MY' size='15'MAXLENGTH='15'></td></tr></table><br><br>\r\n<a href='sun.htm?01=01=FN'class='smbuttons'>Los Angeles, CA 05/07</a><br><br>\r\n<input type='button'  class='smbuttons' value='Back to Last Room' onclick=(location.href='r01.htm')><br><br>\r\n<a href='x10.htm' class='smbuttons'target='_blank'>Open X10 Controller</a><br><br>\r\n<a href='rooms.htm'><img class ='icons' src = 'addroom.gif' border='0'></a><br>\r\n<a class = 'set' href='rooms.htm'>Setup Rooms</a><br><br>\r\n<span class=\"spans\">Current Network Settings</span>\r\n<table cellpadding=\"3\" class='sspans'>\r\n<tr><td>PLM Version:</td><td id=\"PV\">9C</td></tr>\r\n<tr><td>Firmware Version:</td><td id=\"EV\">4.8A Build Feb 08 2013</td></tr>\r\n<tr><td>Insteon ID:</td><td id=\"II\">1E.B5.52</td></tr>\r\n<tr><td>MAC Address:</td><td id=\"MA\">00:0E:F3:1E:B5:52</td></tr>\t\r\n<tr><td>Port:</td><td id=\"PT\">25105</td></tr>\t\r\n<tr><td>Mask:</td><td id=\"MK\">255.255.255.0</td></tr>\t\r\n<tr><td>DHCP:</td><td id=\"MK\">Enabled</td></tr>\t\r\n<tr><td>GateWay:</td><td id=\"GW\">192.168.1.1</td></tr>\t\r\n<tr><td>IP:</td><td id=\"IP\">192.168.1.73</td></tr></table><br><br>\r\n<a href='config.htm' class='smbuttons'>Change Network Settings</a><br><br>\r\n<a href='mpfsupload' class='smbuttons'>Download New Application Version</a><br><br>\r\n<span class=\"spans\">Version: Alert 2.6 YF</span><br><br>\r\n<a href='a.htm' class='smbuttons'>Authentication</a><br><br>\r\n<div id=\"foot\"> </div></body></html>", { connection: 'close',
  //     'content-type': 'text/html',
  //     'cache-control': 'no-cache',
  //     'access-control-allow-origin': '*' });

  //   gw.profile(function(err, profile){
  //     should.not.exist(err);
  //     should.exist(profile);
  //     done();
  //   });
  // });

  // it('fails with bad authentication', function(done) {
  //   var gw = new Insteon(
  //     TEST_INSTEON_HOST,
  //     TEST_INSTEON_PORT,
  //     TEST_USERNAME,
  //     'wrong');

  //   nock(gw.url)
  //   .get('/network.htm')
  //   .reply(401, '401 Unauthorized: Password required\r\n',
  //     {
  //       'www-authenticate': 'Basic realm="Insteon Hub"',
  //       connection: 'close'
  //     });


  //   gw.profile(function(err, profile){
  //     should.exist(err);
  //     err.message.should.eql('401');
  //     done();
  //   });
  // });

  // it('creates an error when verifing an non existant gateway (timeout)', function(done) {
  //   var gw = new Insteon(TEST_INSTEON_HOST, 8080);
  //   gw.profile(function(err) {
  //     should.exist(err);
  //     done();
  //   });
  // });

  // it('creates an error when verifing an invalid gateway (404)', function(done) {
  //   var gw = new Insteon('www.google.com');

  //   nock('http://www.google.com:80')
  //   .get('/network.htm')
  //   .reply(404);

  //   gw.profile(function(err) {
  //     should.exist(err);
  //     done();
  //   });
  // });

  it('turns on a light', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0262' + TEST_DEVICE_ID + '0F117F=I=3')
    .reply(200);

    gw.on(TEST_DEVICE_ID, 50, done);
  });

  // it('turns on a light fast', function(done) {
  //   var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

  //   nock(gw.url)
  //   .get('/3?0262' + TEST_DEVICE_ID + '0F12FF=I=3')
  //   .reply(200);

  //   gw.on(TEST_DEVICE_ID, 100, 'fast', done);
  // });

  it('turns off a light', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0262' + TEST_DEVICE_ID + '0F1300=I=3')
    .reply(200);

    gw.off(TEST_DEVICE_ID, done);
  });

  it('turns off a light fast', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0262' + TEST_DEVICE_ID + '0F1400=I=3')
    .reply(200);

    gw.offFast(TEST_DEVICE_ID, done);
  });

  it('gets the light level', function(done) {
    var gw = new Insteon(
      TEST_INSTEON_HOST,
      TEST_INSTEON_PORT,
      TEST_USERNAME,
      TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0262' + TEST_DEVICE_ID + '0F1900=I=3')
    .reply(200, '', { connection: 'close',
      'content-type': 'text/html',
      'cache-control': 'max-age=600',
      'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262' + TEST_DEVICE_ID + '0F1900060250' + TEST_DEVICE_ID + '1EB5522F01FF000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n',
      {
        connection: 'close',
        'content-type': 'text/xml',
        'cache-control': 'no-cache',
        'access-control-allow-origin': '*'
      });

    gw.level(TEST_DEVICE_ID, function(err, level) {
      should.not.exist(err);
      level.should.eql(100);
      done();
    });
  });

  it('error when trying to turn light to invlaid level', function() {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    (function(){
      gw.on(TEST_DEVICE_ID, 101, function() {});
    }).should.throw('level must be between 0 and 100');
  });

  it('configures authentication on the device', function(done) {
    var gw = new Insteon(
      TEST_INSTEON_HOST,
      TEST_INSTEON_PORT,
      TEST_USERNAME,
      TEST_PASSWORD);

    nock(gw.url)
    .post('/1?L=admin1=1=password1')
    .reply(200, '', { connection: 'close',
      'content-type': 'text/html',
      'cache-control': 'no-cache',
      'access-control-allow-origin': '*' })
    .post('/1?L=*=1=*')
    .reply(200, '', { connection: 'close',
      'content-type': 'text/html',
      'cache-control': 'no-cache',
      'access-control-allow-origin': '*' })
    .post('/1?L=admin=1=password')
    .reply(200, '', { connection: 'close',
      'content-type': 'text/html',
      'cache-control': 'no-cache',
      'access-control-allow-origin': '*' });

    gw.auth('admin1', 'password1', function (err) {
      should.not.exist(err);
      gw.auth(null, null, function (err) {
        should.not.exist(err);
        gw.auth(TEST_USERNAME, TEST_PASSWORD, function (err) {
          should.not.exist(err);
          done();
        });
      });
    });
  });

  it('cannot configure new auth without the old auth', function(done) {

    var gw = new Insteon(
      TEST_INSTEON_HOST,
      TEST_INSTEON_PORT,
      TEST_USERNAME,
      'wrong');

    nock(gw.url)
    .post('/1?L=admin=1=password')
    .reply(401, '401 Unauthorized: Password required\r\n',
      {
        'www-authenticate': 'Basic realm="Insteon Hub"',
        connection: 'close'
      });

    gw.auth(TEST_USERNAME, TEST_PASSWORD, function (err) {
      should.exist(err);
      err.message.should.eql('401');
      done();
    });

  });

  // it('links to a device', function(done) {
  //   this.timeout(35000);
  //   var gw = new Insteon(
  //     TEST_INSTEON_HOST,
  //     TEST_INSTEON_PORT,
  //     TEST_USERNAME,
  //     TEST_PASSWORD);

  //   nock(gw.url)
  //   .get('/0?08=I=0')
  //   .reply(200, "", { connection: 'close',
  //     'content-type': 'text/html',
  //     'cache-control': 'max-age=600',
  //     'access-control-allow-origin': '*' })
  //   .get('/Linkstatus.xml')
  //   .reply(200, "<response>\r\n<CLS>Ready</CLS>\r\n<CLSI>     </CLSI>\r\n<CLSG>     </CLSG>\r\n</response>\r\n", { connection: 'close',
  //     'content-type': 'text/xml',
  //     'cache-control': 'no-cache',
  //     'access-control-allow-origin': '*' })
  //   .get('/0?0901=I=0')
  //   .reply(200, "", { connection: 'close',
  //     'content-type': 'text/html',
  //     'cache-control': 'max-age=600',
  //     'access-control-allow-origin': '*' })
  //   .get('/Linkstatus.xml')
  //   .reply(200, "<response>\r\n<CLS>Waiting...</CLS>\r\n<CLSI>Press and hold Button on device to Add/Remove</CLSI>\r\n<CLSG>Number of Devices = 00</CLSG>\r\n</response>\r\n", { connection: 'close',
  //     'content-type': 'text/xml',
  //     'cache-control': 'no-cache',
  //     'access-control-allow-origin': '*' })
  //   .get('/Linkstatus.xml')
  //   .reply(200, "<response>\r\n<CLS>Waiting...</CLS>\r\n<CLSI>Press and hold Button on device to Add/Remove</CLSI>\r\n<CLSG>Number of Devices = 00</CLSG>\r\n</response>\r\n", { connection: 'close',
  //     'content-type': 'text/xml',
  //     'cache-control': 'no-cache',
  //     'access-control-allow-origin': '*' })
  //   .get('/Linkstatus.xml')
  //   .reply(200, "<response>\r\n<CLS>Done 19D41C # = 01</CLS>\r\n<CLSI>     </CLSI>\r\n<CLSG>     </CLSG>\r\n</response>\r\n", { connection: 'close',
  //     'content-type': 'text/xml',
  //     'cache-control': 'no-cache',
  //     'access-control-allow-origin': '*' });

  //   gw.link(30, function (err, id) {
  //     should.not.exist(err);
  //     should.exist(id);
  //     id.should.eql('19D41C');
  //     done();
  //   });
  // });

  it('get the ramp rate', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0262' + TEST_DEVICE_ID + '1F2E000100000000000000000000000000=I=3')
    .reply(200, '', { connection: 'close',
      'content-type': 'text/html',
      'cache-control': 'max-age=600',
      'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>201CFE1F000000000000000000000000000000000000060250' + TEST_DEVICE_ID + '1EB5522F2E000251' + TEST_DEVICE_ID + '1EB552112E000101000020</BS></response>\r\n', { connection: 'close',
      'content-type': 'text/xml',
      'cache-control': 'no-cache',
      'access-control-allow-origin': '*' });

    gw.rampRate(TEST_DEVICE_ID, function(err, rate){
      should.not.exist(err);
      should.exist(rate);
      rate.should.eql(500);
      done();

    });
  });

  it('get the on level', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0262' + TEST_DEVICE_ID + '1F2E000100000000000000000000000000=I=3')
    .reply(200, '', { connection: 'close',
      'content-type': 'text/html',
      'cache-control': 'max-age=600',
      'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>201CFE1F000000000000000000000000000000000000060250' + TEST_DEVICE_ID + '1EB5522F2E000251' + TEST_DEVICE_ID + '1EB552112E000101000020</BS></response>\r\n', { connection: 'close',
      'content-type': 'text/xml',
      'cache-control': 'no-cache',
      'access-control-allow-origin': '*' });

    gw.onLevel(TEST_DEVICE_ID, function(err, level){
      should.not.exist(err);
      should.exist(level);
      level.should.eql(99);
      done();

    });
  });

  it('get the device info', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0262' + TEST_DEVICE_ID + '0F0300=I=3')
    .reply(200, '', { connection: 'close',
      'content-type': 'text/html',
      'cache-control': 'max-age=600',
      'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262' + TEST_DEVICE_ID + '0F0300060250' + TEST_DEVICE_ID + '1EB5522F03000251' + TEST_DEVICE_ID + '1EB55211030001000000012041001F00000000000000000000</BS></response>\r\n', { connection: 'close',
      'content-type': 'text/xml',
      'cache-control': 'no-cache',
      'access-control-allow-origin': '*' });

    gw.info(TEST_DEVICE_ID, function(err, profile){
      should.not.exist(err);
      should.exist(profile);
      profile.id.should.eql(TEST_DEVICE_ID);
      profile.productKey.should.eql('000000');
      profile.deviceCategory.id.should.eql(1);
      profile.deviceSubcategory.id.should.eql(32);
      profile.isDimmable.should.be.ok;
      profile.isLighting.should.be.ok;
      profile.isThermostat.should.not.be.ok;
      done();
    });
  });



  it('get the linking data of the gateway', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0269=I=3')
    .reply(200, "", { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, "<response><BS>0269060257E20123C70B03204100000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n", { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/3?026A=I=3')
    .reply(200, "", { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, "<response><BS>026A060257E20119D41C03304100000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n", { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/3?026A=I=3')
    .reply(200, "", { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, "<response><BS>026A150000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n", { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' });


    gw.links(function(err, links){
      should.not.exist(err);
      should.exist(links);
      links.length.should.eql(2);
      links[0].group.should.eql(1);
      links[0].id.should.eql('23C70B');
      links[0].isController.should.be.true;
      done();
    });
  });



  it('gets the linking data of a device', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?026223C70B1F2F0000000FFF01000000000000000000=I=3')
    .reply(200, "", { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, "<response><BS>AA011EB552001C01D5000FFF0100000000000000000006025023C70B1EB5522F2F00025123C70B1EB552112F0000010FFF00</BS></response>\r\n", { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/3?026223C70B1F2F0000000FF701000000000000000000=I=3')
    .reply(200, "", { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, "<response><BS>0000000000000000CA000FF70100000000000000000006025023C70B1EB5522F2F00025123C70B1EB552112F0000010FF700</BS></response>\r\n", { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' });


    gw.links(TEST_DEVICE_ID, function(err, links){
      should.not.exist(err);
      should.exist(links);
      links.length.should.eql(1);
      links[0].group.should.eql(1);
      links[0].id.should.eql('1EB552');
      links[0].isController.should.be.false;
      links[0].isInUse.should.be.true;
      links[0].isLast.should.be.false;
      links[0].at.should.eql(4095);
      done();
    });
  });


  it('links to a device ', function(done) {
    this.timeout(70000);

    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);


    nock(gw.url)
    .get('/3?02640101=I=3')
    .reply(200, "", { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, "<response><BS>0264010106000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n", { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, "<response><BS>0264010106000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n", { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, "<response><BS>0264010106025023C70B0120418F01700253010123C70B012041000000000000000000000000000000000000000000000000</BS></response>\r\n", { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' });

    gw.link(60, function(err, link){
      should.not.exist(err);
      should.exist(link);
      link.group.should.eql(1);
      link.id.should.eql('23C70B');
      link.wasDeleted.should.be.false;
      link.deviceCategory.id.should.eql(1);
      done();
    });
  });

  // it('get the device profile', function(done) {
  //   var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

  //   nock.recorder.rec();

  //   gw.rampRate('19D41C', function(err, level){
  //     should.not.exist(err);
  //     console.log(level);
  //     done();
  //   });
  // });

  // it('get program lock', function(done) {
  //   var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

  //   nock.recorder.rec();

  //   gw.programLock(TEST_DEVICE_ID, function(err, isLocked) {
  //     should.not.exist(err);
  //     console.log(isLocked);
  //     console.log(gw.status);
  //     setTimeout(function(){
  //       gw.programLock(TEST_DEVICE_ID, false, function(err) {
  //         should.not.exist(err);
  //         console.log(gw.status);
  //         setTimeout(function(){
  //           gw.programLock(TEST_DEVICE_ID, function(err, isLockedNow) {
  //             console.log(isLockedNow);
  //             console.log(gw.status);
  //             done();
  //           });
  //         }, 800);
  //       });
  //     }, 800);
  //   });

  // });


  // it('get the ramp rate', function(done) {
  //   var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

  //   nock.recorder.rec();


  //   gw.onLevel(TEST_DEVICE_ID, 2, null, function(err, oldLevel){
  //     should.not.exist(err);
  //     console.log(gw.status);
  //     console.log('Old Level :' + oldLevel);
  //     done();
  //     // gw.onLevel(TEST_DEVICE_ID, 20, function(err){
  //     //   should.not.exist(err);
  //     //   console.log(gw.status);
  //     //   gw.onLevel(TEST_DEVICE_ID, function(err, level){
  //     //     should.not.exist(err);
  //     //     console.log(gw.status);
  //     //     console.log('New Level :' + level);

  //     //     done();
  //     //   });
  //     // });

  //   });

  // });


  // it('get the ramp rate', function(done) {
  //   var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

  //   nock.recorder.rec();

  //   gw.rampRate(TEST_DEVICE_ID, 500, function(err){
  //     should.not.exist(err);
  //     console.log(gw.status);
  //     setTimeout( function () {
  //       gw.rampRate(TEST_DEVICE_ID, function(err, rate){
  //         console.log(gw.status);
  //         should.exist(rate);
  //         rate.should.eql(500);
  //         done();
  //       });
  //     }, 1000);
  //   });
  // });

  // it('get the device profile', function(done) {
  //   var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

  //   nock.recorder.rec();

  //   gw.level(TEST_DEVICE_ID, function (err, level) {
  //     should.not.exist(err);
  //     console.log(level);
  //     if(level > 0) {
  //       gw.offFast(TEST_DEVICE_ID, done);
  //     } else {
  //       done();
  //     }
  //   });
  // });

});