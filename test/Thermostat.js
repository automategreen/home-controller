'use strict';

var Insteon = require('../').Insteon;
var should = require('should');

var mockHub = require('../lib/Test/mockHub');
var Plan = require('../lib/Test/Plan');

var host = '127.0.0.1';
var port = 9761;

describe('Thermostat (commands)', function () {
  this.timeout(5000);

  before(function (done) {
    mockHub.listen(port, host, function () {
      done();
    });
  });

  it('gets temp', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926380f6a00':
        [
          '02622926380f6a0006',
          '02502926381eb5522f6a91'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638').temp(function (err, temp) {
        should.not.exist(err);
        temp.should.eql(72.5);
        done();
      });
    });
  });

  it('gets temp for zone', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926380f6a01':
        [
          '02622926380f6a0106',
          '02502926381eb5522f6a91'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638').temp(1, function (err, temp) {
        should.not.exist(err);
        temp.should.eql(72.5);
        done();
      });
    });
  });

  it('get humidity', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926380f6a60':
        [
          '02622926380f6a6006',
          '02502926381eb5522f6a30'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638').humidity(function (err, humidity) {
        should.not.exist(err);
        humidity.should.eql(48);
        done();
      });
    });
  });

  it('get setpoints', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926380f6a20':
        [
          '02622926380f6a2006',
          '02502926381eb5522f6a8a',
          '02502926381eb5520f6a94'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638').setpoints(function (err, setpoints) {
        should.not.exist(err);
        setpoints.should.containEql(69);
        setpoints.should.containEql(74);
        done();
      });
    });
  });

  it('gets setpoints for zone', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926380f6a21':
        [
          '02622926380f6a2106',
          '02502926381eb5522f6a8a',
          '02502926381eb5520f6a94'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638').setpoints(1, function (err, setpoints) {
        should.not.exist(err);
        setpoints.should.containEql(69);
        setpoints.should.containEql(74);
        done();
      });
    });
  });

  it('gets mode', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926380f6b02':
        [
          '02622926380f6b0206',
          '02502926381eb5522f6b03'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638').mode(function (err, mode) {
        should.not.exist(err);
        mode.should.eql('auto');
        done();
      });
    });
  });

  it('sets mode', function (done) {
    var gw = new Insteon();

    mockHub.mockData =
      {
        '02622926381f6b06000000000000000000000000008f':
        [
          '02622926381f6b06000000000000000000000000008f06',
          '02502926381eb5522f6b03'
        ]
      };

    gw.connect(host, function () {
      gw.thermostat('292638').mode('auto', function (err, mode) {
        should.not.exist(err);
        mode.should.eql('auto');
        done();
      });
    });
  });

  it('sets invalid mode', function (done) {
    var gw = new Insteon();

    mockHub.mockData =
      {
        '02622926381f6b06000000000000000000000000008f':
        [
          '02622926381f6b06000000000000000000000000008f06',
          '02502926381eb5522f6b03'
        ]
      };

    gw.connect(host, function () {
      gw.thermostat('292638').mode('automatic', function (err, mode) {
        should.exist(err);
        should.not.exist(mode);
        done();
      });
    });
  });

  it('gets error when setting mode', function (done) {
    var gw = new Insteon();

    mockHub.mockData =
      {
        '02622926381f6b06000000000000000000000000008f':
        [
          '02622926381f6b06000000000000000000000000008f15'
          //'02502926381eb5522f6b03'
        ]
      };

    gw.connect(host, function () {
      gw.thermostat('292638').mode('auto', function (err, mode) {
        should.not.exist(err);
        should.equal(mode, null);
        done();
      });
    });
  });

  it('turn temp up', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f68020000000000000000000000000096':
        [
          '02622926381f6802000000000000000000000000009606',
          '02502926381eb5522f6802'
        ]
      },
      {
        '02622926381f68040000000000000000000000000094':
        [
          '02622926381f6804000000000000000000000000009406',
          '02502926381eb5522f6804'
        ]
      },
      {
        '02622926381f68020000000000000000000000000096':
        [
          '02622926381f6802000000000000000000000000009606',
          '02502926381eb5522f6802'
        ]
      }];

    gw.connect(host, function () {
      var thermostat = gw.thermostat('292638');
      thermostat.tempUp()
        .then(function (status) {
          should.exist(status.response.standard);
          plan.ok();
        });
      thermostat.tempUp(2)
        .then(function (status) {
          should.exist(status.response.standard);
          plan.ok();
        });
      thermostat.tempUp(function (err, status) {
        should.not.exist(err);
        should.exist(status.response.standard);
        plan.ok();
      });
    });
  });

  it('turn temp down', function (done) {
    var gw = new Insteon();
    var plan = new Plan(3, done);

    mockHub.mockData = [
      {
        '02622926381f69020000000000000000000000000095':
        [
          '02622926381f6902000000000000000000000000009506',
          '02502926381eb5522f6902'
        ]
      },
      {
        '02622926381f69040000000000000000000000000093':
        [
          '02622926381f6904000000000000000000000000009306',
          '02502926381eb5522f6904'
        ]
      },
      {
        '02622926381f69020000000000000000000000000095':
        [
          '02622926381f6902000000000000000000000000009506',
          '02502926381eb5522f6902'
        ]
      }];

    gw.connect(host, function () {
      var thermostat = gw.thermostat('292638');

      thermostat.tempDown()
        .then(function (status) {
          should.exist(status.response.standard);
          plan.ok();
        });
      thermostat.tempDown(2)
        .then(function (status) {
          should.exist(status.response.standard);
          plan.ok();
        });
      thermostat.tempDown(function (err, status) {
        should.not.exist(err);
        should.exist(status.response.standard);
        plan.ok();
      });

    });
  });

  it('set heat temp', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f6d88000000000000000000000000000b':
        [
          '02',
          '622926381f6d88000000000000000000000000000b06',
          '02502926381eb5522f6d88'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .heatTemp(68)
        .then(function (status) {
          should.exist(status.response.standard);
        })
        .then(done, done);
    });
  });

  it('set cool temp', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f6c920000000000000000000000000002':
        [
          '02',
          '622926381f6c9200000000000000000000000000',
          '0206',
          '02502926381eb5522f6c92'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .coolTemp(73)
        .then(function (status) {
          should.exist(status.response.standard);
        })
        .then(done, done);
    });
  });

  it('set high humidity', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f2e00010b460000000000000000000080':
        [
          '02622926381f2e00010b46000000000000000000008006'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .highHumidity(70)
        .then(function (status) {
          status.ack.should.be.true;
        })
        .then(done, done);
    });
  });

  it('set low humidity', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f2e00010c2300000000000000000000a2':
        [
          '0262',
          '2926381f2e00010c2300000000000000000000a206'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .lowHumidity(35)
        .then(function (status) {
          status.ack.should.be.true;
        })
        .then(done, done);
    });
  });

  it('set backlight', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f2e0001051e00000000000000000000ae':
        [
          '02622926381f2e0001051e00000000000000000000ae06'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .backlight(30)
        .then(function (status) {
          status.ack.should.be.true;
        })
        .then(done, done);
    });
  });

  it('set cycle delay', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f2e0001060600000000000000000000c5':
        [
          '02622926381f2e0001060600000000000000000000c506'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .cycleDelay(6)
        .then(function (status) {
          status.ack.should.be.true;
        })
        .then(done, done);
    });
  });

  it('set energy mode change', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f2e0001070500000000000000000000c5':
        [
          '02622926381f2e0001070500000000000000000000',
          'c506'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .energyChange(5)
        .then(function (status) {
          status.ack.should.be.true;
        })
        .then(done, done);
    });
  });

  it('set date (day, hour, min, sec)', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f2e0202020e271b00000000000000a500':
        [
          '02622926381f2e0202020e271b00000000000000a50006'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .date(new Date(2014, 4, 6, 14, 39, 27, 0))
        .then(function (status) {
          status.ack.should.be.true;
        })
        .then(done, done);
    });
  });

  it('sets today\'s date', function (done) {
    var gw = new Insteon();

    gw.connect(host, function () {
      gw.thermostat('112233')
        .date(function (err, status) {
          status.ack.should.be.true;
          done();
        });

      setTimeout(function () {
        mockHub.send(['02621122331f2e020204103b3a00000000000000d4c606']);
      }, 10);
    });
  });

  it('sets date (string)', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f2e0202020e271b00000000000000a500':
        [
          '02622926381f2e0202020e271b00000000000000a50006'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .date('2014-05-06 14:39:27')
        .then(function (status) {
          status.ack.should.be.true;
        })
        .then(done, done);
    });
  });

  it('get status - invalid crc', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f2e020000000000000000000000009296':
        [
          '02622926381f2e02000000000000000000000000929606',
          '02502926381eb5522f2e02',
          '02512926381eb552112e0201000d0810503b00b9803c331202'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .status()
        .then(function (details) {
          should.not.exist(details);
        })
        .then(done, done);
    });
  });

  it('get status - valid crc', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f2e020000000000000000000000009296':
        [
          '02622926381f2e02000000000000000000000000929606',
          '02502926381eb5522f2e02',
          '02512926381eb552112e0201000c262c10503b00b9803c4674'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .status()
        .then(function (details) {
          should.exist(details);
          details.mode.should.eql('auto');
          details.fan.should.be.false;
          details.date.should.eql({ day: 0, hour: 12, minute: 38, seconds: 44 });
          details.setpoints.should.eql({
            cool: 80,
            heat: 60
          });
          details.humidity.should.eql(59);
          details.temperature.should.eql(65.3);
          details.cooling.should.be.false;
          details.heating.should.be.false;
          details.energySaving.should.be.false;
          details.hold.should.be.false;
          details.unit.should.eql('F');
        })
        .then(done, done);
    });
  });

  it('get status - Celcius temp', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f2e020000000000000000000000009296':
        [
          '02622926381f2e02000000000000000000000000929606',
          '02502926381eb5522f2e02',
          '02512926381eb552112e0201000c262c10503b00b9883c5765'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .status()
        .then(function (details) {
          should.exist(details);
          details.unit.should.eql('C');
        })
        .then(done, done);
    });
  });

  it('gets details', function (done) {
    this.slow(500);
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f2e020000000000000000000000009296':
        [
          '02622926381f2e02000000000000000000000000929606',
          '02502926381eb5522f2e02',
          '02502926381eb5522f2e02',
          '02512926381eb552112e02010209232710493900e0804451b1'
        ]
      },
      {
        '02622926381f2e00000000000000000000000000636b':
        [
          '02622926381f2e00000000000000000000000000636b06',
          '02502926381eb5522f2e00',
          '02512926381eb552112e00000100e03901ff01001e06050000'
        ]
      },
      {
        '02622926381f2e000000010000000000000000009f3a':
        [
          '026229',
          '26381f2e000000010000000000000000009f3a06',
          '02502926381eb5522f2e00',
          '02512926381eb552112e0000010146230d494401000100d0f7'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .details()
        .then(function (details) {
          details.mode.should.eql('auto');
          details.fan.should.be.false;
          details.date.should.eql({ day: 2, hour: 9, minute: 35, seconds: 39 });
          details.setpoints.should.eql({
            cool: 73,
            heat: 68,
            highHumidity: 70,
            lowHumidity: 35
          });

          details.humidity.should.eql(57);
          details.temperature.should.eql(72.32);
          details.cooling.should.be.false;
          details.heating.should.be.false;
          details.energySaving.should.be.false;
          details.hold.should.be.false;
          details.unit.should.eql('F');
          details.backlight.should.eql(30);
          details.delay.should.eql(6);
          details.energyOffset.should.eql(5);

        })
        .then(done, done);
    });
  });

  it('gets error getting details #1', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f2e020000000000000000000000009296':
        [
          '02622926381f2e02000000000000000000000000929615'
        ]
      },
      {
        '02622926381f2e00000000000000000000000000636b':
        [
          '02622926381f2e00000000000000000000000000636b06',
          '02502926381eb5522f2e00',
          '02512926381eb552112e00000100e03901ff01001e06050000'
        ]
      },
      {
        '02622926381f2e000000010000000000000000009f3a':
        [
          '026229',
          '26381f2e000000010000000000000000009f3a06',
          '02502926381eb5522f2e00',
          '02512926381eb552112e0000010146230d494401000100d0f7'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .details()
        .then(function (details) {
          should.exist(details);
          should.not.exist(details.date);
          should.not.exist(details.mode);
          should.not.exist(details.fan);

          done();
        });
    });
  });

  it('gets error getting details #2', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f2e020000000000000000000000009296':
        [
          '02622926381f2e02000000000000000000000000929606',
          '02502926381eb5522f2e02',
          '02502926381eb5522f2e02',
          '02512926381eb552112e02010209232710493900e0804451b1'
        ]
      },
      {
        '02622926381f2e00000000000000000000000000636b':
        [
          '02622926381f2e00000000000000000000000000636b15'
        ]
      },
      {
        '02622926381f2e000000010000000000000000009f3a':
        [
          '026229',
          '26381f2e000000010000000000000000009f3a06',
          '02502926381eb5522f2e00',
          '02512926381eb552112e0000010146230d494401000100d0f7'
        ]
      }];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .details()
        .then(function (details) {
          should.exist(details);
          should.not.exist(details.backlight);
          should.not.exist(details.delay);
          should.not.exist(details.energyOffset);

          done();
        });
    });
  });

  it('gets error getting details #3', function (done) {
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '02622926381f2e020000000000000000000000009296':
        [
          '02622926381f2e02000000000000000000000000929606',
          '02502926381eb5522f2e02',
          '02502926381eb5522f2e02',
          '02512926381eb552112e02010209232710493900e0804451b1'
        ]
      },
      {
        '02622926381f2e00000000000000000000000000636b':
        [
          '02622926381f2e00000000000000000000000000636b06',
          '02502926381eb5522f2e00',
          '02512926381eb552112e00000100e03901ff01001e06050000'
        ]
      },
      {
        '02622926381f2e000000010000000000000000009f3a':
        [
          '02622926381f2e000000010000000000000000009f3a15'
        ]
      }
    ];

    gw.connect(host, function () {
      gw.thermostat('292638')
        .details()
        .then(function (details) {
          should.exist(details);
          should.not.exist(details.setpoints.highHumidity);
          should.not.exist(details.setpoints.lowHumidity);

          done();
        });
    });
  });

  it('enables monitoring mode #1', function (done) {
    this.slow(500);
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '0260': '0260ffffff03159b06'
      },
      {
        '0262aaaaaa1f2f0000000fff010000000000000000c2':
        [
          '0262aaaaaa1f2f0000000fff010000000000000000c206',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fff0142efcccccc0100efb9'
        ]
      },
      {
        '0262aaaaaa1f2f0000000ff7010000000000000000ca':
        [
          '0262aaaaaa1f2f0000000ff7010000000000000000ca06',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010ff701c2efffffff0000008c'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fef010000000000000000d2':
        [
          '0262aaaaaa1f2f0000000fef010000000000000000d206',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fef01c2feffffff00000085'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fe7010000000000000000da':
        [
          '0262aaaaaa1f2f0000000fe7010000000000000000da06',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fe701e201ffffff03159bb7'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fdf010000000000000000e2':
        [
          '0262aaaaaa1f2f0000000fdf010000000000000000e206',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fdf01a201ffffff3c4b43e8'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fd7010000000000000000ea':
        [
          '0262aaaaaa1f2f0000000fd7010000000000000000ea06',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fd7010000000000000000e9'
        ]
      },
      {
        '0269': '026915'
      },
      {
        '026f2082efaaaaaa000000':
        [
          '026f2082efaaaaaa00000015'
        ]
      },
      {
        '0262aaaaaa1f2e0008000000000000000000000000ca':
        [
          '0262aaaaaa1f2e0008000000000000000000000000ca06',
          '0250aaaaaa239acf2b2e00'
        ]
      }
    ];

    gw.connect(host, function () {
      var thermostat = gw.thermostat('aaaaaa');

      thermostat.monitor(function (err, status) {
        should.not.exist(err);
        (status === null).should.be.true;
        done();
      });
    });
  });

  it('disables monitoring mode', function (done) {
    this.slow(500);
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '0260': '0260ffffff03159b06'
      },
      {
        '0262aaaaaa1f2f0000000fff010000000000000000c2':
        [
          '0262aaaaaa1f2f0000000fff010000000000000000c206',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fff0142efcccccc0100efb9'
        ]
      },
      {
        '0262aaaaaa1f2f0000000ff7010000000000000000ca':
        [
          '0262aaaaaa1f2f0000000ff7010000000000000000ca06',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010ff701c2efffffff0000008c'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fef010000000000000000d2':
        [
          '0262aaaaaa1f2f0000000fef010000000000000000d206',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fef01c2feffffff00000085'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fe7010000000000000000da':
        [
          '0262aaaaaa1f2f0000000fe7010000000000000000da06',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fe701e201ffffff03159bb7'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fdf010000000000000000e2':
        [
          '0262aaaaaa1f2f0000000fdf010000000000000000e206',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fdf01a201ffffff3c4b43e8'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fd7010000000000000000ea':
        [
          '0262aaaaaa1f2f0000000fd7010000000000000000ea06',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fd7010000000000000000e9'
        ]
      },
      {
        '0269': '026915'
      },
      {
        '026f8000efaaaaaa000000':
        [
          '026f8000efaaaaaa00000015'
        ]
      },
      {
        '0262aaaaaa1f2f0000020ff70842efffffff00000093':
        [
          '0262aaaaaa1f2f0000020ff70842efffffff0000009306',
          '0250aaaaaa239acf2b2e00'
        ]
      }
    ];

    gw.connect(host, function () {
      var thermostat = gw.thermostat('aaaaaa');

      thermostat.monitor(false).then(function (status) {
        (status === null).should.be.true;
        done();
      });
    });
  });

  it('enables monitoring mode #2', function (done) {
    this.slow(500);
    var gw = new Insteon();

    mockHub.mockData = [
      {
        '0260': '0260ffffff03159b06'
      },
      {
        '0262aaaaaa1f2f0000000fff010000000000000000c2':
        [
          '0262aaaaaa1f2f0000000fff010000000000000000c206',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fff0142efcccccc0100efb9'
        ]
      },
      {
        '0262aaaaaa1f2f0000000ff7010000000000000000ca':
        [
          '0262aaaaaa1f2f0000000ff7010000000000000000ca06',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010ff701c2efffffff0000008c'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fef010000000000000000d2':
        [
          '0262aaaaaa1f2f0000000fef010000000000000000d206',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fef01c2feffffff00000085'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fe7010000000000000000da':
        [
          '0262aaaaaa1f2f0000000fe7010000000000000000da06',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fe701e201ffffff03159bb7'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fdf010000000000000000e2':
        [
          '0262aaaaaa1f2f0000000fdf010000000000000000e206',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fdf01a201ffffff3c4b43e8'
        ]
      },
      {
        '0262aaaaaa1f2f0000000fd7010000000000000000ea':
        [
          '0262aaaaaa1f2f0000000fd7010000000000000000ea06',
          '0250aaaaaaffffff2b2f00',
          '0251aaaaaaffffff112f0000010fd7010000000000000000e9'
        ]
      },
      {
        '0269': '026915'
      },
      {
        '026f2082efaaaaaa000000':
        [
          '026f2082efaaaaaa00000015'
        ]
      },
      {
        '0262aaaaaa1f2e0008000000000000000000000000ca':
        [
          '0262aaaaaa1f2e0008000000000000000000000000ca06',
          '0250aaaaaa239acf2b2e00'
        ]
      }
    ];

    gw.connect(host, function () {
      var thermostat = gw.thermostat('aaaaaa');

      thermostat.monitor().then(function (status) {
        (status === null).should.be.true;
        done();
      });
    });
  });

  it('cancels pending command', function (done) {
    var gw = new Insteon();

    gw.connect(host, function () {
      var thermostat = gw.thermostat('112233');
      var plan = new Plan(3, done);

      thermostat.tempUp().then(function () {
        plan.ok();
      });

      thermostat.tempDown().then(function () {
        throw new Error('This command should have been canceled.');
      }).fail(function (err) {
        should.exist(err);
        err.message.should.equal('Canceled');
        plan.ok();

        setTimeout(function () {
          mockHub.send([
            '02621122331f6802000000000000000000000000009606',
            '02501122331eb5522f6802'
          ], function () {
            plan.ok();
          });
        }, 10);
      });

      setTimeout(function () {
        thermostat.cancelPending();
      }, 100);
    });
  });

}); //discribe Thermostat Commands

describe('Thermostat Events', function () {

  it('emits monitoring events', function (done) {
    var gw = new Insteon();
    var plan = new Plan(6, done);

    gw.connect(host, function () {
      var thermostat = gw.thermostat('aaaaaa');

      thermostat.on('status', function (status) {
        should.exist(status);
        if (!!status.temperature) {
          status.temperature.should.equal(88);
          plan.ok();
        } else if (!!status.humidity) {
          status.humidity.should.equal(41);
          plan.ok();
        } else if (!!status.mode) {
          status.mode.should.equal('heat');
          status.fan.should.equal(true);
          plan.ok();
        } else if (!!status.coolSetpoint) {
          status.coolSetpoint.should.equal(75);
          plan.ok();
        } else if (!!status.heatSetpoint) {
          status.heatSetpoint.should.equal(70);
          plan.ok();
        } else {
          throw new Error('Uknown status report.', status);
        }
      });

      setTimeout(function () {
        mockHub.send([
          '0250aaaaaaffffff016eb0', // temperature
          '0250aaaaaaffffff016f29', // humidity
          '0250aaaaaaffffff017011', // mode
          '0250aaaaaaffffff01714b', // coolSetpoint
          '0250aaaaaaffffff017246' // heatSetpoint
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits cooling event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var thermostat = gw.thermostat('292638');

    thermostat.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.equal('11');
      plan.ok();
    });

    thermostat.on('cooling', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250292638000001cb1100',
          '02502926381eb552401101',
          '02502926381eb552451101',
          '0250292638110101cf0600',
          '0250292638110101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits heating event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var thermostat = gw.thermostat('292638');

    thermostat.on('command', function (group, cmd1) {
      group.should.equal(2);
      cmd1.should.equal('11');
      plan.ok();
    });

    thermostat.on('heating', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250292638000002cb1100',
          '02502926381eb552401102',
          '02502926381eb552451102',
          '0250292638110202cf0600',
          '0250292638110202cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits off event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var thermostat = gw.thermostat('292638');

    thermostat.on('command', function (group, cmd1) {
      group.should.equal(1);
      cmd1.should.equal('13');
      plan.ok();
    });

    thermostat.on('off', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250292638000001cb1300',
          '02502926381eb552401301',
          '02502926381eb552451301',
          '0250292638130101cf0600',
          '0250292638130101cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits highHumidity event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var thermostat = gw.thermostat('292638');

    thermostat.on('command', function (group, cmd1) {
      group.should.equal(3);
      cmd1.should.equal('11');
      plan.ok();
    });

    thermostat.on('highHumidity', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250292638000003cb1100',
          '02502926381eb552401103',
          '02502926381eb552451103',
          '0250292638110303cf0600',
          '0250292638110303cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits lowHumidity event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var thermostat = gw.thermostat('292638');

    thermostat.on('command', function (group, cmd1) {
      group.should.equal(4);
      cmd1.should.equal('11');
      plan.ok();
    });

    thermostat.on('lowHumidity', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250292638000004cb1100',
          '02502926381eb552401104',
          '02502926381eb552451104',
          '0250292638110404cf0600',
          '0250292638110404cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('emits normalHumidity event', function (done) {
    var plan = new Plan(3, done);
    var gw = new Insteon();
    var thermostat = gw.thermostat('292638');

    thermostat.on('command', function (group, cmd1) {
      group.should.equal(4);
      cmd1.should.equal('13');
      plan.ok();
    });

    thermostat.on('normalHumidity', function () {
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250292638000004cb1300',
          '02502926381eb552401304',
          '02502926381eb552451304',
          '0250292638130404cf0600',
          '0250292638130404cf0600'
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

  it('receives invalid event', function (done) {
    var plan = new Plan(2, done);
    var gw = new Insteon();
    var thermostat = gw.thermostat('292638');

    thermostat.on('command', function (group, cmd1) {
      group.should.equal(4);
      cmd1.should.equal('17');
      plan.ok();
    });

    gw.connect(host, function () {
      setTimeout(function () { // make sure server connection event fires first
        mockHub.send([
          '0250292638000004cb1700',
        ], function () {
          plan.ok();
        });
      }, 10);
    });
  });

});
