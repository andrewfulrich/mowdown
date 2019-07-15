const test = require('tape');
const mowDown = require('../index')
const fs = require('fs')
const path = require('path')
const rimraf =require('rimraf')

test('end to end test', t=> {
    t.plan(12)
    const outputFolder='./test/output'
    const expectedFolder='./test/expected'
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
    const expectedFolder='./test/expected'
    try {
      rimraf.sync(outputFolder)
    } catch(e) {
      //output dir DNE
    }
    fs.mkdirSync(outputFolder)

    mowDown(['./test/input/views/stuff.html','./test/input/views/thisToo.html'],outputFolder,'./test/input/public')
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