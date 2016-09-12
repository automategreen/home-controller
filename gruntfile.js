'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      lib: {
        src: ['gruntfile.js', 'index.js', 'lib/**/*.js'],
        options: {
          jshintrc: '.jshintrc'
        }
      },
      test: {
        src: ['test/**/*.js'],
        options: {
          jshintrc: 'test/.jshintrc'
        }
      },
      bin: {
        src: ['bin/**/*'],
        options: {
          jshintrc: '.jshintrc'
        }
      }
    },

    mocha_istanbul: {
      coverage: {
        src: 'test',
        options: {
          root: './lib/Insteon/',
          reportFormats: ['html', 'lcovonly']
        },
        check: {
          lines: 60,
          statements: 60
        },
      },
      coveralls: {
        src: 'test',
        options: {
          root: './lib/Insteon/',
          reportFormats: ['lcovonly'],
          coverage:true
        },
        check: {
          lines: 60,
          statements: 60
        },
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-mocha-istanbul');

  grunt.event.on('coverage', function(lcov, done){
      require('coveralls').handleInput(lcov, function(err){
          if (err) {
              return done(err);
          }
          done();
      });
  });

  grunt.registerTask('default', ['jshint', 'mocha_istanbul:coverage']);
  grunt.registerTask('coverage', ['jshint', 'mocha_istanbul:coverage']);
  grunt.registerTask('test', ['jshint', 'mocha_istanbul:coveralls']);
};