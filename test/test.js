const test = require('tape');
const mowDown = require('../index')
const fs = require('fs')
const path = require('path')
const rimraf =require('rimraf')

test('end to end test', t=> {
    t.plan(12)
    const outputFolder='./test/output'
    const expectedFolder='./test/expected/end2end'
    try {
      rimraf.sync(outputFolder)
    } catch(e) {
      //output dir DNE
    }
    fs.mkdirSync(outputFolder)

    mowDown(['./test/input/public/stuff.html','./test/input/public/thisToo.html'],outputFolder)
      .then(()=>{
        const filesInOutput=fs.readdirSync(outputFolder)
        const expectedFiles=fs.readdirSync(expectedFolder)
        
        t.deepEqual(filesInOutput,expectedFiles,'output files are all present')
        t.deepEqual(
          fs.readdirSync(path.join(outputFolder,'scripts')),
          fs.readdirSync(path.join(expectedFolder,'scripts')),
          'output files in subfolder are all present')
        function getFileContents(dir,file) {
          return fs.readFileSync(path.join(dir,file),'utf8')
        }
        const fileContents=filesInOutput
          .filter(filename=>!fs.lstatSync(path.join(outputFolder,filename)).isDirectory())
          .map(filename=>getFileContents(outputFolder,filename))
        const expectedContents=expectedFiles
          .filter(filename=>!fs.lstatSync(path.join(expectedFolder,filename)).isDirectory())
          .map(filename=>getFileContents(expectedFolder,filename))
        fileContents.forEach((contents,index)=>{
          t.equal(contents,expectedContents[index],`file contents of ${expectedFiles[index]} should equal expected contents`)
        })
      }).catch(e=>{
        console.log(e)
        t.fail(e)
      })
});

test('end to end test with sourceFolder different from html paths',t=> {
  t.plan(12)
    const outputFolder='./test/output'
    const expectedFolder='./test/expected/end2end'
    try {
      rimraf.sync(outputFolder)
    } catch(e) {
      //output dir DNE
    }
    fs.mkdirSync(outputFolder)

    mowDown(['./test/input/views/stuff.html','./test/input/views/thisToo.html'],outputFolder,{sourceFolder:'./test/input/public'})
      .then(()=>{
        const filesInOutput=fs.readdirSync(outputFolder)
        const expectedFiles=fs.readdirSync(expectedFolder)
        
        t.deepEqual(filesInOutput,expectedFiles,'output files are all present')
        t.deepEqual(
          fs.readdirSync(path.join(outputFolder,'scripts')),
          fs.readdirSync(path.join(expectedFolder,'scripts')),
          'output files in subfolder are all present')
        function getFileContents(dir,file) {
          return fs.readFileSync(path.join(dir,file),'utf8')
        }
        console.log('getting file contents')
        const fileContents=filesInOutput
          .filter(filename=>!fs.lstatSync(path.join(outputFolder,filename)).isDirectory())
          .map(filename=>getFileContents(outputFolder,filename))
        const expectedContents=expectedFiles
          .filter(filename=>!fs.lstatSync(path.join(expectedFolder,filename)).isDirectory())
          .map(filename=>getFileContents(expectedFolder,filename))
        fileContents.forEach((contents,index)=>{
          t.equal(contents,expectedContents[index],`file contents of ${expectedFiles[index]} should equal expected contents`)
        })
      }).catch(e=>{
        console.log(e)
        t.fail(e)
      })
})


const Babel=require('@babel/standalone')
const preset=require('@babel/preset-env')
Babel.registerPreset('@babel/preset-env',preset)

test('is compiling js to es2015',t=>{
  t.plan(1)
  const script=`
  let baz='dude'
  const foo={bar:\`hi \${baz}!\`,bat:2}
  const ban={...foo,[baz]:'hmm'}
  `
  const output = Babel.transform(
    script, {presets: ["@babel/preset-env"]}
  ).code

    t.equal(`"use strict";
    function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { keys.push.apply(keys, Object.getOwnPropertySymbols(object)); } if (enumerableOnly) keys = keys.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); return keys; }
    function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    var baz = 'dude';
    var foo = {
      bar: "hi ".concat(baz, "!"),
      bat: 2
    };
    var ban = _objectSpread({}, foo, _defineProperty({}, baz, 'hmm'));`.replace(/\s+/g,' '),output.replace(/\s+/g,' '))
})

test('is foregoing babel compilation, excluding files, and prepending urls',t=>{
  t.plan(5)
  const outputFolder='./test/output'
  const expectedFolder='./test/expected/optionTests'
  try {
    rimraf.sync(outputFolder)
  } catch(e) {
    //output dir DNE
  }

  const options={
    isUsingBabel:false,
    excludeJs:['/jsScript2.js'],
    excludeCss:['/cssScript2.css'],
    prependJsUrls:['https://cdn.jsdelivr.net/npm/vue'],
    prependCssUrls:['https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css']
  }
  mowDown(['./test/input/optionTests/index.html'],outputFolder,options)
    .then(()=>{
      const filesInOutput=fs.readdirSync(outputFolder)
      const expectedFiles=fs.readdirSync(expectedFolder)
      t.deepEqual(filesInOutput,expectedFiles,'expected output files are all present and none other')

      const outputJs=fs.readFileSync(outputFolder+'/bundle-index.js','utf8')
      const expectedJs=fs.readFileSync(expectedFolder+'/bundle-index.js','utf8')
      t.equal(outputJs,expectedJs,'output js should be untouched by Babel')

      const outputHtml=fs.readFileSync(outputFolder+'/index.html','utf8')
      const expectedHtml=fs.readFileSync(expectedFolder+'/index.html','utf8')
      t.ok(outputHtml.includes(options.prependJsUrls[0]),'JS url has been inserted')
      t.ok(outputHtml.includes(options.prependCssUrls[0]),'CSS url has been inserted')
      t.equal(outputHtml,expectedHtml,'html produced is in fact as expected, with all scripts in order')
    })
})