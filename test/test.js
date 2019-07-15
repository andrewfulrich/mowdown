const test = require('tape');
const {mowDown} = require('../index')
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