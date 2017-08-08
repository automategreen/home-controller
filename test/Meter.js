'use strict';

var Insteon = require('../').Insteon;
var should = require('should');

var mockHub = require('../lib/Test/mockHub');

var host = '127.0.0.1';
var port = 9761;

describe('Meter Commands', function () {
  this.timeout(5000);

  before(function (done) {
    mockHub.listen(port, host, function () {
      done();
    });
  });

  it('get status', function (done) {
    var gw = new Insteon();
    var meter = gw.meter('1987b7');

    mockHub.mockData = {
      '02621987b70f8200':
      [
        '02621987b70f820006',
        '02501987b71eb5522f8200',
        '02511987b71eb5521b82000002010d009100030000002a74d8'
      ]
    };

    gw.connect(host, function () {
      meter.status()
        .then(function (status) {
          should.exist(status);
          status.should.eql({ energy: 0.012742916666666666, power: 3 });
          done();
        })
        .catch(done);
    });
  });

  it('get status and reset', function (done) {
    var gw = new Insteon();
    var meter = gw.meter('1987b7');

    mockHub.mockData = {
      '02621987b70f8200':
      [
        '02621987b70f820006',
        '02501987b71eb5522f8200',
        '02511987b71eb5521b820000020110008100020000006fa345'
      ],
      '02621987b70f8000': [
        '02621987b70f800006',
        '02501987b71eb5522f8000'
      ]
    };

    gw.connect(host, function () {
      meter.status()
        .then(function (status) {
          should.exist(status);
          status.should.eql({ energy: 0.033677708333333334, power: 2 });
          done();
        })
        .catch(done);
    });
  });
}); // Meter Functions

