'use strict';

var fs = require("fs");
var async = require('async');
var complexity = require("./complexity");
var parse = require("./parse");
var path = require('path');
var mkdirp = require('mkdirp');
require("./tokens");

var run = exports.run = function (file, options, callback) {
  mkdirp(options.output, function (err) {
    if (err) {
      return callback(err);
    }

    if (file instanceof Array) {
      async.forEachSeries(file, function (f, forEachCallback) {
        run(f, options, forEachCallback);
      }, callback);
      return;
    }

    runFile(file, options, function (err) {
      if (err) {
        console.error('ERROR processing file', file, '...', err.stack || err);
        return callback();
      }
      callback();
    });
  });
};

function runFile(file, options, callback) {
  var destFilename = path.join(options.output, path.relative('.', file).replace(/.js$/, '.json'));
  mkdirp(path.dirname(destFilename), function (err) {
    if (err) {
      return callback(err);
    }
    fs.readFile(file, 'utf8', function (err, source) {
      if (err) {
        return callback(err);
      }

      source = 'var module = { exports: {} }; var exports = {}; var require = function(){};' + source;
      source = source.replace(/'use strict';?/, '');

      var name = path.basename(file);
      generateComplexityReport(name, source, options, function (err, result) {
        if (err) {
          return callback(err);
        }
        flattenParents(result);
        result = JSON.stringify(result, null, '  ');
        fs.writeFile(destFilename, result, callback);
      });
    });
  });
}

function generateComplexityReport(name, source, options, callback) {
  try {
    var parser = parse.make_parse();
    var tree = parser(source);
    var complexityAnalyzer = complexity.make_complexity();
    complexityAnalyzer.complexity(tree, name);
    var reportData = '';
    var outputOptions = {
      write: function (data) {
        reportData += data;
      }
    };
    complexityAnalyzer.renderStats(outputOptions, "JSON");
    var data = JSON.parse(reportData);
    callback(null, data);
  } catch (err) {
    callback(err);
  }
}

function flattenParents(resultsArray) {
  resultsArray.forEach(function (result) {
    if (result.parent && result.parent.name) {
      result.parent = result.parent.name;
    }
  });
}