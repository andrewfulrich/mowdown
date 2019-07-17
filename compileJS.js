const Babel=require('@babel/standalone')
const preset=require('@babel/preset-env')

Babel.registerPreset('@babel/preset-env',preset)
Babel.registerPlugin('@babel/plugin-transform-runtime',require('@babel/plugin-transform-runtime'))

const Terser = require("terser");
const fs=require('fs')
const path = require('path');
const cheerio = require('cheerio')

/**
 * 
 * @param string htmlFilePath 
 * @param string destinationFolder 
 * @param object options: sourceFolder, isUsingBabel, excludeJs, prependJsUrls
 */
function compileJS(htmlFilePath,destinationFolder,options) {
  if (!fs.existsSync(destinationFolder)){
    fs.mkdirSync(destinationFolder);
  }
  const basePath=options.sourceFolder || path.dirname(htmlFilePath)
  const baseName=path.basename(htmlFilePath).replace(/\.html*/,'')
  const htmlString=fs.readFileSync(htmlFilePath,'utf8')

  var $ = cheerio.load(htmlString)
  //sort the tags (put deferred in order at the bottom)
  //extract the code from the ones whose code can be extracted (assume the rest are cdn scripts, collect them in order)
  //take out all script tags from the html
  //put the cdn scripts in order at the top
  //concat the code in order, babel-ify it, minify it, and include it at the bottom
  function isExcluded(el) {
    return  options.excludeJs.includes($(el).attr('src'))
  }

  //sort the tags (put deferred in order at the bottom)
  const deferredLocalOrInline=$('script[defer]').filter((index,el)=>isLocalOrInline(el,$,basePath) && !isExcluded(el))
  const deferredNotLocal=$('script[defer]').filter((index,el)=>!isLocalOrInline(el,$,basePath) && !isExcluded(el))
  const localOrInlineNotDeferred=$('script:not([defer])').filter((index,el)=>isLocalOrInline(el,$,basePath) && !isExcluded(el)) //these ones we can get code from
  const notDeferredNotLocal=$('script:not([defer])[src]').filter((index,el)=>!isLocal(el,$,basePath) && !isExcluded(el)) //these are likely from a cdn, so put them at the top
  const concatenatedScripts=[]
  $('script[src]').each((index,el)=>{
    if(!isExcluded(el)) {
      concatenatedScripts.push(stripPrecedingSlash($(el).attr('src')))
    }
  })
  //concat, babel-ify, minify local or inline code:
  const notDeferredCode=processCode(localOrInlineNotDeferred,$,basePath,options.isUsingBabel)
  const deferredCode=processCode(deferredLocalOrInline,$,basePath,options.isUsingBabel)

  $('script').remove()

  //order of insertion: prependJsUrls, notDeferredNotLocal,localOrInlineNotDeferred,deferredNotLocal,deferredLocalOrInline
  options.prependJsUrls.forEach(url=>{
    $('head').append(`<script src="${url}"></script>`)
  })
  if(notDeferredNotLocal.length > 0) {
    notDeferredNotLocal.each((index,el)=>{
      $('head').append(`<script src="${$(el).attr('src')}"></script>`)
    })
  }
  if(notDeferredCode.length > 0) {
    fs.writeFileSync(path.join(destinationFolder,`bundle-${baseName}.js`),notDeferredCode)
    $('head').append(`<script src="/bundle-${baseName}.js"></script>`)
  }
  if(deferredNotLocal.length > 0) {
    deferredNotLocal.each((index,el)=>{
      $('head').append(`<script defer src="${$(el).attr('src')}"></script>`)
    })
  }
  if(deferredCode.length > 0) {
    fs.writeFileSync(path.join(destinationFolder,`bundle-deferred-${baseName}.js`),deferredCode)
    $('head').append(`<script defer src="/bundle-deferred-${baseName}.js"></script>`)
  }

  return {html: $.html(),scripts:concatenatedScripts}
}

function stripPrecedingSlash(path) {
  return path[0] == '/' ? path.substring(1) : path;
}

function isLocal(el,$,basePath) {
  return fs.existsSync(path.join(basePath,stripPrecedingSlash($(el).attr('src'))))
}
function isLocalOrInline(el,$,basePath) {
  return $(el).attr('src') === undefined || isLocal(el,$,basePath)
}
function getCode(el,$,basePath) {
  if($(el).attr('src') !== undefined) {
    return fs.readFileSync(path.join(basePath,stripPrecedingSlash($(el).attr('src'))))
  }
  return $(el).html()
}
function processCode(elements,$,basePath,isUsingBabel) {
  const scripts=[]
  elements.each((index,el)=>scripts.push(getCode(el,$,basePath)))
  const code=isUsingBabel ?
    Babel.transform(
      scripts.join('\n\n'), {presets: ["@babel/preset-env"],plugins:['@babel/plugin-transform-runtime']}
    ).code
    :
    scripts.join('\n\n');
  return Terser.minify(
    code
  ).code
}
//todo: adds empty js files if no js file(s) are included in the html file
module.exports={
  compileJS
}