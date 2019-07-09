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
var mapext = 'map-empty.json';
var maprename ='map-empty';



var src = '../testdata/tests/test-oneobject.json';
var srctarget = '../testdata/tests/test-oneobject.ndjson';
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
      log.info('Starting processing on ' + file.basename  + " and mapping to " + mapext)
    })  
    //.pipe(transformJson(maps, mergeOriginal))  
    .pipe(targetJson(maps, mergeOriginal))
    //.pipe(tapJson(maps, mergeOriginal))
    .pipe(rename({
      extname: "-"+ maprename + ".json",

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
      log.info('Starting processing on ' + file.basename  + " and mapping to " + mapext)
    })  
    .pipe(transformJson(maps, mergeOriginal))  
    //.pipe(targetJson(maps, mergeOriginal))
    //.pipe(tapJson(maps, mergeOriginal))
    .pipe(rename({
      extname: "-"+ maprename + ".json",
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
      log.info('Starting processing on ' + file.basename  + " and mapping to " + mapext)
    })  
    //.pipe(transformJson(maps, mergeOriginal))  
    //.pipe(targetJson(maps, mergeOriginal))
    .pipe(tapJson(maps, mergeOriginal))
    .pipe(rename({
      extname: "-"+ maprename + ".ndjson",
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
  src = '../testdata/tests/test-oneobject.json';
  callback();
}

function testArrayofObject(callback: any) {
  src = '../testdata/tests/test-array.json';
  callback();
}

function oneInputMap(callback: any) {
  maps = require('../testdata/maps/map-oneobject.json');
  mapext = 'map-oneobject.json';
  maprename = 'map-oneobject';
  callback();
}

function oneInputarrayMap(callback: any) {
  maps = require('../testdata/maps/map-array.json');
  mapext= 'map-array.json';
  maprename = 'map-array';
  callback();
}

function arrayInputarrayMap(callback: any) {
  maps = require('../testdata/maps/map-array-rootarray.json');
  mapext = 'map-array-rootarray.json';
  maprename= 'map-array-rootarray';
  callback();
}

function arrayInputoneMap(callback: any) {
  maps = require('../testdata/maps/map-oneobject-rootarray.json');
  mapext = 'map-oneobject-rootarray.json';
  maprename = 'map-oneobject-rootarray';
  callback();
}

exports.runtransformJson = gulp.series(switchmergeOriginal, runtransformJson)

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




exports.runtapJson = gulp.series(switchmergeOriginal, runtapJson)
exports.taparrayinputobjectarraymapobject = gulp.series(testArrayofObject, arrayInputarrayMap, runtapJson )


function testArrayofObjecttarget(callback: any) {
  srctarget = '../testdata/tests/test-array.ndjson';
  callback();
}


function testOneObjecttarget(callback: any) {
  srctarget = '../testdata/tests/test-oneobject.ndjson';
  callback();
}


exports.runtargetJson = gulp.series(switchmergeOriginal,runtargetJson)
exports.targetarrayinputobjectarraymapobject = gulp.series(testArrayofObjecttarget,oneInputarrayMap, runtargetJson)
//exports.runtargetCsvBuffer = gulp.series(switchToBuffer, runtargetCsv)