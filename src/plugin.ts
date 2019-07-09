const through2 = require('through2')
import Vinyl = require('vinyl')
import PluginError = require('plugin-error');
const pkginfo = require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;
import * as loglevel from 'loglevel'
const log = loglevel.getLogger(PLUGIN_NAME) // get a logger instance based on the project name
log.setLevel((process.env.DEBUG_LEVEL || 'warn') as log.LogLevelDesc)

const stringify = require('csv-stringify')
const split = require('split2')

var transform = require('qewd-transform-json').transform
var merge = require('merge'), original, cloned
var replaceExt = require('replace-ext');

/** wrap incoming recordObject in a Singer RECORD Message object*/
function createRecord(recordObject:Object, streamName: string) : any {
  return {type:"RECORD", stream:streamName, record:recordObject}
}


function transformer(inputObj:any, configObj:any, changeMap:any){
  if (inputObj instanceof Array) {
    inputObj = {
      __rootArray: inputObj
    }
  }
  var newObj = transform(configObj, inputObj)
  

  let resultArray = []
    if(newObj instanceof Array){//this is the case if you have array of maps
        
      for (let i in newObj){
         
        //root Array is only used when input object is an instance of array
        if (newObj[i].__rootArray) {//remove the wrapped rootArray 
          var tempObj = newObj[i].__rootArray
          if(tempObj instanceof Array){
            for (let j in tempObj){   
              if (changeMap == true){
                if(inputObj.__rootArray){
                  inputObj = inputObj.__rootArray
                }  
                tempObj[j] = merge(inputObj[j], tempObj[j])//merged mapped object with one input object but array of maps 
              }
              //let handledObj = handleLine(tempObj[j], streamName)
              let tempLine = JSON.stringify(tempObj[j])
              if(tempLine){
                resultArray.push(tempLine);  
              } 
            }
          }
            
        }
        else{
            
          if (changeMap == true){//case for one input object but array of maps
            newObj[i] = merge(inputObj, newObj[i])//once merged changes the input object to new merged object
          }
          //let handledObj = handleLine(newObj[i], streamName)
          let tempLine = JSON.stringify(newObj[i]) 
          if(tempLine){
            resultArray.push(tempLine);  
          } 
            
        }
      }
    }
    else{
      if (newObj.__rootArray) {//case for array of input object but one map
        newObj = newObj.__rootArray
      }
      if (newObj instanceof Array) {
        for (let i in newObj) {
            
          if (changeMap == true){
            if(inputObj.__rootArray){
              inputObj = inputObj.__rootArray
            } 
            newObj[i] = merge(inputObj[i], newObj[i])//merged mapped object with input object for one objects but array of maps
          }
          let tempLine = JSON.stringify(newObj[i])
          if(tempLine){
             resultArray.push(tempLine);  
          } 
        } 
      } 
      else {//this is  the case of one object and one map
          
        if (changeMap == true){
          newObj = merge(inputObj, newObj)
        }
        let tempLine = JSON.stringify(newObj)
        resultArray.push(tempLine);
      }

    }

  return resultArray
  
  
}


export function targetJson(configObj: any, changeMap:any) {
  //if (!configObj) configObj = {}
//  if (!configObj.columns) configObj.columns = true // we don't allow false for columns; it results in arrays instead of objects for each record

  // creating a stream through which each file will pass - a new instance will be created and invoked for each file 
  // see https://stackoverflow.com/a/52432089/5578474 for a note on the "this" param
  const strm = through2.obj(function (this: any, file: Vinyl, encoding: string, cb: Function) {
    const self = this
    let returnErr: any = null
  
    // preprocess line object
    const handleLine = (lineObj: any, _streamName : string): object | null => {
      lineObj = lineObj.record
      return lineObj
    }

    // set the stream name to the file name (without extension)
    let streamName : string = file.stem
    if (file.isBuffer()) {
      try {
        const linesArray = (file.contents as Buffer).toString().split('\n')
        let tempLine: any
        let resultArray = [];
        let tempresultArray = [];
        // we'll call handleLine on each line
        tempresultArray.push('[')
        for (let dataIdx in linesArray) {
          try {
            if (linesArray[dataIdx].trim() == "") continue
            let lineObj = JSON.parse(linesArray[dataIdx])
            tempLine = handleLine(lineObj, streamName)
            //console.log(tempLine)
            if (tempLine){
              let mapObj = transformer(tempLine, configObj, changeMap)
              
              if(dataIdx != "0"){
                tempresultArray.push(',')
              }              
              tempresultArray.push(mapObj)

              //resultArray.push(tempLine);
            }
          } catch (err) {
            returnErr = new PluginError(PLUGIN_NAME, err);
          }
        }
        tempresultArray.push(']')
        let tempdata:string = tempresultArray.join('')
        file.contents = Buffer.from(tempdata)
        file.path = replaceExt(file.path, '.json')
        return cb(returnErr, file)

      }
      catch (err) {
        returnErr = new PluginError(PLUGIN_NAME, err);
        file.path = replaceExt(file.path, '.json')
        return cb(returnErr, file)        
      }

    }

  })

  return strm
}


export function transformJson(configObj: any, changeMap:any){
  const strm = through2.obj(function (this: any, file: Vinyl, encoding: string, cb: Function) {
    let returnErr: any = null
    if (file.isBuffer()) {
      let inputObj = JSON.parse(file.contents.toString())
      let mappedArray = transformer(inputObj, configObj, changeMap)
      let resultArray = []
      resultArray.push('[')
      for(let i in mappedArray){
        
        if(i != "0"){
          resultArray.push(',')
        }
        resultArray.push(mappedArray[i])
      }
      resultArray.push(']')
      //let data:string = JSON.stringify(mappedArray)
     let data:string = resultArray.join('')
      file.contents = Buffer.from(data)
      //file.contents = Buffer.from(data)
      file.path = replaceExt(file.path, '.json')
      return cb(returnErr, file)

    }
  })
  return strm
}


export function tapJson(configObj: any, changeMap:any){
  const strm = through2.obj(function (this: any, file: Vinyl, encoding: string, cb: Function) {
    let returnErr: any = null
    let streamName : string = file.stemc


    const handleLine = (lineObj: any, _streamName : string): object | null => {
      let newObj = createRecord(lineObj, _streamName)
      lineObj = newObj
    return lineObj
  }


    if (file.isBuffer()) {
      let inputObj = JSON.parse(file.contents.toString())
      let mappedArray = transformer(inputObj, configObj, changeMap)
      let resultArray = []
      if(mappedArray instanceof Array){
        for(let i in mappedArray){
          mappedArray[i] = JSON.parse(mappedArray[i])
          let handleObj = handleLine(mappedArray[i], streamName)
          let tempLine = JSON.stringify(handleObj)
          if(i != "0"){
            resultArray.push('\n');
          }
          if(tempLine){
            resultArray.push(tempLine)
          }
        }
      }
      else{
        let handleObj = handleLine(mappedArray, streamName)
        let tempLine = JSON.stringify(handleObj)
        resultArray.push(tempLine)
      }

      let data:string = resultArray.join('')
      file.contents = Buffer.from(data)
      file.path = replaceExt(file.path, '.ndjson')
      return cb(returnErr, file)

    }
  })
  return strm
}