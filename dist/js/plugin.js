"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const through2 = require('through2');
const PluginError = require("plugin-error");
require('pkginfo')(module); // project package.json info into module.exports
const PLUGIN_NAME = module.exports.name;
const loglevel = require("loglevel");
const log = loglevel.getLogger(PLUGIN_NAME); // get a logger instance based on the project name
log.setLevel((process.env.DEBUG_LEVEL || 'warn'));
var qewdTransform = require('qewd-transform-json').transform;
var merge = require('merge');
var replaceExt = require('replace-ext');
/** wrap incoming recordObject in a Singer RECORD Message object*/
function createRecord(recordObject, streamName) {
    return { type: "RECORD", stream: streamName, record: recordObject };
}
// preprocess line object
const targethandleLine = (lineObj, _streamName, configObj) => {
    if (!configObj || !configObj.mapFullStreamObj) {
        lineObj = lineObj.record;
    }
    return lineObj;
};
// handleline to create message stream
const taphandleLine = (lineObj, _streamName) => {
    let newObj = createRecord(lineObj, _streamName);
    lineObj = newObj;
    return lineObj;
};
class ConfigObj {
    constructor(initial) {
        /** acts as a "recipe" for creating new object/array using an inputObj as the source */
        this.map = {};
        /** if true, map will change the incoming object; if false, the result of the map operation will replace the incoming object */
        this.changeMap = true;
        /** if true, modes which receive a Message Stream (target and transform) will map against the full Message Stream object instead of just the record portion */
        this.mapFullStreamObj = false;
        if (initial.map !== undefined && initial.map !== null && (initial.map instanceof Array || initial.map instanceof Object)) {
            this.map = initial.map;
        }
        if (!initial.changeMap) {
            this.changeMap = false; // falsey -> false
        }
        if (initial.mapFullStreamObj) {
            this.mapFullStreamObj = true; // truthy -> true
        }
    }
}
function doMerge(inputObj, newObj, configObj) {
    if (configObj.changeMap) {
        newObj = merge(inputObj, newObj);
    }
    return newObj;
}
function unwrapAndMerge(newObj, inputObjOrArr, configObj) {
    if (newObj.__rootArray) { // unwrap __rootArray:   {__rootArray:[...]}  ->  [...] 
        newObj = newObj.__rootArray;
    }
    if (newObj instanceof Array) {
        for (let i in newObj) {
            if (inputObjOrArr instanceof Array)
                throw new PluginError(PLUGIN_NAME, 'Array expected'); // should never happen; code below assumes an array here
            return doMerge(inputObjOrArr[i], newObj[i], configObj);
        }
    }
    else { //this is  the case of one object and one map
        return doMerge(inputObjOrArr, newObj, configObj);
    }
}
function transformer(inputObjOrArr, configObj) {
    configObj = new ConfigObj(configObj); // guarantee that we have a valid ConfigObj
    let resultArray = [];
    // qewdTransform works with objects, not arrays, so if inputObj is an array we wrap it in an object
    if (inputObjOrArr instanceof Array) {
        inputObjOrArr = {
            __rootArray: inputObjOrArr
        };
    }
    var newObj = qewdTransform(configObj.map, inputObjOrArr);
    // if we changed inputObjOrArray put it back like we found it
    if (inputObjOrArr.__rootArray) {
        inputObjOrArr = inputObjOrArr.__rootArray;
    }
    if (newObj instanceof Array) { //this is the case if you have array of maps
        for (let i in newObj) {
            let tempLine = JSON.stringify(unwrapAndMerge(newObj[i], inputObjOrArr, configObj));
            resultArray.push(tempLine);
        }
    }
    else {
        let tempLine = JSON.stringify(unwrapAndMerge(newObj, inputObjOrArr, configObj));
        resultArray.push(tempLine);
    }
    return resultArray;
}
function targetJson(configObj) {
    //if (!configObj) configObj = {}
    //  if (!configObj.columns) configObj.columns = true // we don't allow false for columns; it results in arrays instead of objects for each record
    // creating a stream through which each file will pass - a new instance will be created and invoked for each file 
    // see https://stackoverflow.com/a/52432089/5578474 for a note on the "this" param
    const strm = through2.obj(function (file, encoding, cb) {
        const self = this;
        let returnErr = null;
        // set the stream name to the file name (without extension)
        let streamName = file.stem;
        if (file.isBuffer()) {
            try {
                const linesArray = file.contents.toString().split('\n');
                let tempLine;
                let resultArray = [];
                let tempresultArray = [];
                // we'll call handleLine on each line
                tempresultArray.push('[');
                for (let dataIdx in linesArray) {
                    try {
                        if (linesArray[dataIdx].trim() == "")
                            continue;
                        let lineObj = JSON.parse(linesArray[dataIdx]);
                        tempLine = targethandleLine(lineObj, streamName, configObj);
                        //console.log(tempLine)
                        if (tempLine) {
                            let mapObj = transformer(tempLine, configObj);
                            if (dataIdx != "0") {
                                tempresultArray.push(',');
                            }
                            tempresultArray.push(mapObj);
                            //resultArray.push(tempLine);
                        }
                    }
                    catch (err) {
                        returnErr = new PluginError(PLUGIN_NAME, err);
                    }
                }
                tempresultArray.push(']');
                let tempdata = tempresultArray.join('');
                file.contents = Buffer.from(tempdata);
                file.path = replaceExt(file.path, '.json');
                return cb(returnErr, file);
            }
            catch (err) {
                returnErr = new PluginError(PLUGIN_NAME, err);
                file.path = replaceExt(file.path, '.json');
                return cb(returnErr, file);
            }
        }
    });
    return strm;
}
exports.targetJson = targetJson;
function transformJson(configObj) {
    const strm = through2.obj(function (file, encoding, cb) {
        const self = this;
        let returnErr = null;
        // set the stream name to the file name (without extension)
        let streamName = file.stem;
        if (file.isBuffer()) {
            try {
                const linesArray = file.contents.toString().split('\n');
                let tempLine;
                let resultArray = [];
                for (let dataIdx in linesArray) {
                    try {
                        if (linesArray[dataIdx].trim() == "")
                            continue;
                        let lineObj = JSON.parse(linesArray[dataIdx]);
                        tempLine = targethandleLine(lineObj, streamName, configObj);
                        if (tempLine) {
                            let mappedArray = transformer(tempLine, configObj);
                            if (mappedArray instanceof Array) {
                                for (let i in mappedArray) {
                                    mappedArray[i] = JSON.parse(mappedArray[i]);
                                    let handleObj = taphandleLine(mappedArray[i], streamName);
                                    let tempLine = JSON.stringify(handleObj);
                                    if (dataIdx != "0" || i != "0") {
                                        resultArray.push('\n');
                                    }
                                    if (tempLine) {
                                        resultArray.push(tempLine);
                                    }
                                }
                            }
                            else {
                                let handleObj = taphandleLine(mappedArray, streamName);
                                let tempLine = JSON.stringify(handleObj);
                                resultArray.push(tempLine);
                            }
                        }
                    }
                    catch (err) {
                        returnErr = new PluginError(PLUGIN_NAME, err);
                    }
                }
                let data = resultArray.join('');
                file.contents = Buffer.from(data);
                file.path = replaceExt(file.path, '.ndjson');
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
exports.transformJson = transformJson;
function tapJson(configObj) {
    function tapRecord(mappedArray, streamName) {
        let result = '';
        if (mappedArray instanceof Array) {
            for (let i in mappedArray) {
                mappedArray[i] = JSON.parse(mappedArray[i]);
                let handleObj = taphandleLine(mappedArray[i], streamName);
                let tempLine = JSON.stringify(handleObj);
                if (i != "0") {
                    result += '\n';
                }
                if (tempLine) {
                    result += tempLine;
                }
            }
        }
        else {
            let handleObj = taphandleLine(mappedArray, streamName);
            let tempLine = JSON.stringify(handleObj);
            result += tempLine;
        }
        return result;
    }
    const strm = through2.obj(function (file, encoding, cb) {
        let returnErr = null;
        let streamName = file.stem;
        try {
            if (file.isBuffer()) {
                let inputObj = JSON.parse(file.contents.toString());
                let mappedArray;
                let resultArray = [];
                if (inputObj instanceof Array) {
                    // handle each line of an array as its own object, to be transformed individually
                    inputObj.forEach(element => {
                        mappedArray = transformer(element, configObj);
                        resultArray.push(tapRecord(mappedArray, streamName));
                    });
                }
                else {
                    mappedArray = transformer(inputObj, configObj);
                    resultArray.push(tapRecord(mappedArray, streamName));
                }
                let data = resultArray.join('\n');
                file.contents = Buffer.from(data);
                file.path = replaceExt(file.path, '.ndjson');
                return cb(returnErr, file);
            }
        }
        catch (err) {
            this.emit('error', new PluginError(PLUGIN_NAME, err));
        }
    });
    return strm;
}
exports.tapJson = tapJson;
//# sourceMappingURL=plugin.js.map