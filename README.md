# gulp-etl-transform-json #

This plugin transforms JSON as part of **gulp-etl**. Since JSON is a core part of the **gulp-etl** ecosystem, working with JSON is a pivotal task and this plugin is an important one with lots of capabilities and options.

This is a **[gulp-etl](https://gulpetl.com/)** plugin, and as such it is a [gulp](https://gulpjs.com/) plugin. **gulp-etl** plugins work with [ndjson](http://ndjson.org/) data streams/files which we call **Message Streams** and which are compliant with the [Singer specification](https://github.com/singer-io/getting-started/blob/master/docs/SPEC.md#output). In the **gulp-etl** ecosystem, **taps** tap into an outside format or system (in this case, a JSON file) and convert their contents/output to a Message Stream, and **targets** convert/output Message Streams to an outside format or system. In this way, these modules can be stacked to convert from one format or system to another, either directly or with transformations or other parsing in between. Message Streams look like this:

```
{"type": "SCHEMA", "stream": "users", "key_properties": ["id"], "schema": {"required": ["id"], "type": "object", "properties": {"id": {"type": "integer"}}}}
{"type": "RECORD", "stream": "users", "record": {"id": 1, "name": "Chris"}}
{"type": "RECORD", "stream": "users", "record": {"id": 2, "name": "Mike"}}
{"type": "SCHEMA", "stream": "locations", "key_properties": ["id"], "schema": {"required": ["id"], "type": "object", "properties": {"id": {"type": "integer"}}}}
{"type": "RECORD", "stream": "locations", "record": {"id": 1, "name": "Philadelphia"}}
{"type": "STATE", "value": {"users": 2, "locations": 1}}
```

### Usage
**gulp-etl** plugins accept a configObj as the first parameter; it will contain any info the plugin needs. configObj properties:
- ``map = {} ``: acts as a "recipe" for creating new object/array using an inputObj as the source
- ``changeMap : boolean = true`` if true (default), map will change the incoming object; if false, the result of the map operation will replace the incoming object
  
#### Example:

##### Message Stream:
```
{"type": "RECORD", "stream": "users", "record": {"id": 1, "name": "Chris", "lastName": "Smith"}}
{"type": "RECORD", "stream": "users", "record": {"id": 2, "name": "Mike", "lastName": "Brown"}}
```

The map applies to the **record** object on each line, so a map of ``{"Full Name": "{{lastName}}, {{name}}"}`` would result in JSON like the following:
```
[
  {"Full Name": "Smith, Chris"},
  {"Full Name": "Brown, Mike"}
]
```
### Modes

This plugin has the functionality of **tap-json**, **target-json** and **transform-json**. 

**Transform-json** takes in two JSON format/file, one is a source JSON and another is template/map JSON. The template/map JSON describes the rules of how you want your JSON to be formatted. The plugin takes a source JSON and then converts to a different JSON using "**qewd-transfrom-json**". For more info check this link "https://www.npmjs.com/package/qewd-transform-json". 

**Tap-json** takes in two JSON format/file, one is a source JSON and another is template/map JSON. Both the files are passed to **transform-json** which gives us mapped JSON file. This JSON file is then converted to a message stream(**ndjson**) in **tap-json**. 

**Target-json** takes in ndjson format/file as a source file and another template/map JSON. The plugin converts ndjson to json before passing the files to **transform-json**. Finally, we get mapped JSON from **transform-json.** 

### Details
The JSON format files can be of different content, they may be just an object, instance of array containing object, or array of objects.
The transformation specifically looks into four different cases the user might run into. These cases are described below: (although **target-json** takes in .ndjson as source it is transformed to JSON before passing to transformer)

1. The source JSON contains only one object and the template/map JSON also contains one object.
   ![](./images/Untitled%20Diagram.png)
2. The source JSON contains only one object but the template/map JSON contains array of object.
   ![](./images/Untitled%20Diagram%20(6).png)
3. The source JSON is an array of object and template/map JSON is also an array of object. The "**qewd-transform-stream**" takes only objects. Therefore, when the input object is in the form of array of objects it is wrapped around **rootarray object**. For eg: **rootarray{ [ { },{ },... ] }** 
   ![](./images/Untitled%20Diagram%20(7).png)
4. The source JSON is an array of object but template/map JSON contains one object. The "**qewd-transform-stream**" takes only objects. Therefore, when the input object is in the form of array of objects it is wrapped around **rootarray object**. For eg: **rootarray{ [ { },{ },... ] }** 
   ![](./images/Untitled%20Diagram%20(8).png)





##### Sample gulpfile.js
```
// tap-json maps all .JSON files in a folder into Message Stream files in a different folder 
// transform-json maps all .ndjson files in a folder into JSON files in a different folder 
// tap-json maps all .JSON files in a folder into JSON files in a different folder 

let gulp = require('gulp')
var rename = require('gulp-rename')
var tapJson = require('gulp-etl-transform-json').tapJson //change .tapJson to .targetJson to use target-json and .transformJson to use transform-json
var maps = require('../testdata/maps/map-oneobject.json');//make sure you are using right map

var mergeOriginal = false;//if you want your final object as an original object but with only the differences change to 'true'

function runTapJson(callback: any) {
  log.info('gulp task starting for ' + PLUGIN_NAME)

  return gulp.src('../testdata/tests/test-oneobject.json',{buffer: true}) //change the source fromat to .ndjson for target-json
    .pipe(errorHandler(function(err:any) {
      log.error('Error: ' + err)
      callback(err)
    }))
    .on('data', function (file:Vinyl) {
      log.info('Starting processing on ' + file.basename)
    })    
    .pipe(tapJson(map:maps, changeMap:mergeOriginal))
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
```
### Quick Start for Coding on This Plugin
* Dependencies: 
    * [git](https://git-scm.com/downloads)
    * [nodejs](https://nodejs.org/en/download/releases/) - At least v6.3 (6.9 for Windows) required for TypeScript debugging
    * npm (installs with Node)
    * typescript - installed as a development dependency
* Clone this repo and run `npm install` to install npm packages
* Debug: with [VScode](https://code.visualstudio.com/download) use `Open Folder` to open the project folder, then hit F5 to debug. This runs without compiling to javascript using [ts-node](https://www.npmjs.com/package/ts-node)
* Test: `npm test` or `npm t`
* Compile to javascript: `npm run build`

### Testing

We are using [Jest](https://facebook.github.io/jest/docs/en/getting-started.html) for our testing. Each of our tests are in the `test` folder.

- Run `npm test` to run the test suites



Note: This document is written in [Markdown](https://daringfireball.net/projects/markdown/). We like to use [Typora](https://typora.io/) and [Markdown Preview Plus](https://chrome.google.com/webstore/detail/markdown-preview-plus/febilkbfcbhebfnokafefeacimjdckgl?hl=en-US) for our Markdown work..
