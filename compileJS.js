const babelify=require('./babelify')

const Terser = require("terser");
const fs=require('fs')
const path = require('path');
const cheerio = require('cheerio')
const axios=require('axios')



// /**
//  * 
//  * @param string htmlFilePath 
//  * @param string destinationFolder 
//  * @param object options: sourceFolder, isUsingBabel, excludeJs, prependJsUrls
//  */
// function compileJS(htmlFilePath,destinationFolder,options) {
//   if (!fs.existsSync(destinationFolder)){
//     fs.mkdirSync(destinationFolder);
//   }
//   const basePath=options.sourceFolder || path.dirname(htmlFilePath)
//   const baseName=path.basename(htmlFilePath).replace(/\.html*/,'')
//   const htmlString=fs.readFileSync(htmlFilePath,'utf8')

//   var $ = cheerio.load(htmlString)
//   //sort the tags (put deferred in order at the bottom)
//   //extract the code from the ones whose code can be extracted (assume the rest are cdn scripts, collect them in order)
//   //take out all script tags from the html
//   //put the cdn scripts in order at the top
//   //concat the code in order, babel-ify it, minify it, and include it at the bottom
//   function isExcluded(el) {
//     return  options.excludeJs.includes($(el).attr('src'))
//   }

//   //sort the tags (put deferred in order at the bottom)
//   const deferredLocalOrInline=$('script[defer]').filter((index,el)=>isLocalOrInline(el,$,basePath) && !isExcluded(el))
//   const deferredNotLocal=$('script[defer]').filter((index,el)=>!isLocalOrInline(el,$,basePath) && !isExcluded(el))
//   const localOrInlineNotDeferred=$('script:not([defer])').filter((index,el)=>isLocalOrInline(el,$,basePath) && !isExcluded(el)) //these ones we can get code from
//   const notDeferredNotLocal=$('script:not([defer])[src]').filter((index,el)=>!isLocal(el,$,basePath) && !isExcluded(el)) //these are likely from a cdn, so put them at the top
//   const concatenatedScripts=[]
//   $('script[src]').each((index,el)=>{
//     if(!isExcluded(el)) {
//       concatenatedScripts.push(stripPrecedingSlash($(el).attr('src')))
//     }
//   })
//   //concat, babel-ify, minify local or inline code:
//   const notDeferredCode=processCode(localOrInlineNotDeferred,$,basePath,options.isUsingBabel)
//   const deferredCode=processCode(deferredLocalOrInline,$,basePath,options.isUsingBabel)

//   $('script').remove()

//   //order of insertion: prependJsUrls, notDeferredNotLocal,localOrInlineNotDeferred,deferredNotLocal,deferredLocalOrInline
//   options.prependJsUrls.forEach(url=>{
//     $('head').append(`<script src="${url}"></script>`)
//   })
//   if(notDeferredNotLocal.length > 0) {
//     notDeferredNotLocal.each((index,el)=>{
//       $('head').append(`<script src="${$(el).attr('src')}"></script>`)
//     })
//   }
//   if(notDeferredCode.length > 0) {
//     fs.writeFileSync(path.join(destinationFolder,`bundle-${baseName}.js`),notDeferredCode)
//     $('head').append(`<script src="/bundle-${baseName}.js"></script>`)
//   }
//   if(deferredNotLocal.length > 0) {
//     deferredNotLocal.each((index,el)=>{
//       $('head').append(`<script defer src="${$(el).attr('src')}"></script>`)
//     })
//   }
//   if(deferredCode.length > 0) {
//     fs.writeFileSync(path.join(destinationFolder,`bundle-deferred-${baseName}.js`),deferredCode)
//     $('head').append(`<script defer src="/bundle-deferred-${baseName}.js"></script>`)
//   }

//   return {html: $.html(),scripts:concatenatedScripts}
// }

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
    try {
      console.log('getting nonlocal:',uri)
      const response=await axios.get(uri)
      return response.data
    } catch(e) {
      throw e
    }
  }
}

async function getCodeFromPaths(paths,inlineCode,basePath) {
  try {
    return await Promise.all(paths.map(p=>getCodeFromPath(p,inlineCode,basePath)))
  } catch(e) {
    throw e
  }
}
function markCodeSegments(codeArray,indicesToSurround) {
  return codeArray.map((code,index)=>indicesToSurround.includes(index)?
    `/**********EXTRACT SEGMENT**********/
    ${code}
    /**********END EXTRACT SEGMENT**********/`
  :
    code)
}
function deleteCodeSegments(codeString) {
  return codeString
    .replace(/\/[*]{10}EXTRACT SEGMENT[*]{10}\/[\S\s]*?\/[*]{10}END EXTRACT SEGMENT[*]{10}\//g,'')
    .trim()
}
function concatAndTransform(codeArray) {
  return babelify(codeArray.join('\n\n'))
}

function replaceCodeInHtml(inputHtml,code,destinationFolder,bundlePrefix) {
  if (!fs.existsSync(destinationFolder)){
    fs.mkdirSync(destinationFolder);
  }
  var $ = cheerio.load(inputHtml)
  $('script').remove()
  const filepath=path.join(destinationFolder,`${bundlePrefix}-bundle.js`)
  fs.writeFileSync(filepath,code)
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
// function getCode(el,$,basePath) {
//   if($(el).attr('src') !== undefined) {
//     return getLocalCode($(el).attr('src'),basePath)
//   }
//   return $(el).html()
// }
// function processCode(elements,$,basePath,isUsingBabel) {
//   const scripts=[]
//   elements.each((index,el)=>scripts.push(getCode(el,$,basePath)))
//   const code=isUsingBabel ?
//     Babel.transform(
//       scripts.join('\n\n'), {presets: ["@babel/preset-env"],plugins:['@babel/plugin-transform-runtime']}
//     ).code
//     :
//     scripts.join('\n\n');
//   return Terser.minify(
//     code
//   ).code
// }
//todo: adds empty js files if no js file(s) are included in the html file
module.exports={
  // compileJS,
  sortPaths,
  getCodeFromPaths,
  concatAndTransform,
  replaceCodeInHtml,
  markCodeSegments,
  deleteCodeSegments
}