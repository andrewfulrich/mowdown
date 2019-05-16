const Babel=require('@babel/standalone')

const Terser = require("terser");
const fs=require('fs')
const path = require('path');
const cheerio = require('cheerio')


function compileJS(htmlFilePath,destinationFolder) {
  if (!fs.existsSync(destinationFolder)){
    fs.mkdirSync(destinationFolder);
  }
  const basePath=path.dirname(htmlFilePath)
  const htmlString=fs.readFileSync(htmlFilePath,'utf8')

  var $ = cheerio.load(htmlString)
  //sort the tags (put deferred in order at the bottom)
  //extract the code from the ones whose code can be extracted (assume the rest are cdn scripts, collect them in order)
  //take out all script tags from the html
  //put the cdn scripts in order at the top
  //concat the code in order, babel-ify it, minify it, and include it at the bottom

  //sort the tags (put deferred in order at the bottom)

  const deferredLocalOrInline=$('script[defer]').filter((index,el)=>isLocalOrInline(el,$,basePath))
  const deferredNotLocal=$('script[defer]').filter((index,el)=>!isLocalOrInline(el,$,basePath))
  const localOrInlineNotDeferred=$('script:not([defer])').filter((index,el)=>isLocalOrInline(el,$,basePath)) //these ones we can get code from
  const notDeferredNotLocal=$('script:not([defer])[src]').filter((index,el)=>!isLocal(el,$,basePath)) //these are likely from a cdn, so put them at the top
  const concatenatedScripts=[]
  $('script[src]').each((index,el)=>concatenatedScripts.push($(el).attr('src')))
  //concat, babel-ify, minify local or inline code:
  const notDeferredCode=processCode(localOrInlineNotDeferred,$,basePath)
  const deferredCode=processCode(deferredLocalOrInline,$,basePath)

  $('script').remove()

  //order of insertion: notDeferredNotLocal,localOrInlineNotDeferred,deferredNotLocal,deferredLocalOrInline
  if(notDeferredNotLocal.length > 0) {
    notDeferredNotLocal.each((index,el)=>{
      $('head').append(`<script src="${$(el).attr('src')}"></script>`)
    })
  }
  if(notDeferredCode.length > 0) {
    fs.writeFileSync(path.join(destinationFolder,'bundle.js'),notDeferredCode)
    $('head').append(`<script src="bundle.js"></script>`)
  }
  if(deferredNotLocal.length > 0) {
    deferredNotLocal.each((index,el)=>{
      $('head').append(`<script defer src="${$(el).attr('src')}"></script>`)
    })
  }
  if(deferredCode.length > 0) {
    fs.writeFileSync(path.join(destinationFolder,'bundle-deferred.js'),deferredCode)
    $('head').append(`<script defer src="bundle-deferred.js"></script>`)
  }

  return {html: $.html(),scripts:concatenatedScripts}
}


function isLocal(el,$,basePath) {
  return fs.existsSync(path.join(basePath,$(el).attr('src')))
}
function isLocalOrInline(el,$,basePath) {
  return $(el).attr('src') === undefined || isLocal(el,$,basePath)
}
function getCode(el,$,basePath) {
  if($(el).attr('src') !== undefined) {
    return fs.readFileSync(path.join(basePath,$(el).attr('src')))
  }
  return $(el).html()
}
function processCode(elements,$,basePath) {
  const scripts=[]
  elements.each((index,el)=>scripts.push(getCode(el,$,basePath)))

  return Terser.minify(
    Babel.transform(
      scripts.join('\n\n'), {presets: ['es2015','es2016','es2017']}
    ).code
  ).code
}

module.exports={
  compileJS
}