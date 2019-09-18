const test = require('tape');
const compileJS = require('../compileJS')
const fs=require('fs')


const basePath='test/input/public'
test('sortPaths',t=>{
  t.plan(1)
  const htmlString=fs.readFileSync('test/input/views/stuff.html','utf8')
  const expectedOrder=[
    'https://cdn.jsdelivr.net/npm/vue@2.6.10/dist/vue.js',
    'hn1.js',
    'hn2.js',
    'scripts/hn.js',
    '///0',
    'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.9.1/underscore-min.js',
    '/hn3.js'
  ];
  const expectedInlineCode=[`console.log('inline in body')`]
  
  const actual=compileJS.sortPaths(htmlString,basePath)
  t.deepEqual(actual,{
    paths:expectedOrder,
    inlineCode:expectedInlineCode,
    nonLocalPaths:[expectedOrder[0],expectedOrder[5]]
  },'source paths and code should be ordered correctly')
})

test('getCodeFromPaths',async t=>{
  t.plan(1)
  const paths=[
    'https://cdn.jsdelivr.net/npm/microplugin@0.0.3/src/microplugin.min.js',
    'hn1.js',
    '///0'
  ]
  const inlineCode=[`console.log('inline in body')`]
  const micropluginCode=fs.readFileSync('test/expected/microplugin.min.js','utf8')
  const hn1JSCode=fs.readFileSync('test/input/public/hn1.js','utf8')
  try {
    const actual=await compileJS.getCodeFromPaths(paths,inlineCode,basePath)
    const expected=[micropluginCode,hn1JSCode,inlineCode[0]]
    t.deepEqual(actual,expected,'should retrieve code in order specified, and should be able to do it for remote, local, and inline code')
  } catch(e) {
    t.fail(e.stack)
  }
})

test('concatAndTransform',async t=>{
  t.plan(1)

  const inlineCode=`console.log("inline in body")`
  const micropluginCode=fs.readFileSync('test/expected/microplugin.min.js','utf8')
  const hn1JSCode=fs.readFileSync('test/input/public/hn1.js','utf8').replace(/'/g,'"')
  const codeArray=[micropluginCode,hn1JSCode,inlineCode]
  try {
    const actual=await compileJS.concatAndTransform(codeArray)
    // fs.writeFileSync('test/expected/microplugin-transformed.min.js',actual.code)
    const transformedMicro=fs.readFileSync('test/expected/microplugin-transformed.min.js','utf8')
    const expected=[transformedMicro,hn1JSCode+';',inlineCode+';'].join('')
    t.equal(actual.code,expected,'should have concatenated and babel-transformed code')
  } catch(e) {
    console.log(e)
    t.fail(e.stack)
  }
})

test('replaceCodeInHtml',t=>{
  t.plan(2)

  const code="console.log('The party in the first part...');"
  const inputHtml=fs.readFileSync('test/input/views/stuff.html','utf8')
  const actual=compileJS.replaceCodeInHtml(inputHtml,code,'test/output','replaceCodeInHtml')
  // fs.writeFileSync('test/expected/replaceCodeInHtml.html',actual)
  const expected=fs.readFileSync('test/expected/replaceCodeInHtml.html','utf8')
  const expectedJS=fs.readFileSync('test/expected/replaceCodeInHtml-bundle.js','utf8')
  const actualJS=fs.readFileSync('test/output/replaceCodeInHtml-bundle.js','utf8')
  t.equal(actual,expected,'html should be the same except all scripts are taken out and bundle is put in')
  t.equal(actualJS,expectedJS,'js bundle should look as expected')
})

test('markCodeSegments',t=>{
  t.plan(1)

  const codeArray=['console.log("hi");','alert("foo");','fail("darn!");']
  const actual=compileJS.markCodeSegments(codeArray,[0,2])
  const expected=[
    `/**********EXTRACT SEGMENT**********/
    console.log("hi");
    /**********END EXTRACT SEGMENT**********/`,
    'alert("foo");',
    `/**********EXTRACT SEGMENT**********/
    fail("darn!");
    /**********END EXTRACT SEGMENT**********/`]
  t.deepEqual(actual,expected,'only the code at the given indices should be marked')
})

test('deleteCodeSegments',t=>{
  t.plan(1)

  const code=`/**********EXTRACT SEGMENT**********/
  console.log("hi");
  /**********END EXTRACT SEGMENT**********/
  alert("foo");
  /**********EXTRACT SEGMENT**********/
  fail("darn!");
  /**********END EXTRACT SEGMENT**********/`
  const actual=compileJS.deleteCodeSegments(code)
  const expected='alert("foo");'
  t.equal(actual,expected,'should have deleted the code segments from the string')
})
//known issue: axios can't seem to get things from cdnjs (getting ENOTFOUND error). As a workaround, convert your cdnjs urls to jsdeliver
//split out downloaded code from babel output and convert it back to url
//spit html back out to the view folder if specified
//get rid of babel warning

//make all return object contain next function for easy chaining?