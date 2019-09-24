const test = require('tape');
const compileJs = require('../compileJS')
const fs=require('fs')

const basePath='test/input/public'

test('sortPaths',t=>{
  t.plan(1)
  const htmlString=fs.readFileSync('test/input/views/stuff.html','utf8')
  const expectedOrder=[
    {uri:'https://cdn.jsdelivr.net/npm/vue@2.6.10/dist/vue.js',isLocal:false},
    {uri:'hn1.js',isLocal:true},
    {uri:'hn2.js',isLocal:true},
    {uri:'scripts/hn.js',isLocal:true},
    {code:`console.log('inline in body')`,isLocal:true},
    {uri:'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.9.1/underscore-min.js',isLocal:false},
    {uri:'/hn3.js',isLocal:true}
  ];
  
  const actual=compileJs.sortPaths(htmlString,basePath)
  t.deepEqual(actual,expectedOrder,'source paths and code should be ordered correctly')
})

test('getPaths',t=>{
  t.plan(1)
  const htmlString=fs.readFileSync('test/input/views/stuff.html','utf8')
  const expectedOrder=[
    {uri:'https://cdn.jsdelivr.net/npm/regenerator-runtime@0.13.3/runtime.min.js',isLocal:false},
    {uri:'https://cdn.jsdelivr.net/npm/vue@2.6.10/dist/vue.js',isLocal:false},
    {uri:'hn1.js',isLocal:true},
    {uri:'hn2.js',isLocal:true},
    {uri:'scripts/hn.js',isLocal:true},
    {code:`console.log('inline in body')`,isLocal:true},
    {uri:'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.9.1/underscore-min.js',isLocal:false},
    {uri:'/hn3.js',isLocal:true}
  ];
  
  const actual=compileJs.getPaths(htmlString,basePath,{replaceJs:{},excludeJs:[],prependJsUrls:[]})
  t.deepEqual(actual,expectedOrder,'basic usage of getPaths should return expected array of path objects')
})

test('getPaths with prependJsUrls enties',t=>{
  t.plan(1)
  const htmlString=fs.readFileSync('test/input/views/stuff.html','utf8')
  const prependUrl='www.example.com'
  const expectedOrder=[
    {uri:prependUrl,isLocal:false},
    {uri:'https://cdn.jsdelivr.net/npm/regenerator-runtime@0.13.3/runtime.min.js',isLocal:false},
    {uri:'https://cdn.jsdelivr.net/npm/vue@2.6.10/dist/vue.js',isLocal:false},
    {uri:'hn1.js',isLocal:true},
    {uri:'hn2.js',isLocal:true},
    {uri:'scripts/hn.js',isLocal:true},
    {code:`console.log('inline in body')`,isLocal:true},
    {uri:'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.9.1/underscore-min.js',isLocal:false},
    {uri:'/hn3.js',isLocal:true}
  ];
  
  const actual=compileJs.getPaths(htmlString,basePath,{replaceJs:{},excludeJs:[],prependJsUrls:[prependUrl]})
  t.deepEqual(actual,expectedOrder,'getPaths should return array of path objects with prepended URL')
})

test('getPaths with excludeJs enties',t=>{
  t.plan(1)
  const htmlString=fs.readFileSync('test/input/views/stuff.html','utf8')
  const excludeUrl='https://cdn.jsdelivr.net/npm/vue@2.6.10/dist/vue.js'
  const expectedOrder=[
    {uri:'https://cdn.jsdelivr.net/npm/regenerator-runtime@0.13.3/runtime.min.js',isLocal:false},
    {uri:'hn1.js',isLocal:true},
    {uri:'hn2.js',isLocal:true},
    {uri:'scripts/hn.js',isLocal:true},
    {code:`console.log('inline in body')`,isLocal:true},
    {uri:'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.9.1/underscore-min.js',isLocal:false},
    {uri:'/hn3.js',isLocal:true}
  ];
  
  const actual=compileJs.getPaths(htmlString,basePath,{replaceJs:{},excludeJs:[excludeUrl],prependJsUrls:[]})
  t.deepEqual(actual,expectedOrder,'getPaths should return array of path objects without excluded URL')
})

test('getPaths with replaceJs enties',t=>{
  t.plan(1)
  const htmlString=fs.readFileSync('test/input/views/stuff.html','utf8')
  const replacement='www.example.com'
  const replaceJs={'https://cdn.jsdelivr.net/npm/vue@2.6.10/dist/vue.js':replacement}
  const expectedOrder=[
    {uri:'https://cdn.jsdelivr.net/npm/regenerator-runtime@0.13.3/runtime.min.js',isLocal:false},
    {uri:replacement,isLocal:false},
    {uri:'hn1.js',isLocal:true},
    {uri:'hn2.js',isLocal:true},
    {uri:'scripts/hn.js',isLocal:true},
    {code:`console.log('inline in body')`,isLocal:true},
    {uri:'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.9.1/underscore-min.js',isLocal:false},
    {uri:'/hn3.js',isLocal:true}
  ];
  
  const actual=compileJs.getPaths(htmlString,basePath,{replaceJs,excludeJs:[],prependJsUrls:[]})
  t.deepEqual(actual,expectedOrder,'getPaths should return array of path objects with replaced URL')
})

test('replaceInArray',t=>{
  t.plan(1)
  const startingArray=[
    {uri:'asdf',isLocal:false},
    {code:'fdsa'},
    {uri:'f',isLocal:false},
    {uri:'d',isLocal:true},
    {uri:'s',isLocal:true},
    {uri:'a',isLocal:false}]
  const replacements={
    asdf:'qwer',
    d:'t',
    a:'y'
  }
  const actual=compileJs.replaceInArray(startingArray,replacements)
  const expected=[
    {uri:'qwer',isLocal:false},
    {code:'fdsa'},
    {uri:'f',isLocal:false},
    {uri:'t',isLocal:false},
    {uri:'s',isLocal:true},
    {uri:'y',isLocal:false}]
  t.deepEqual(actual,expected,'should replace the elements in the array with their replacements')
})

test('getCodeFromPaths',t=>{
  t.plan(1)
  const paths=[
    {uri:'https://cdn.jsdelivr.net/npm/microplugin@0.0.3/src/microplugin.min.js',isLocal:false},
    {uri:'hn1.js',isLocal:true},
    {code:`console.log('inline in body')`}
  ]
  const hn1JsCode=fs.readFileSync('test/input/public/hn1.js','utf8')
  try {
    const actual=compileJs.getCodeFromPaths(paths,basePath)
    const expected=['',hn1JsCode,paths[2].code]
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
