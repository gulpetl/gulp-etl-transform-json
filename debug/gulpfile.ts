let gulp = require('gulp')
import {targetJson} from '../src/plugin'
import {transformJson} from '../src/plugin'
import {tapJson} from '../src/plugin'

import * as loglevel from 'loglevel'
const log = loglevel.getLogger('gulpfile')
log.setLevel((process.env.DEBUG_LEVEL || 'warn') as log.LogLevelDesc)
// if needed, you can control the plugin's logging level separately from 'gulpfile' logging above
// const pluginLog = loglevel.getLogger(PLUGIN_NAME)
// pluginLog.setLevel('debug')

import * as rename from 'gulp-rename'
const errorHandler = require('gulp-error-handle'); // handle all errors in one handler, but still stop the stream if there are errors

const pkginfo = require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;

import Vinyl = require('vinyl') 

var maps = require('../testdata/maps/map-empty.json');
var src = '../testdata/tests/test-oneobject - Copy.json';
var srctarget = '../testdata/tests/test-oneobject - Copy.ndjson';
let mergeOriginal = false;

//if you want your final object as an original object but with only the differences
function switchmergeOriginal(callback: any) {
  mergeOriginal = true;
  callback();
}




function runtargetJson(callback: any) {
  log.info('gulp task starting for ' + PLUGIN_NAME)

  return gulp.src(srctarget,{buffer: true})
    .pipe(errorHandler(function(err:any) {
      log.error('Error: ' + err)
      callback(err)
    }))
    .on('data', function (file:Vinyl) {
      log.info('Starting processing on ' + file.basename)
    })  
    //.pipe(transformJson(maps, mergeOriginal))  
    .pipe(targetJson(maps, mergeOriginal))
    //.pipe(tapJson(maps, mergeOriginal))
    .pipe(rename({
      extname: ".json",
    }))      
    .pipe(gulp.dest('../testdata/processed'))
    .on('data', function (file:Vinyl) {
      log.info('Finished processing on ' + file.basename)
    })    
    .on('end', function () {
      log.info('gulp task complete')
      callback()
    })

}


function runtransformJson(callback: any) {
  log.info('gulp task starting for ' + PLUGIN_NAME)
  
  return gulp.src(src,{buffer: true})
    .pipe(errorHandler(function(err:any) {
      log.error('Error: ' + err)
      callback(err)
    }))
    .on('data', function (file:Vinyl) {
      log.info('Starting processing on ' + file.basename)
    })  
    .pipe(transformJson(maps, mergeOriginal))  
    //.pipe(targetJson(maps, mergeOriginal))
    //.pipe(tapJson(maps, mergeOriginal))
    .pipe(rename({
      extname: ".json",
    }))      
    .pipe(gulp.dest('../testdata/processed'))
    .on('data', function (file:Vinyl) {
      log.info('Finished processing on ' + file.basename)
    })    
    .on('end', function () {
      log.info('gulp task complete')
      callback()
    })

}

function runtapJson(callback: any) {
  log.info('gulp task starting for ' + PLUGIN_NAME)

  return gulp.src(src,{buffer: true})
    .pipe(errorHandler(function(err:any) {
      log.error('Error: ' + err)
      callback(err)
    }))
    .on('data', function (file:Vinyl) {
      log.info('Starting processing on ' + file.basename)
    })  
    //.pipe(transformJson(maps, mergeOriginal))  
    //.pipe(targetJson(maps, mergeOriginal))
    .pipe(tapJson(maps, mergeOriginal))
    .pipe(rename({
      extname: ".ndjson",
    }))      
    .pipe(gulp.dest('../testdata/processed'))
    .on('data', function (file:Vinyl) {
      log.info('Finished processing on ' + file.basename)
    })    
    .on('end', function () {
      log.info('gulp task complete')
      callback()
    })

}

exports.default = gulp.series(runtransformJson)

function testOneObject(callback: any) {
  src = '../testdata/tests/test-oneobject - Copy.json';
  callback();
}

function testArrayofObject(callback: any) {
  src = '../testdata/tests/test-arrayofobject - Copy.json';
  callback();
}

function oneInputMap(callback: any) {
  maps = require('../testdata/maps/map-oneobject - Copy.json');
  callback();
}

function oneInputarrayMap(callback: any) {
  maps = require('../testdata/maps/map-arrayofobject - Copy.json');
  callback();
}

function arrayInputarrayMap(callback: any) {
  maps = require('../testdata/maps/map-arrayofobject-rootarray - Copy.json');
  callback();
}

function arrayInputoneMap(callback: any) {
  maps = require('../testdata/maps/map-oneobject-rootarray - Copy.json');
  callback();
}

exports.runtransformJson = gulp.series(runtransformJson)

//input file with one object is required
exports.oneinputobjectonemapobject = gulp.series(testOneObject, oneInputMap, runtransformJson)
//inorder to merge mapped object with original object and only get the final merged file
exports.oneinputobjectonemapobjectmerge = gulp.series(testOneObject, switchmergeOriginal, oneInputMap, runtransformJson)

//input file with one object is required
exports.oneinputobjectarraymapobject = gulp.series(testOneObject, oneInputarrayMap, runtransformJson)
//inorder to merge mapped object with original object and only get the final merged file
exports.oneinputobjectarraymapobjectmerge = gulp.series(testOneObject, switchmergeOriginal, oneInputarrayMap, runtransformJson)

//input file with array of object is required
exports.arrayinputobjectarraymapobject = gulp.series(testArrayofObject, arrayInputarrayMap, runtransformJson)
//inorder to merge mapped object with original object and only get the final merged file
exports.arrayinputobjectarraymapobjectmerge = gulp.series(testArrayofObject, switchmergeOriginal, arrayInputarrayMap, runtransformJson)

//input file with array of object is required
exports.arrayinputobjectonemapobject = gulp.series(testArrayofObject, arrayInputoneMap, runtransformJson)
//inorder to merge mapped object with original object and only get the final merged file
exports.arrayinputobjectonemapobjectmerge = gulp.series(testArrayofObject, switchmergeOriginal, arrayInputoneMap, runtransformJson)




exports.runtapJson = gulp.series(runtapJson)
exports.taparrayinputobjectarraymapobject = gulp.series(testArrayofObject, arrayInputarrayMap, runtapJson )


function testArrayofObjecttarget(callback: any) {
  srctarget = '../testdata/tests/test-arrayofobject - Copy.ndjson';
  callback();
}


function testOneObjecttarget(callback: any) {
  srctarget = '../testdata/tests/test-oneobject - Copy.ndjson';
  callback();
}

function maptargetdefault(callback: any) {
  maps = require('../testdata/maps/maptarget-empty.json');
  callback();
}
exports.runtargetJson = gulp.series(maptargetdefault,runtargetJson)
exports.targetarrayinputobjectarraymapobject = gulp.series(testArrayofObjecttarget,arrayInputarrayMap, runtargetJson)
//exports.runtargetCsvBuffer = gulp.series(switchToBuffer, runtargetCsv)