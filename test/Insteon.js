'use strict';

var Insteon = require('../').Insteon;
var should = require('should');
var nock = require('nock');

var TEST_INSTEON_HOST = '192.168.1.200';
var TEST_INSTEON_PORT = 25105;
var TEST_DEVICE_ID = 'AABBCC';
var TEST_USERNAME = 'admin';
var TEST_PASSWORD = 'password';

describe('Insteon Gateway', function() {
  this.timeout(30000);

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



  it('gets the gateway info', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0260=I=3')
    .reply(200, '', { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02601EB55203379C060000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
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



  it('turns on a light', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0262' + TEST_DEVICE_ID + '0F117F=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262' + TEST_DEVICE_ID + '0F117F060250' + TEST_DEVICE_ID + '1EB5522F117F000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');

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
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262' + TEST_DEVICE_ID + '0F1300060250' + TEST_DEVICE_ID + '1EB5522F1300000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');


    gw.off(TEST_DEVICE_ID, done);
  });

  it('turns off a light fast', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0262' + TEST_DEVICE_ID + '0F1400=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262' + TEST_DEVICE_ID + '0F1400060250' + TEST_DEVICE_ID + '1EB5522F1400000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');


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

  it('get the ramp rate', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0262' + TEST_DEVICE_ID + '1F2E0001000000000000000000000000D1=I=3')
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
    .get('/3?0262' + TEST_DEVICE_ID + '1F2E0001000000000000000000000000D1=I=3')
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

  it('pings a device', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0262' + TEST_DEVICE_ID + '0F0F00=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262' + TEST_DEVICE_ID + '0F0F00060250' + TEST_DEVICE_ID + '1EB5522F0F00000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');

    gw.ping(TEST_DEVICE_ID, function(err, resp){
      should.not.exist(err);
      should.exist(resp);
      done();
    });
  });

  it('gets a device\'s version', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0262' + TEST_DEVICE_ID + '0F0D00=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262' + TEST_DEVICE_ID + '0F0D00060250' + TEST_DEVICE_ID + '1EB5522F0D02000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');

    gw.version(TEST_DEVICE_ID, function(err, version){
      should.not.exist(err);
      should.exist(version);
      version.code.should.eql(2);
      version.name.should.eql('i2cs');
      done();
    });
  });



  it('get the linking data of the gateway', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0269=I=3')
    .reply(200, '', { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0269060257E20111223303204100000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/3?026A=I=3')
    .reply(200, '', { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026A060257E20119D41C03304100000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/3?026A=I=3')
    .reply(200, '', { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026A150000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' });


    gw.links(function(err, links){
      should.not.exist(err);
      should.exist(links);
      links.length.should.eql(2);
      links[0].group.should.eql(1);
      links[0].id.should.eql('112233');
      links[0].isController.should.be.true;
      done();
    });
  });



  it('gets the linking data of a device', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0262' + TEST_DEVICE_ID + '1F2F0000000FFF010000000000000000C2=I=3')
    .reply(200, '', { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>AA011EB552001C01D5000FFF010000000000000000000602501122331EB5522F2F0002511122331EB552112F0000010FFF00</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/3?0262' + TEST_DEVICE_ID + '1F2F0000000FF7010000000000000000CA=I=3')
    .reply(200, '', { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0000000000000000CA000FF7010000000000000000000602501122331EB5522F2F0002511122331EB552112F0000010FF700</BS></response>\r\n', { connection: 'close',
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


  it('links gw to an unknown device ', function(done) {
    this.timeout(70000);

    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);


    nock(gw.url)
    .get('/3?0265=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0265060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?02640101=I=3')
    .reply(200, '', { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264010106000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264010106000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026401010602501122330120418F017002530101112233012041000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' });

    gw.link(function(err, link){
      should.not.exist(err);
      should.exist(link);
      link.group.should.eql(1);
      link.id.should.eql('112233');
      link.wasDeleted.should.be.false;
      link.deviceCategory.id.should.eql(1);
      done();
    });
  });


  it('unlinks gw from a device', function(done) {
    this.timeout(70000);

    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    //nock.recorder.rec();
    nock(gw.url)
    .get('/3?0265=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0265060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?0264FF00=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264FF0006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?026219D41C0F0A00=I=3')
    .reply(200, '', { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026219D41C0F0A00060000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026219D41C0F0A0006025019D41C1EB5522F0A00025019D41C0130418F01000253FF0019D41C013041000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' });

    gw.unlink('19D41C', {group: 0}, function(err, link){
      should.not.exist(err);
      should.exist(link);
      link.group.should.eql(0);
      link.id.should.eql('19D41C');
      link.wasDeleted.should.be.true;
      link.deviceCategory.id.should.eql(1);
      done();
    });
  });


  it('links gw to a device', function(done) {
    this.timeout(70000);

    // var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);
    var gw = new Insteon('home.brandongoode.com', TEST_INSTEON_PORT, 'admin', '1EB552');

    nock(gw.url)
    .get('/3?0265=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0265060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?02640105=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264010506000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?026219D41C1F090000000000000000000000000000F7=I=3')
    .reply(200, '', { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026219D41C1F090000000000000000000000000000F706000000000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026219D41C1F090000000000000000000000000000F706025019D41C1EB5522F0900025019D41C0130418F01000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>D41C0130411F090000000000000000000000000000F706025019D41C1EB5522F0900025019D41C0130418F01000253010519</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' });

    gw.link('19D41C', {group: 5}, function(err, link){
      should.not.exist(err);
      should.exist(link);
      link.group.should.eql(5);
      link.id.should.eql('19D41C');
      link.wasDeleted.should.be.false;
      link.deviceCategory.id.should.eql(1);
      done();
    });
  });

  it('links gw to unknown device with options', function(done) {
    this.timeout(70000);

    // var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);
    var gw = new Insteon('home.brandongoode.com', TEST_INSTEON_PORT, 'admin', '1EB552');


    nock(gw.url)
    .get('/3?0265=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0265060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?02640104=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264010406000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264010406000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264010406000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264010406000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264010406000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026401040602501CC296021C418B0100025301041CC296021C4102501CC2961EB55223010402501CC2961EB5522301040000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' });

    gw.link({timeout:60, group: 4}, function(err, link){
      should.not.exist(err);
      should.exist(link);
      link.group.should.eql(4);
      link.id.should.eql('1CC296');
      link.wasDeleted.should.be.false;
      link.deviceCategory.id.should.eql(2);
      done();
    });
  });


  it('links gw to multiple devices', function(done) {
    this.timeout(70000);

    // var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);
    var gw = new Insteon('home.brandongoode.com', TEST_INSTEON_PORT, 'admin', '1EB552');

    nock(gw.url)
    .get('/3?0265=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0265060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?02640114=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264011406000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?026219D41C1F090000000000000000000000000000F7=I=3')
    .reply(200, '', { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026219D41C1F090000000000000000000000000000F706000000000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026219D41C1F090000000000000000000000000000F706025019D41C1EB5522F0900025019D41C0130418F01000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>D41C0130411F090000000000000000000000000000F706025019D41C1EB5522F0900025019D41C0130418F01000253011419</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/3?0265=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0265060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?02640114=I=3')
    .reply(200, '')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264011406000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?02621CC2961F090000000000000000000000000000F7=I=3')
    .reply(200, '', { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02621CC2961F090000000000000000000000000000F706000000000000000000000000000000000000000000000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02621CC2961F090000000000000000000000000000F70602501CC2961EB5522F090002501CC296021C418F01000000000000</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>C296021C411F090000000000000000000000000000F70602501CC2961EB5522F090002501CC296021C418F0100025301141C</BS></response>\r\n', { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' });

    gw.link(['19D41C', '1CC296'], {group: 20}, function(err, links){
      should.not.exist(err);
      should.exist(links);
      links.should.be.an.Array;
      links.length.should.eql(2);
      links[0].group.should.eql(20);
      links[0].id.should.eql('19D41C');
      links[0].wasDeleted.should.be.false;
      links[1].group.should.eql(20);
      links[1].id.should.eql('1CC296');
      links[1].wasDeleted.should.be.false;
      done();
    });
  });

  it('links device to gw (isController = true)', function(done) {
    this.timeout(70000);

    // var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);
    var gw = new Insteon('192.168.1.122', TEST_INSTEON_PORT, 'admin', '1EB552');
    nock(gw.url)
    .get('/3?0265=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0265060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?02621CC2961F090100000000000000000000000000F6=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02621CC2961F090100000000000000000000000000F60602501CC2961EB5522F090100000000000000000000000000000000</BS></response>\r\n')
    .get('/3?02640000=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264000006025300011CC2960000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');

    gw.link('1CC296', {isController: true}, function(err, link){
      should.not.exist(err);
      should.exist(link);
      link.id.should.eql('1CC296');
      link.group.should.eql(1);
      link.isController.should.be.false;
      link.wasDeleted.should.be.false;
      done();
    });
  });

  // it('links device to device', function(done) {
  //   this.timeout(70000);
  //   nock.recorder.rec();


  //   // var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);
  //   var gw = new Insteon('192.168.1.122', TEST_INSTEON_PORT, 'admin', '1EB552');

  //   gw.link('19D41C', '1CC296', function(err, link){
  //     should.not.exist(err);
  //     should.exist(link);
  //     done();
  //   });
  // });


});