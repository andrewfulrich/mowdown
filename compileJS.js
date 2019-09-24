const babelify=require('./babelify')

const Terser = require("terser");
const fs=require('fs')
const path = require('path');
const cheerio = require('cheerio')


/**
 * @param string htmlFilePath 
 * @param string destinationFolder 
 * @param object options: sourceFolder, replaceJs, mangle,excludeJs,prependJsUrls
 */
async function compileJs(htmlFilePath,destinationFolder,options) {
  if (!fs.existsSync(destinationFolder)){
    fs.mkdirSync(destinationFolder);
  }
  const basePath=options.sourceFolder || path.dirname(htmlFilePath)
  const baseName=path.basename(htmlFilePath).replace(/\.html*/,'')
  const htmlString=fs.readFileSync(htmlFilePath,'utf8')

  const paths = getPaths(htmlString,basePath,options)

  const codeFromPaths=getCodeFromPaths(paths,basePath)

  const transformed=await concatAndTransform(codeFromPaths)
  const returnHtml=replaceCodeInHtml(htmlString,transformed.code,destinationFolder,baseName,getAllNonLocals(paths))
  return {
    htmlString:returnHtml,
    paths:paths.filter(p=>p.uri !== undefined).map(p=>p.uri)
  }
}

function getAllNonLocals(pathObjects) {
  return pathObjects.filter(p=>p.isLocal===false).map(p=>p.uri)
}

function getPaths(htmlString,basePath,options) {
  const prependPaths=options.prependJsUrls
    //need to add regenerator runtime script to handle babel-transformed code that contains generators or async/await
    .concat('https://cdn.jsdelivr.net/npm/regenerator-runtime@0.13.3/runtime.min.js')
    .map(uri=>({
    uri,
    isLocal:false
  }))
  const paths=prependPaths
    .concat( sortPaths(htmlString,basePath,options.prependJsUrls))
 
  return replaceInArray(paths,options.replaceJs)
  .filter(path=>!options.excludeJs.includes(path.uri))
}

function replaceInArray(arr,replacements) {
  return arr.map(el=>(!el.code && replacements[el.uri] !== undefined) ? {uri:replacements[el.uri],isLocal:false} : el)
}

/**
 * finds all js within an html string, then sorts the js by execution order, taking into account the "defer" attribute
 * @param String htmlString 
 * @param String basePath - the public directory where the scripts are. Used in determining which scripts are local
 * @returns Array - An array of objects with 3 possible fields: 
 *  - uri - the filepath/url to the file
 *  - code the code if it is inline, undefined if not
*   - isLocal true if it is local, false if not
 */
function sortPaths(htmlString,basePath) {
  var $ = cheerio.load(htmlString)

  //sort the tags (put deferred in order at the bottom)
  const deferredLocalOrInline=$('script[defer]').filter((index,el)=>isLocalOrInline(el,$,basePath))
  const deferredNotLocal=$('script[defer]').filter((index,el)=>!isLocalOrInline(el,$,basePath))
  const localOrInlineNotDeferred=$('script:not([defer])').filter((index,el)=>isLocalOrInline(el,$,basePath)) //these ones we can get code from
  const notDeferredNotLocal=$('script:not([defer])[src]').filter((index,el)=>!isLocal(el,$,basePath)) //these are likely from a cdn, so put them at the top

  const paths=[]

  //order of insertion: notDeferredNotLocal,localOrInlineNotDeferred,deferredNotLocal,deferredLocalOrInline
  if(notDeferredNotLocal.length > 0) {
    notDeferredNotLocal.each((index,el)=>{
      paths.push({
        uri:$(el).attr('src'),
        isLocal:false
      })
    })
  }
  if(localOrInlineNotDeferred.length > 0) {
    localOrInlineNotDeferred.each((index,el)=>{
      if(isInline(el,$)) {
        paths.push({
          code:getInlineCode(el,$),
          isLocal:true
        })
      } else {
        paths.push({
          uri:$(el).attr('src'),
          isLocal:true
        })
      }
    })
  }
  if(deferredNotLocal.length > 0) {
    deferredNotLocal.each((index,el)=>{
      paths.push({
        uri:$(el).attr('src'),
        isLocal:false
      })
    })
  }
  if(deferredLocalOrInline.length > 0) {
    deferredLocalOrInline.each((index,el)=>{
      if(isInline(el,$)) {
        paths.push({
          code:getInlineCode(el,$),
          isLocal:true
        })
      } else {
        paths.push({
          uri:$(el).attr('src'),
          isLocal:true
        })
      }
    })
  }

  return paths
}

function getCodeFromPath(path,basePath) {
  if(path.code) {
    return path.code
  } else if(path.isLocal) {
    return getLocalCode(path.uri,basePath)
  } else {
    return ''
  }
}

function getCodeFromPaths(paths,basePath) {
  try {
    return paths.map(p=>getCodeFromPath(p,basePath))
  } catch(e) {
    throw e
  }
}

function concatAndTransform(codeArray) {
  return babelify(codeArray.join('\n\n'))
}

function replaceCodeInHtml(inputHtml,code,destinationFolder,bundlePrefix,nonLocalPaths) {
  if (!fs.existsSync(destinationFolder)){
    fs.mkdirSync(destinationFolder);
  }
  var $ = cheerio.load(inputHtml)
  $('script').remove()
  const filename=`${bundlePrefix}-bundle.js`
  const filepath=path.join(destinationFolder,filename)
  fs.writeFileSync(filepath,code)
  nonLocalPaths.forEach(path=>$('head').append(`<script src="${path}"></script>`))
  $('head').append(`<script defer src="/${filename}"></script>`)
  return $.html()
}

function isInline(el,$) {
  return $(el).attr('src') === undefined
}

function getInlineCode(el,$) {
  return $(el).html().trim()
}

function stripPrecedingSlash(uri) {
  return uri[0] == '/' ? uri.substring(1) : uri;
}
function isLocalPath(uri,basePath) {
  return fs.existsSync(path.join(basePath,stripPrecedingSlash(uri)))
}
function isLocal(el,$,basePath) {
  return isLocalPath($(el).attr('src'),basePath)
}
function isLocalOrInline(el,$,basePath) {
  return $(el).attr('src') === undefined || isLocal(el,$,basePath)
}
function getLocalCode(uri,basePath) {
  return fs.readFileSync(path.join(basePath,stripPrecedingSlash(uri)),'utf8')
}

//todo: adds empty js files if no js file(s) are included in the html file
module.exports={
  compileJs,
  replaceInArray,
  getPaths,
  sortPaths,
  getCodeFromPaths,
  concatAndTransform,
  replaceCodeInHtml
}