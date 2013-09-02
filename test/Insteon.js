var Insteon = require('../').Insteon;
var should = require('should');
var nock = require('nock');

var TEST_INSTEON_HOST = 'my.home';
var TEST_INSTEON_PORT = 25105;
var TEST_DEVICE_ID = 'AABBCC';
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
    .reply(200, "<response><BS>0269060257E20111223303204100000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n", { connection: 'close',
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
      links[0].id.should.eql('112233');
      links[0].isController.should.be.true;
      done();
    });
  });



  it('gets the linking data of a device', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0262' + TEST_DEVICE_ID + '1F2F0000000FFF01000000000000000000=I=3')
    .reply(200, "", { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, "<response><BS>AA011EB552001C01D5000FFF010000000000000000000602501122331EB5522F2F0002511122331EB552112F0000010FFF00</BS></response>\r\n", { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' })
    .get('/3?0262' + TEST_DEVICE_ID + '1F2F0000000FF701000000000000000000=I=3')
    .reply(200, "", { connection: 'close',
    'content-type': 'text/html',
    'cache-control': 'max-age=600',
    'access-control-allow-origin': '*' })
    .get('/buffstatus.xml')
    .reply(200, "<response><BS>0000000000000000CA000FF7010000000000000000000602501122331EB5522F2F0002511122331EB552112F0000010FF700</BS></response>\r\n", { connection: 'close',
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
    .reply(200, "<response><BS>026401010602501122330120418F017002530101112233012041000000000000000000000000000000000000000000000000</BS></response>\r\n", { connection: 'close',
    'content-type': 'text/xml',
    'cache-control': 'no-cache',
    'access-control-allow-origin': '*' });

    gw.link(60, function(err, link){
      should.not.exist(err);
      should.exist(link);
      link.group.should.eql(1);
      link.id.should.eql('112233');
      link.wasDeleted.should.be.false;
      link.deviceCategory.id.should.eql(1);
      done();
    });
  });


});