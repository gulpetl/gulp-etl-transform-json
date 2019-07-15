let gulp = require('gulp')
import {targetJson} from '../src/plugin'
import {transformJson} from '../src/plugin'
import {tapJson} from '../src/plugin'

import * as loglevel from 'loglevel'
const log = loglevel.getLogger('gulpfile')
log.setLevel((process.env.DEBUG_LEVEL || 'warn') as loglevel.LogLevelDesc)
// if needed, you can control the plugin's logging level separately from 'gulpfile' logging above
// const pluginLog = loglevel.getLogger(PLUGIN_NAME)
// pluginLog.setLevel('debug')

import * as rename from 'gulp-rename'
const errorHandler = require('gulp-error-handle'); // handle all errors in one handler, but still stop the stream if there are errors

require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;

import Vinyl = require('vinyl') 

let mapDir = '../testdata/maps/'
let mapFileBase: string = 'mapEmpty'

let testDir = '../testdata/tests/'
let testFileBase: string = 'testObj'
let changeMap = false;

//if you want your final object as an original object but with only the differences
function changeMapTrue(callback: any) {
  changeMap = true;
  callback();
}

let loadedMap:string
let suffix:string
function loadMapAndSuffix() {
  loadedMap = require(mapDir + mapFileBase + '.json');
  suffix = "-" + mapFileBase
  if (changeMap) suffix = '-change' + suffix
}


function runtargetJson(callback: any) {
  log.info('gulp task starting for ' + PLUGIN_NAME)
  loadMapAndSuffix()

  return gulp.src(testDir + testFileBase + '.ndjson',{buffer: true})
    .pipe(errorHandler(function(err:any) {
      log.error('Error: ' + err)
      callback(err)
    }))
    .on('data', function (file:Vinyl) {
      log.info('Starting processing on ' + file.basename  + " and mapping to " + mapFileBase)
    })  
    .pipe(targetJson({map:loadedMap, changeMap:changeMap}))
    .pipe(rename({
      "prefix": 'TGT-',
      "suffix": suffix
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
  try {
  log.info('gulp task starting for ' + PLUGIN_NAME)
  loadMapAndSuffix() 

  return gulp.src(testDir + testFileBase + '.ndjson',{buffer: true})
    .pipe(errorHandler(function(err:any) {
      log.error('Error: ' + err)
      callback(err)
    }))
    .on('data', function (file:Vinyl) {
      log.info('Starting processing on ' + file.basename  + " and mapping to " + mapFileBase)
    })  
    .pipe(transformJson({map:loadedMap, changeMap:changeMap, mapFullStreamObj:false}))  
    .pipe(rename({
      "prefix": 'TFM-',
      "suffix": suffix
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
  catch (err) {
    
    return callback(err)        
  }
}

function runtapJson(callback: any) {
  log.info('gulp task starting for ' + PLUGIN_NAME)
  loadMapAndSuffix() 

  return gulp.src(testDir + testFileBase + '.json',{buffer: true})
    .pipe(errorHandler(function(err:any) {
      log.error('Error: ' + err)
      callback(err)
    }))
    .on('data', function (file:Vinyl) {
      log.info('Starting processing on ' + file.basename  + " and mapping to " + mapFileBase)
    })  
    .pipe(tapJson({map:loadedMap, changeMap:changeMap}))
    .pipe(rename({
      "prefix": 'TAP-',
      "suffix": suffix
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

function testObj(callback: any) {
  testFileBase = 'testObj';
  callback();
}

function testArr(callback: any) {
  testFileBase = 'testArr';
  callback();
}

function mapObj(callback: any) {
  mapFileBase = 'mapObj'
  callback();
}

function mapArr(callback: any) {
  mapFileBase = 'mapArr';
  callback();
}

function mapArrRoot(callback: any) {
  mapFileBase= 'mapArrRoot';
  callback();
}

function mapObjRoot(callback: any) {
  mapFileBase = 'mapObjRoot';
  callback();
}

function mapEmpty(callback: any) {
  mapFileBase = 'mapEmpty';
  callback();
}

exports.runtransformJson = gulp.series(changeMapTrue, runtransformJson)

//input file with one object is required
exports.oneinputobjectonemapobject = gulp.series(testObj, mapObj, runtransformJson)
//inorder to merge mapped object with original object and only get the final merged file
exports.oneinputobjectonemapobjectmerge = gulp.series(testObj, changeMapTrue, mapObj, runtransformJson)

//input file with one object is required
exports.oneinputobjectarraymapobject = gulp.series(testObj, mapArr, runtransformJson)
//inorder to merge mapped object with original object and only get the final merged file
exports.oneinputobjectarraymapobjectmerge = gulp.series(testObj, changeMapTrue, mapArr, runtransformJson)

//input file with array of object is required
exports.arrayinputobjectarraymapobject = gulp.series(testArr,mapArr, runtransformJson)
//inorder to merge mapped object with original object and only get the final merged file
exports.arrayinputobjectarraymapobjectmerge = gulp.series(testArr, changeMapTrue, mapArr, runtransformJson)

//input file with array of object is required
exports.arrayinputobjectonemapobject = gulp.series(testArr, mapObj, runtransformJson)
//inorder to merge mapped object with original object and only get the final merged file
exports.arrayinputobjectonemapobjectmerge = gulp.series(testArr, changeMapTrue, mapObj, runtransformJson)

exports.TAP_testArr_change_mapEmpty = gulp.series(testArr, changeMapTrue, mapEmpty, runtapJson)



exports.runtapJson = gulp.series(changeMapTrue, runtapJson)
exports.taparrayinputobjectarraymapobject = gulp.series(testArr, mapArrRoot, runtapJson )

exports.runtargetJson = gulp.series(changeMapTrue,runtargetJson)
exports.targetarrayinputobjectarraymapobject = gulp.series(testArr,mapArr, runtargetJson)
//exports.runtargetCsvBuffer = gulp.series(switchToBuffer, runtargetCsv)