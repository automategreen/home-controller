'use strict';

var Insteon = require('../').Insteon;
var should = require('should');
var nock = require('nock');

var TEST_INSTEON_HOST = '192.168.1.200';
var TEST_INSTEON_PORT = 25105;
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
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0260FFFFFF03379C060000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');


    gw.info(function (err, info) {
      should.not.exist(err);
      should.exist(info);
      info.firmwareVersion.should.equal('9C');
      info.id.should.equal('FFFFFF');
      info.deviceCategory.id.should.equal(3);
      info.deviceSubcategory.id.should.equal(55);
      done();
    });
  });

  it('turns on a light', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?02629999990F117F=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999990F117F060250999999FFFFFF2F117F000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');

    gw.on('999999', 50, done);
  });

  it('turns off a light', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?02629999990F1300=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999990F1300060250999999FFFFFF2F1300000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');


    gw.off('999999', done);
  });

  it('turns off a light fast', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?02629999990F1400=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999990F1400060250999999FFFFFF2F1400000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');


    gw.offFast('999999', done);
  });

  it('gets the light level', function(done) {
    var gw = new Insteon(
      TEST_INSTEON_HOST,
      TEST_INSTEON_PORT,
      TEST_USERNAME,
      TEST_PASSWORD);

    nock(gw.url)
    .get('/3?02629999990F1900=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999990F1900060250999999FFFFFF2F01FF000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');

    gw.level('999999', function(err, level) {
      should.not.exist(err);
      level.should.eql(100);
      done();
    });
  });

  it('error when trying to turn light to invlaid level', function() {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    (function(){
      gw.on('999999', 101, function() {});
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
    .reply(200)
    .post('/1?L=*=1=*')
    .reply(200)
    .post('/1?L=admin=1=password')
    .reply(200);

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
    .get('/3?02629999991F2E0001000000000000000000000000D1=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>201CFE1F000000000000000000000000000000000000060250999999FFFFFF2F2E000251999999FFFFFF112E000101000020</BS></response>\r\n');

    gw.rampRate('999999', function(err, rate){
      should.not.exist(err);
      should.exist(rate);
      rate.should.eql(500);
      done();

    });
  });

  it('get the on level', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?02629999991F2E0001000000000000000000000000D1=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>201CFE1F000000000000000000000000000000000000060250999999FFFFFF2F2E000251999999FFFFFF112E000101000020</BS></response>\r\n');

    gw.onLevel('999999', function(err, level){
      should.not.exist(err);
      should.exist(level);
      level.should.eql(99);
      done();

    });
  });

  it('get the device info', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?02629999990F0300=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999990F0300060250999999FFFFFF2F03000251999999FFFFFF11030001000000012041001F00000000000000000000</BS></response>\r\n');

    gw.info('999999', function(err, profile){
      should.not.exist(err);
      should.exist(profile);
      profile.id.should.eql('999999');
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
    .get('/3?02629999990F0F00=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999990F0F00060250999999FFFFFF2F0F00000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');

    gw.ping('999999', function(err, resp){
      should.not.exist(err);
      should.exist(resp);
      done();
    });
  });

  it('gets a device\'s version', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?02629999990F0D00=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999990F0D00060250999999FFFFFF2F0D02000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');

    gw.version('999999', function(err, version){
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
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0269060257E20111223303204100000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?026A=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026A060257E201AAAAAA03304100000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?026A=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026A150000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');


    gw.links(function(err, links){
      should.not.exist(err);
      should.exist(links);
      links.length.should.eql(2);
      links[0].group.should.eql(1);
      links[0].id.should.eql('112233');
      links[0].controller.should.be.true;
      done();
    });
  });



  it('gets the linking data of a device', function(done) {
    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?02629999991F2F0000000FFF010000000000000000C2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>AA01FFFFFF001C01D5000FFF01000000000000000000060250112233FFFFFF2F2F000251112233FFFFFF112F0000010FFF00</BS></response>\r\n')
    .get('/3?02629999991F2F0000000FF7010000000000000000CA=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0000000000000000CA000FF701000000000000000000060250112233FFFFFF2F2F000251112233FFFFFF112F0000010FF700</BS></response>\r\n');


    gw.links('999999', function(err, links){
      should.not.exist(err);
      should.exist(links);
      links.length.should.eql(1);
      links[0].group.should.eql(1);
      links[0].id.should.eql('FFFFFF');
      links[0].controller.should.be.false;
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
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264010106000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264010106000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026401010602501122330120418F017002530101112233012041000000000000000000000000000000000000000000000000</BS></response>\r\n');

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
    .get('/3?0262AAAAAA0F0A00=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA0F0A00060000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA0F0A00060250AAAAAAFFFFFF2F0A000250AAAAAA0130418F01000253FF00AAAAAA013041000000000000000000</BS></response>\r\n');

    gw.unlink('AAAAAA', {group: 0}, function(err, link){
      should.not.exist(err);
      should.exist(link);
      link.group.should.eql(0);
      link.id.should.eql('AAAAAA');
      link.wasDeleted.should.be.true;
      link.deviceCategory.id.should.eql(1);
      done();
    });
  });


  it('links gw to a device', function(done) {
    this.timeout(70000);

    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0265=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0265060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?02640105=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264010506000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?0262AAAAAA1F090000000000000000000000000000F7=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F090000000000000000000000000000F706000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F090000000000000000000000000000F7060250AAAAAAFFFFFF2F09000250AAAAAA0130418F01000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>AAAA0130411F090000000000000000000000000000F7060250AAAAAAFFFFFF2F09000250AAAAAA0130418F010002530105AA</BS></response>\r\n');

    gw.link('AAAAAA', {group: 5}, function(err, link){
      should.not.exist(err);
      should.exist(link);
      link.group.should.eql(5);
      link.id.should.eql('AAAAAA');
      link.wasDeleted.should.be.false;
      link.deviceCategory.id.should.eql(1);
      done();
    });
  });

  it('links gw to unknown device with options', function(done) {
    this.timeout(70000);

    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

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
    .reply(200, '<response><BS>0264010406000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264010406000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264010406000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264010406000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02640104060250999999021C418B010002530104999999021C410250999999FFFFFF2301040250999999FFFFFF2301040000</BS></response>\r\n');

    gw.link({timeout:60, group: 4}, function(err, link){
      should.not.exist(err);
      should.exist(link);
      link.group.should.eql(4);
      link.id.should.eql('999999');
      link.wasDeleted.should.be.false;
      link.deviceCategory.id.should.eql(2);
      done();
    });
  });


  it('links gw to multiple devices', function(done) {
    this.timeout(70000);

    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);

    nock(gw.url)
    .get('/3?0265=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0265060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?02640114=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264011406000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?0262AAAAAA1F090000000000000000000000000000F7=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F090000000000000000000000000000F706000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F090000000000000000000000000000F7060250AAAAAAFFFFFF2F09000250AAAAAA0130418F01000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>AAAA0130411F090000000000000000000000000000F7060250AAAAAAFFFFFF2F09000250AAAAAA0130418F010002530114AA</BS></response>\r\n')
    .get('/3?0265=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0265060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?02640114=I=3')
    .reply(200, '')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264011406000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?02629999991F090000000000000000000000000000F7=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999991F090000000000000000000000000000F706000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999991F090000000000000000000000000000F7060250999999FFFFFF2F09000250999999021C418F01000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>9999021C411F090000000000000000000000000000F7060250999999FFFFFF2F09000250999999021C418F01000253011499</BS></response>\r\n');

    gw.link(['AAAAAA', '999999'], {group: 20}, function(err, links){
      should.not.exist(err);
      should.exist(links);
      links.should.be.an.Array;
      links.length.should.eql(2);
      links[0].group.should.eql(20);
      links[0].id.should.eql('AAAAAA');
      links[0].wasDeleted.should.be.false;
      links[1].group.should.eql(20);
      links[1].id.should.eql('999999');
      links[1].wasDeleted.should.be.false;
      done();
    });
  });

  it('links device to gw (controller = true)', function (done) {
    this.timeout(70000);

    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);
    nock(gw.url)
    .get('/3?0265=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0265060000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?02629999991F090100000000000000000000000000F6=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999991F090100000000000000000000000000F6060250999999FFFFFF2F090100000000000000000000000000000000</BS></response>\r\n')
    .get('/3?02640000=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264000006000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0264000006025300019999990000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');

    gw.link('999999', {controller: true}, function(err, link){
      should.not.exist(err);
      should.exist(link);
      link.id.should.eql('999999');
      link.group.should.eql(1);
      link.controller.should.be.false;
      link.wasDeleted.should.be.false;
      done();
    });
  });

  it('creates a scene between two devices', function (done) {

    this.timeout(70000);

    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);
    nock(gw.url)
    .get('/3?0260=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0260FFFFFF03379C060000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?0262AAAAAA1F2F0000000FFF010000000000000000C2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F2F0000000FFF010000000000000000C206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>4201BBBBBB000000DB000FFF010000000000000000C2060250AAAAAAFFFFFF2F2F000251AAAAAAFFFFFF112F0000010FFF01</BS></response>\r\n')
    .get('/3?0262AAAAAA1F2F0000000FF7010000000000000000CA=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F2F0000000FF7010000000000000000CA06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>EA00FFFFFF031C009B000FF7010000000000000000CA060250AAAAAAFFFFFF2F2F000251AAAAAAFFFFFF112F0000010FF701</BS></response>\r\n')
    .get('/3?0262AAAAAA1F2F0000000FEF010000000000000000D2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F2F0000000FEF010000000000000000D206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>EA00FFFFFF031C00A3000FEF010000000000000000D2060250AAAAAAFFFFFF2F2F000251AAAAAAFFFFFF112F0000010FEF01</BS></response>\r\n')
    .get('/3?0262AAAAAA1F2F0000000FE7010000000000000000DA=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F2F0000000FE7010000000000000000DA06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>AA01FFFFFF001C00ED000FE7010000000000000000DA060250AAAAAAFFFFFF2F2F000251AAAAAAFFFFFF112F0000010FE701</BS></response>\r\n')
    .get('/3?0262AAAAAA1F2F0000000FDF010000000000000000E2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F2F0000000FDF010000000000000000E206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0000000000000000E1000FDF010000000000000000E2060250AAAAAAFFFFFF2F2F000251AAAAAAFFFFFF112F0000010FDF01</BS></response>\r\n')
    .get('/3?0262BBBBBB1F2F0000000FFF010000000000000000C2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262BBBBBB1F2F0000000FFF010000000000000000C206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0201AAAAAA000000B5000FFF010000000000000000C2060250BBBBBBFFFFFF2F2F000251BBBBBBFFFFFF112F0001010FFF00</BS></response>\r\n')
    .get('/3?0262BBBBBB1F2F0000000FF7010000000000000000CA=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262BBBBBB1F2F0000000FF7010000000000000000CA06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>E201FFFFFF001C00A5000FF7010000000000000000CA060250BBBBBBFFFFFF2F2F000251BBBBBBFFFFFF112F0001010FF700</BS></response>\r\n')
    .get('/3?0262BBBBBB1F2F0000000FEF010000000000000000D2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262BBBBBB1F2F0000000FEF010000000000000000D206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>A201FFFFFF001C00ED000FEF010000000000000000D2060250BBBBBBFFFFFF2F2F000251BBBBBBFFFFFF112F0001010FEF00</BS></response>\r\n')
    .get('/3?0262BBBBBB1F2F0000000FE7010000000000000000DA=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262BBBBBB1F2F0000000FE7010000000000000000DA06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0000000000000000D9000FE7010000000000000000DA060250BBBBBBFFFFFF2F2F000251BBBBBBFFFFFF112F0001010FE700</BS></response>\r\n')
    .get('/3?0262BBBBBB1F2F0000020FFF088201AAAAAAFF1B001E=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262BBBBBB1F2F0000020FFF088201AAAAAAFF1B001E06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262BBBBBB1F2F0000020FFF088201AAAAAAFF1B001E060250BBBBBBFFFFFF2F2F0000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?0262AAAAAA1F2F0000020FFF08C201BBBBBBFF1B00AB=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F2F0000020FFF08C201BBBBBBFF1B00AB06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F2F0000020FFF08C201BBBBBBFF1B00AB060250AAAAAAFFFFFF2F2F0000000000000000000000000000000000</BS></response>\r\n');

    var responder = {
      id: 'BBBBBB',
      level: 100, /* 100% */
      ramp: 2000 /* 2 sec */
    };
    gw.scene('AAAAAA', responder, {remove: true}, function (err) {
      should.not.exist(err);
      done();
    });
  });

  it('removes devices from a scene', function (done) {


    this.timeout(70000);

    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);
    nock(gw.url)
    .get('/3?0260=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0260FFFFFF03379C060000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?0262AAAAAA1F2F0000000FFF010000000000000000C2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F2F0000000FFF010000000000000000C206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>C201999999FF00005C000FFF010000000000000000C2060250AAAAAAFFFFFF2F2F000251AAAAAAFFFFFF112F0000010FFF01</BS></response>\r\n')
    .get('/3?0262AAAAAA1F2F0000000FF7010000000000000000CA=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F2F0000000FF7010000000000000000CA06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>EA00FFFFFF031C009B000FF7010000000000000000CA060250AAAAAAFFFFFF2F2F000251AAAAAAFFFFFF112F0000010FF701</BS></response>\r\n')
    .get('/3?0262AAAAAA1F2F0000000FEF010000000000000000D2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F2F0000000FEF010000000000000000D206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>EA00FFFFFF031C00A3000FEF010000000000000000D2060250AAAAAAFFFFFF2F2F000251AAAAAAFFFFFF112F0000010FEF01</BS></response>\r\n')
    .get('/3?0262AAAAAA1F2F0000000FE7010000000000000000DA=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F2F0000000FE7010000000000000000DA06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>AA01FFFFFF001C00ED000FE7010000000000000000DA060250AAAAAAFFFFFF2F2F000251AAAAAAFFFFFF112F0000010FE701</BS></response>\r\n')
    .get('/3?0262AAAAAA1F2F0000000FDF010000000000000000E2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F2F0000000FDF010000000000000000E206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0000000000000000E1000FDF010000000000000000E2060250AAAAAAFFFFFF2F2F000251AAAAAAFFFFFF112F0000010FDF01</BS></response>\r\n')
    .get('/3?02629999991F2F0000000FFF010000000000000000C2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999991F2F0000000FFF010000000000000000C206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>8201AAAAAAFF1B001B000FFF010000000000000000C2060250999999FFFFFF2F2F000251999999FFFFFF112F0001010FFF00</BS></response>\r\n')
    .get('/3?02629999991F2F0000000FF7010000000000000000CA=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999991F2F0000000FF7010000000000000000CA06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>E201FFFFFF001C00A5000FF7010000000000000000CA060250999999FFFFFF2F2F000251999999FFFFFF112F0001010FF700</BS></response>\r\n')
    .get('/3?02629999991F2F0000000FEF010000000000000000D2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999991F2F0000000FEF010000000000000000D206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>A201FFFFFF001C00ED000FEF010000000000000000D2060250999999FFFFFF2F2F000251999999FFFFFF112F0001010FEF00</BS></response>\r\n')
    .get('/3?02629999991F2F0000000FE7010000000000000000DA=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999991F2F0000000FE7010000000000000000DA06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0000000000000000D9000FE7010000000000000000DA060250999999FFFFFF2F2F000251999999FFFFFF112F0001010FE700</BS></response>\r\n')
    .get('/3?02629999991F2F0000020FFF080201AAAAAA000000B8=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999991F2F0000020FFF080201AAAAAA000000B806000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02629999991F2F0000020FFF080201AAAAAA000000B8060250999999FFFFFF2F2F0000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?0262AAAAAA1F2F0000020FFF084201999999000000AB=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F2F0000020FFF084201999999000000AB06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0262AAAAAA1F2F0000020FFF084201999999000000AB060250AAAAAAFFFFFF2F2F0000000000000000000000000000000000</BS></response>\r\n');

    gw.scene('AAAAAA', null, {remove: true}, function (err) {
      should.not.exist(err);
      done();
    });
  });


  it('creates a scene between two devices and the gateway', function (done) {

    this.timeout(70000);

    var gw = new Insteon(TEST_INSTEON_HOST, TEST_INSTEON_PORT, TEST_USERNAME, TEST_PASSWORD);
    nock(gw.url)
    .get('/3?0260=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>02601EB55203379C060000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?0269=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0269060257E20126B1CC030E4100000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?026A=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026A060257E20119D41C03304100000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?026A=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026A060257E21426B1CC7F190000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?026A=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026A060257A20126B1CC00000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?026A=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026A060257E21419D41C7F190000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?026A=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026A150000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?026226B1CC1F2F0000000FFF010000000000000000C2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026226B1CC1F2F0000000FFF010000000000000000C206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>82141EB5527F19006E000FFF010000000000000000C206025026B1CC1EB5522F2F00025126B1CC1EB552112F0001010FFF00</BS></response>\r\n')
    .get('/3?026226B1CC1F2F0000000FF7010000000000000000CA=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026226B1CC1F2F0000000FF7010000000000000000CA06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>E2011EB552001C00A5000FF7010000000000000000CA06025026B1CC1EB5522F2F00025126B1CC1EB552112F0001010FF700</BS></response>\r\n')
    .get('/3?026226B1CC1F2F0000000FEF010000000000000000D2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026226B1CC1F2F0000000FEF010000000000000000D206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>A2011EB552001C00ED000FEF010000000000000000D206025026B1CC1EB5522F2F00025126B1CC1EB552112F0001010FEF00</BS></response>\r\n')
    .get('/3?026226B1CC1F2F0000000FE7010000000000000000DA=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026226B1CC1F2F0000000FE7010000000000000000DA06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0000000000000000D9000FE7010000000000000000DA06025026B1CC1EB5522F2F00025126B1CC1EB552112F0001010FE700</BS></response>\r\n')
    .get('/3?026219D41C1F2F0000000FFF010000000000000000C2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026219D41C1F2F0000000FFF010000000000000000C206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>82141EB5527F19006E000FFF010000000000000000C206025019D41C1EB5522F2F00025119D41C1EB552112F0000010FFF01</BS></response>\r\n')
    .get('/3?026219D41C1F2F0000000FF7010000000000000000CA=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026219D41C1F2F0000000FF7010000000000000000CA06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>EA001EB552031C009B000FF7010000000000000000CA06025019D41C1EB5522F2F00025119D41C1EB552112F0000010FF701</BS></response>\r\n')
    .get('/3?026219D41C1F2F0000000FEF010000000000000000D2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026219D41C1F2F0000000FEF010000000000000000D206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>EA001EB552031C00A3000FEF010000000000000000D206025019D41C1EB5522F2F00025119D41C1EB552112F0000010FEF01</BS></response>\r\n')
    .get('/3?026219D41C1F2F0000000FE7010000000000000000DA=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026219D41C1F2F0000000FE7010000000000000000DA06000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>AA011EB552001C00ED000FE7010000000000000000DA06025019D41C1EB5522F2F00025119D41C1EB552112F0000010FE701</BS></response>\r\n')
    .get('/3?026219D41C1F2F0000000FDF010000000000000000E2=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026219D41C1F2F0000000FDF010000000000000000E206000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>0000000000000000E1000FDF010000000000000000E206025019D41C1EB5522F2F00025119D41C1EB552112F0000010FDF01</BS></response>\r\n')
    .get('/3?026226B1CC1F2F0000020FE70882321EB5527F190060=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026226B1CC1F2F0000020FE70882321EB5527F19006006000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026226B1CC1F2F0000020FE70882321EB5527F19006006025026B1CC1EB5522F2F0000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?026F40C23226B1CC7F1900=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026F40C23226B1CC7F1900060000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?026219D41C1F2F0000020FDF0882321EB5527F190068=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026219D41C1F2F0000020FDF0882321EB5527F19006806000000000000000000000000000000000000000000000000000000</BS></response>\r\n')
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026219D41C1F2F0000020FDF0882321EB5527F19006806025019D41C1EB5522F2F0000000000000000000000000000000000</BS></response>\r\n')
    .get('/3?026F40C23219D41C7F1900=I=3')
    .reply(200)
    .get('/buffstatus.xml')
    .reply(200, '<response><BS>026F40C23219D41C7F1900060000000000000000000000000000000000000000000000000000000000000000000000000000</BS></response>\r\n');

    var responders = [{
      id: '26B1CC',
      level: 50, /* 100% */
      ramp: 6500 /* 2 sec */
    }, {
      id: '19D41C',
      level: 50, /* 100% */
      ramp: 6500 /* 2 sec */
    }];
    gw.scene('gw', responders, {group: 50}, function (err) {
      should.not.exist(err);
      done();
    });
  });



});