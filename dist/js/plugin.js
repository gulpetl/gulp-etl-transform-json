"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const through2 = require('through2');
const PluginError = require("plugin-error");
const pkginfo = require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;
const loglevel = require("loglevel");
const log = loglevel.getLogger(PLUGIN_NAME); // get a logger instance based on the project name
log.setLevel((process.env.DEBUG_LEVEL || 'warn'));
const stringify = require('csv-stringify');
const split = require('split2');
var transform = require('qewd-transform-json').transform;
var merge = require('merge'), original, cloned;
/** wrap incoming recordObject in a Singer RECORD Message object*/
function createRecord(recordObject, streamName) {
    return { type: "RECORD", stream: streamName, record: recordObject };
}
function transformer(inputObj, configObj, changeMap) {
    if (inputObj instanceof Array) {
        inputObj = {
            __rootArray: inputObj
        };
    }
    var newObj = transform(configObj, inputObj);
    let resultArray = [];
    resultArray.push('[');
    if (newObj instanceof Array) { //this is the case if you have array of maps
        for (let i in newObj) {
            //root Array is only used when input object is an instance of array
            if (newObj[i].__rootArray) { //remove the wrapped rootArray 
                var tempObj = newObj[i].__rootArray;
                if (tempObj instanceof Array) {
                    for (let j in tempObj) {
                        if (changeMap == true) {
                            if (inputObj.__rootArray) {
                                inputObj = inputObj.__rootArray;
                            }
                            tempObj[j] = merge(inputObj[j], tempObj[j]); //merged mapped object with one input object but array of maps 
                        }
                        //let handledObj = handleLine(tempObj[j], streamName)
                        let tempLine = JSON.stringify(tempObj[j]);
                        if (j != "0" || i != "0") {
                            resultArray.push(',');
                        }
                        if (tempLine) {
                            resultArray.push(tempLine);
                        }
                    }
                }
            }
            else {
                if (changeMap == true) { //case for one input object but array of maps
                    newObj[i] = merge(inputObj, newObj[i]); //once merged changes the input object to new merged object
                }
                //let handledObj = handleLine(newObj[i], streamName)
                let tempLine = JSON.stringify(newObj[i]);
                if (i != "0") {
                    resultArray.push(',');
                }
                if (tempLine) {
                    resultArray.push(tempLine);
                }
            }
        }
    }
    else {
        if (newObj.__rootArray) { //case for array of input object but one map
            newObj = newObj.__rootArray;
        }
        if (newObj instanceof Array) {
            for (let i in newObj) {
                if (changeMap == true) {
                    if (inputObj.__rootArray) {
                        inputObj = inputObj.__rootArray;
                    }
                    newObj[i] = merge(inputObj[i], newObj[i]); //merged mapped object with input object for one objects but array of maps
                }
                //let handledObj = handleLine(newObj[i], streamName)
                let tempLine = JSON.stringify(newObj[i]);
                if (i != "0") {
                    resultArray.push(',');
                }
                if (tempLine) {
                    resultArray.push(tempLine);
                }
            }
        }
        else { //this is  the case of one object and one map
            if (changeMap == true) {
                newObj = merge(inputObj, newObj);
            }
            //let handledObj = handleLine(newObj, streamName)
            let tempLine = JSON.stringify(newObj);
            resultArray.push(tempLine);
        }
    }
    resultArray.push(']');
    return resultArray;
}
function targetJson(configObj, changeMap) {
    //if (!configObj) configObj = {}
    //  if (!configObj.columns) configObj.columns = true // we don't allow false for columns; it results in arrays instead of objects for each record
    // creating a stream through which each file will pass - a new instance will be created and invoked for each file 
    // see https://stackoverflow.com/a/52432089/5578474 for a note on the "this" param
    const strm = through2.obj(function (file, encoding, cb) {
        const self = this;
        let returnErr = null;
        // preprocess line object
        const handleLine = (lineObj, _streamName) => {
            lineObj = lineObj.record;
            return lineObj;
        };
        // set the stream name to the file name (without extension)
        let streamName = file.stem;
        if (file.isBuffer()) {
            try {
                const linesArray = file.contents.toString().split('\n');
                let tempLine;
                let resultArray = [];
                // we'll call handleLine on each line
                for (let dataIdx in linesArray) {
                    try {
                        if (linesArray[dataIdx].trim() == "")
                            continue;
                        let lineObj = JSON.parse(linesArray[dataIdx]);
                        tempLine = handleLine(lineObj, streamName);
                        //console.log(tempLine)
                        if (tempLine) {
                            resultArray.push(tempLine);
                        }
                    }
                    catch (err) {
                        returnErr = new PluginError(PLUGIN_NAME, err);
                    }
                }
                let inputObj = resultArray;
                //the input object here is always an instance of array
                //as a result configobj always has to be inside the rootarray
                let mappedArray = transformer(inputObj, configObj, changeMap);
                let data = mappedArray.join('');
                file.contents = Buffer.from(data);
                //file.contents = Buffer.from(data)
                return cb(returnErr, file);
            }
            catch (err) {
                returnErr = new PluginError(PLUGIN_NAME, err);
                return cb(returnErr, file);
            }
        }
    });
    return strm;
}
exports.targetJson = targetJson;
function transformJson(configObj, changeMap) {
    const strm = through2.obj(function (file, encoding, cb) {
        let returnErr = null;
        if (file.isBuffer()) {
            let inputObj = JSON.parse(file.contents.toString());
            let mappedArray = transformer(inputObj, configObj, changeMap);
            //let data:string = JSON.stringify(mappedArray)
            let data = mappedArray.join('');
            file.contents = Buffer.from(data);
            //file.contents = Buffer.from(data)
            return cb(returnErr, file);
        }
    });
    return strm;
}
exports.transformJson = transformJson;
function tapJson(configObj, changeMap) {
    const strm = through2.obj(function (file, encoding, cb) {
        let returnErr = null;
        let streamName = file.stemc;
        const handleLine = (lineObj, _streamName) => {
            let newObj = createRecord(lineObj, _streamName);
            lineObj = newObj;
            return lineObj;
        };
        if (file.isBuffer()) {
            let inputObj = JSON.parse(file.contents.toString());
            let mappedArray = transformer(inputObj, configObj, changeMap);
            let joinedArray = mappedArray.join(''); //need to join the mappedArray otherwiese it treats ',' and '[]' as separate object
            mappedArray = JSON.parse(joinedArray);
            let resultArray = [];
            if (mappedArray instanceof Array) {
                for (let i in mappedArray) {
                    let handleObj = handleLine(mappedArray[i], streamName);
                    let tempLine = JSON.stringify(handleObj);
                    if (i != "0") {
                        resultArray.push('\n');
                    }
                    if (tempLine) {
                        resultArray.push(tempLine);
                    }
                }
            }
            let data = resultArray.join('');
            file.contents = Buffer.from(data);
            return cb(returnErr, file);
        }
    });
    return strm;
}
exports.tapJson = tapJson;
//# sourceMappingURL=plugin.js.map