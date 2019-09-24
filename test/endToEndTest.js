const test = require('tape');
const mowDown = require('../index')
const fs = require('fs')
const path = require('path')
const rimraf =require('rimraf')

test('end to end test', t=> {
    t.plan(10)
    const outputFolder='./test/output'
    const expectedFolder='./test/expected/end2end'
    try {
      rimraf.sync(outputFolder)
    } catch(e) {
      //output dir DNE
    }
    fs.mkdirSync(outputFolder)
    const files=['./test/input/public/stuff.html','./test/input/public/thisToo.html']
    const file1Contents=fs.readFileSync(files[0],'utf8')
    const file2Contents=fs.readFileSync(files[1],'utf8')
    function resetFiles() {
      fs.writeFileSync(files[0],file1Contents)
      fs.writeFileSync(files[1],file2Contents)
    }

    mowDown(files,outputFolder)
      .then(()=>{
        const filesInOutput=fs.readdirSync(outputFolder)
        const htmlFiles=files.map(f=>path.basename(f))
        const expectedFiles=fs.readdirSync(expectedFolder).filter(filename=>!htmlFiles.includes(filename))
        
        t.deepEqual(filesInOutput,expectedFiles,'output files are all present')
        t.deepEqual(
          fs.readdirSync(path.join(outputFolder,'scripts')),
          fs.readdirSync(path.join(expectedFolder,'scripts')),
          'output files in subfolder are all present')
        function getFileContents(dir,file) {
          return fs.readFileSync(path.join(dir,file),'utf8')
        }
        const expectedHtmlString1=fs.readFileSync(files[0].replace('input/public','expected/end2end'),'utf8')
        const actualHtmlString1=fs.readFileSync(files[0],'utf8')
        const expectedHtmlString2=fs.readFileSync(files[1].replace('input/public','expected/end2end'),'utf8')
        const actualHtmlString2=fs.readFileSync(files[1],'utf8')
        t.equal(actualHtmlString1,expectedHtmlString1,'first html file should match expected')
        t.equal(actualHtmlString2,expectedHtmlString2,'second html file should match expected')
        const fileContents=filesInOutput
          .filter(filename=>!fs.lstatSync(path.join(outputFolder,filename)).isDirectory())
          .map(filename=>getFileContents(outputFolder,filename))
        const expectedContents=expectedFiles
          .filter(filename=>!fs.lstatSync(path.join(expectedFolder,filename)).isDirectory())
          .map(filename=>getFileContents(expectedFolder,filename))
        fileContents.forEach((contents,index)=>{
          t.equal(contents,expectedContents[index],`file contents of ${expectedFiles[index]} should equal expected contents`)
        })

        resetFiles()
      }).catch(e=>{
        resetFiles()
        console.log(e)
        t.fail(e)
      })
});

test('end to end test with sourceFolder different from html paths',t=> {
  t.plan(10)
    const outputFolder='./test/output'
    const expectedFolder='./test/expected/end2end'
    try {
      rimraf.sync(outputFolder)
    } catch(e) {
      //output dir DNE
    }
    fs.mkdirSync(outputFolder)

    const files=['./test/input/views/stuff.html','./test/input/views/thisToo.html']
    const file1Contents=fs.readFileSync(files[0],'utf8')
    const file2Contents=fs.readFileSync(files[1],'utf8')
    function resetFiles() {
      fs.writeFileSync(files[0],file1Contents)
      fs.writeFileSync(files[1],file2Contents)
    }

    mowDown(files,outputFolder,{sourceFolder:'./test/input/public'})
      .then(()=>{
        const filesInOutput=fs.readdirSync(outputFolder)
        
        const htmlFiles=files.map(f=>path.basename(f))
        const expectedFiles=fs.readdirSync(expectedFolder).filter(filename=>!htmlFiles.includes(filename))
        
        t.deepEqual(filesInOutput,expectedFiles,'output files are all present')
        t.deepEqual(
          fs.readdirSync(path.join(outputFolder,'scripts')),
          fs.readdirSync(path.join(expectedFolder,'scripts')),
          'output files in subfolder are all present')
        
        const expectedHtmlString1=fs.readFileSync(files[0].replace('input/public','expected/end2end'),'utf8')
        const actualHtmlString1=fs.readFileSync(files[0],'utf8')
        const expectedHtmlString2=fs.readFileSync(files[1].replace('input/public','expected/end2end'),'utf8')
        const actualHtmlString2=fs.readFileSync(files[1],'utf8')
        t.equal(actualHtmlString1,expectedHtmlString1,'first html file should match expected')
        t.equal(actualHtmlString2,expectedHtmlString2,'second html file should match expected')
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

        resetFiles()
      }).catch(e=>{
        resetFiles()
        console.log(e)
        t.fail(e)
      })
})

test('end to end test with prepended urls',t=> {
  t.plan(10)
    const outputFolder='./test/output'
    const expectedFolder='./test/expected/end2end'
    try {
      rimraf.sync(outputFolder)
    } catch(e) {
      //output dir DNE
    }
    fs.mkdirSync(outputFolder)

    const files=['./test/input/views/stuff.html','./test/input/views/thisToo.html']
    const file1Contents=fs.readFileSync(files[0],'utf8')
    const file2Contents=fs.readFileSync(files[1],'utf8')
    function resetFiles() {
      fs.writeFileSync(files[0],file1Contents)
      fs.writeFileSync(files[1],file2Contents)
    }

    mowDown(files,outputFolder,{sourceFolder:'./test/input/public',prependJsUrls:['www.example.com']})
      .then(()=>{
        const filesInOutput=fs.readdirSync(outputFolder)
        
        const htmlFiles=files.map(f=>path.basename(f))
        const expectedFiles=fs.readdirSync(expectedFolder).filter(filename=>!htmlFiles.includes(filename))
        
        t.deepEqual(filesInOutput,expectedFiles,'output files are all present')
        t.deepEqual(
          fs.readdirSync(path.join(outputFolder,'scripts')),
          fs.readdirSync(path.join(expectedFolder,'scripts')),
          'output files in subfolder are all present')
        
        const expectedHtmlString1=fs.readFileSync(files[0].replace('input/public','expected/end2end'),'utf8')
        const actualHtmlString1=fs.readFileSync(files[0],'utf8')
        const expectedHtmlString2=fs.readFileSync(files[1].replace('input/public','expected/end2end'),'utf8')
        const actualHtmlString2=fs.readFileSync(files[1],'utf8')
        t.equal(actualHtmlString1,expectedHtmlString1,'first html file should match expected')
        t.equal(actualHtmlString2,expectedHtmlString2,'second html file should match expected')
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

        resetFiles()
      }).catch(e=>{
        resetFiles()
        console.log(e)
        t.fail(e)
      })
})