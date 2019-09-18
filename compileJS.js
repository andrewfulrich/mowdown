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

  const {paths,inlineCode,nonLocalPaths}=sortPaths(htmlString,basePath)
  const finalPaths=options.prependJsUrls
    .concat(replaceInArray(paths,options.replaceJs))
    .filter(path=>!options.excludeJs.includes(path))

  const codeFromPaths=await getCodeFromPaths(finalPaths,inlineCode,basePath)
 
  const transformed=concatAndTransform(codeFromPaths)
  const returnHtml=replaceCodeInHtml(htmlString,transformed,destinationFolder,baseName,nonLocalPaths)
  return {
    htmlString:returnHtml,
    paths:finalPaths
  }
}

function replaceInArray(arr,replacements) {
  return arr.map(el=>replacements[el] !== undefined ? replacements[el] : el)
}

/**
 * finds all js within an html string, then sorts the js by execution order, taking into account the "defer" attribute
 * @param String htmlString 
 * @param String basePath - the public directory where the scripts are. Used in determining which scripts are local
 * @returns Object - An object with 3 fields: 
 *  - paths (the ordered script paths, with inline code denoted by /// and then its order among other inline code)
 *  - inlineCode (an array of inline code, in order)
*  - nonLocalPaths (an array of uris which don't point to a local file)
 */
function sortPaths(htmlString,basePath) {
  var $ = cheerio.load(htmlString)

  //sort the tags (put deferred in order at the bottom)
  const deferredLocalOrInline=$('script[defer]').filter((index,el)=>isLocalOrInline(el,$,basePath))
  const deferredNotLocal=$('script[defer]').filter((index,el)=>!isLocalOrInline(el,$,basePath))
  const localOrInlineNotDeferred=$('script:not([defer])').filter((index,el)=>isLocalOrInline(el,$,basePath)) //these ones we can get code from
  const notDeferredNotLocal=$('script:not([defer])[src]').filter((index,el)=>!isLocal(el,$,basePath)) //these are likely from a cdn, so put them at the top

  //order of insertion: notDeferredNotLocal,localOrInlineNotDeferred,deferredNotLocal,deferredLocalOrInline
  const paths=[]
  const inlineCode=[]
  const nonLocalPaths=[]
  //order of insertion: notDeferredNotLocal,localOrInlineNotDeferred,deferredNotLocal,deferredLocalOrInline
  if(notDeferredNotLocal.length > 0) {
    notDeferredNotLocal.each((index,el)=>{
      paths.push($(el).attr('src'))
      nonLocalPaths.push($(el).attr('src'))
    })
  }
  if(localOrInlineNotDeferred.length > 0) {
    localOrInlineNotDeferred.each((index,el)=>{
      if(isInline(el,$)) {
        paths.push( `///${inlineCode.length}`)
        inlineCode.push(getInlineCode(el,$))
      } else {
        paths.push($(el).attr('src'))
      }
    })
  }
  if(deferredNotLocal.length > 0) {
    deferredNotLocal.each((index,el)=>{
      paths.push($(el).attr('src'))
      nonLocalPaths.push($(el).attr('src'))
    })
  }
  if(deferredLocalOrInline.length > 0) {
    deferredLocalOrInline.each((index,el)=>{
      if(isInline(el,$)) {
        paths.push( `///${inlineCode.length}`)
        inlineCode.push(getInlineCode(el,$))
      } else {
        paths.push($(el).attr('src'))
      }
    })
  }
  return {paths,inlineCode,nonLocalPaths}
}

async function getCodeFromPath(uri,inlineCode,basePath) {
  if(uri.includes('///')) {
    console.log('getting inline',uri)
    const index=parseInt(uri.replace('///',''))
    if(isNaN(index) || inlineCode[index] === undefined) {
      throw new Error('invalid inline script index: '+uri)
    }
    return inlineCode[index]
  } else if(isLocalPath(uri,basePath)) {
    console.log('getting local:',uri)
    return getLocalCode(uri,basePath)
  } else {
    return ''
  }
}

async function getCodeFromPaths(paths,inlineCode,basePath) {
  try {
    return await Promise.all(paths.map(p=>getCodeFromPath(p,inlineCode,basePath)))
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
  const filepath=path.join(destinationFolder,`${bundlePrefix}-bundle.js`)
  fs.writeFileSync(filepath,code)
  nonLocalPaths.forEach(path=>$('head').append(`<script defer src="${path}"></script>`))
  $('head').append(`<script defer src="bundle.js"></script>`)
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
  sortPaths,
  getCodeFromPaths,
  concatAndTransform,
  replaceCodeInHtml,
}