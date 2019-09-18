const test = require('tape');
const compileJs = require('../compileJS')
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
  
  const actual=compileJs.sortPaths(htmlString,basePath)
  t.deepEqual(actual,{
    paths:expectedOrder,
    inlineCode:expectedInlineCode,
    nonLocalPaths:[expectedOrder[0],expectedOrder[5]]
  },'source paths and code should be ordered correctly')
})

test('replaceInArray',t=>{
  t.plan(1)
  const startingArray=['asdf','fdsa','f','d','s','a']
  const replacements={
    asdf:'qwer',
    d:'t',
    a:'y'
  }
  const actual=compileJs.replaceInArray(startingArray,replacements)
  const expected=['qwer','fdsa','f','t','s','y']
  t.deepEqual(actual,expected,'should replace the elements in the array with their replacements')
})

test('getCodeFromPaths',t=>{
  t.plan(1)
  const paths=[
    'https://cdn.jsdelivr.net/npm/microplugin@0.0.3/src/microplugin.min.js',
    'hn1.js',
    '///0'
  ]
  const inlineCode=[`console.log('inline in body')`]
  const hn1JsCode=fs.readFileSync('test/input/public/hn1.js','utf8')
  try {
    const actual=compileJs.getCodeFromPaths(paths,inlineCode,basePath)
    const expected=['',hn1JsCode,inlineCode[0]]
    t.deepEqual(actual,expected,'should retrieve code in order specified, and should be able to do it for remote, local, and inline code')
  } catch(e) {
    t.fail(e.stack)
  }
})

test('concatAndTransform',async t=>{
  t.plan(1)

  const inlineCode=`console.log("inline in body")`
  const micropluginCode=fs.readFileSync('test/expected/microplugin.min.js','utf8')
  const hn1JsCode=fs.readFileSync('test/input/public/hn1.js','utf8').replace(/'/g,'"')
  const codeArray=[micropluginCode,hn1JsCode,inlineCode]
  try {
    const actual=await compileJs.concatAndTransform(codeArray)
    // fs.writeFileSync('test/expected/microplugin-transformed.min.js',actual.code)
    const transformedMicro=fs.readFileSync('test/expected/microplugin-transformed.min.js','utf8')
    const expected=[transformedMicro,hn1JsCode+';',inlineCode+';'].join('')
    t.equal(actual.code,expected,'should have concatenated and babel-transformed code')
  } catch(e) {
    console.log(e)
    t.fail(e.stack)
  }
})

test('replaceCodeInHtml',t=>{
  t.plan(2)

  const code="console.log('The party in the first part...');"
  const nonLocalPaths=['https://www.example.com']
  const inputHtml=fs.readFileSync('test/input/views/stuff.html','utf8')
  const actual=compileJs.replaceCodeInHtml(inputHtml,code,'test/output','replaceCodeInHtml',nonLocalPaths)
  // fs.writeFileSync('test/expected/replaceCodeInHtml.html',actual)
  const expected=fs.readFileSync('test/expected/replaceCodeInHtml.html','utf8')
  const expectedJs=fs.readFileSync('test/expected/replaceCodeInHtml-bundle.js','utf8')
  const actualJs=fs.readFileSync('test/output/replaceCodeInHtml-bundle.js','utf8')
  t.equal(actual,expected,'html should be the same except all scripts are taken out and bundle is put in')
  t.equal(actualJs,expectedJs,'js bundle should look as expected')
})