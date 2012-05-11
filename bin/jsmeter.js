//#!/usr/bin/env node
'use strict'

var glob = require('glob');
var async = require('async');
var fs = require('fs');
var path = require('path');
var jsmeter = require('../lib/index');

var argv = require('optimist')
  .usage('Usage: $0 [options] <files>')
  .options('o', {
    alias: 'output',
    default: './jsmeter/'
  })
  .argv;

var files = [];
async.forEach(argv._, function (file, callback) {
  file = path.resolve(file);
  fs.stat(file, function (err, stat) {
    if (err) {
      return callback(err);
    }

    if (stat.isDirectory()) {
      file = path.join(file, '**/*.js');
      glob(file, function (err, globFiles) {
        if (err) {
          return callback(err);
        }
        files = files.concat(globFiles);
        callback();
      });
    } else {
      files.push(file);
      callback();
    }
  });
}, function (err) {
  if (err) {
    console.error(err);
    return process.exit(1);
  }
  jsmeter.run(files, argv, function (err) {
    if (err) {
      console.error(err);
      return process.exit(1);
    }
    process.exit(0);
  });
});
