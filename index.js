const {compileJs}=require('./compileJS')
const {compileCss}=require('./compileCSS')
const fs=require('fs')
const path=require('path')
const htmlClean=require('htmlclean')
const copy = require('recursive-copy')
const Ajv = require('ajv')
const ajv = new Ajv();
const validate = ajv.compile(require('./optionSchema.json'));

async function processSingleFile(htmlPath,destinationFolder,options) {
  //concatenate, babel-transform and minify js
  const {htmlString,paths}=await compileJs(htmlPath,destinationFolder,options)
  //concatenate and minify css
  const htmlWithCssCompiled=compileCss(htmlString,htmlPath,destinationFolder,options)
  //minify html
  const cleanedHtml=htmlClean(htmlWithCssCompiled.html)
  const htmlFileName=path.basename(htmlPath)
  fs.writeFileSync(htmlPath,cleanedHtml) //Overwrite the old html
  const processedPaths= htmlWithCssCompiled.scripts.concat(paths)
  processedPaths.push(htmlFileName)
  return processedPaths
}

const defaults={
  sourceFolder:null, //the folder with all the asset files referred to by your html files, if different from the folder containing your html files
  replaceJs:{}, //an object mapping JS script URIs to their desired replacement URIs
  replaceCss:{}, //an object mapping CSS script URIs to their desired replacement URIs
  excludeJs:[], //a list of script sources to not include in the final output
  excludeCss:[], //a list of css script link hrefs to not include in the final output
  prependJsUrls:[], //a list of script URLs to prepend to the final output
  prependCssUrls:[], //a list of css URLs to prepend to the final output (for things you'd get from a cdn for prod but locally for local dev)
  excludeFoldersFromCopy:[], //by default, mowdown copies everything it didn't already touch in the sourcefolder over to the destination folder, just to make sure it got everything needed for the site to run. Use this array of folder paths to exclude folders within the sourcefolder from being copied over
  mangle:true //whether to mangle/obfuscate the JS code (see https://github.com/terser/terser)
}

/**
 * 
 * @param {Array(string)} htmlPaths - the paths to the html files
 * @param {string} destinationFolder - the path the path to the output folder
 * @param {object} options - see defaults above, along with their comments
 */
async function mowDown(htmlPaths,destinationFolder,options={}) {
  const realOptions={...defaults,...options}
  const valid=validate(realOptions)
  if (!valid) {
    throw new Error(validate.errors.map(e=>`options${e.dataPath} ${e.message}`.trim()).join(',\n'))
  }
  
  //include both "path" and "/path" variants for replacement scripts and excluded scripts
  realOptions.replaceJs=addPathVariantsToReplacementObj(realOptions.replaceJs)
  realOptions.replaceCss=addPathVariantsToReplacementObj(realOptions.replaceCss)
  realOptions.excludeJs=addPathVariantsToArray(realOptions.excludeJs)
  realOptions.excludeCss=addPathVariantsToArray(realOptions.excludeCss)

  const processedFileArrays=await Promise.all(htmlPaths.map(path=>processSingleFile(path,destinationFolder,realOptions)))
  const processedFiles=processedFileArrays.reduce((accum,curr)=>accum.concat(curr),[])

  //copy everything else over just in case (helpful for things like the fontawesome folder)
  const htmlPathFolder=realOptions.sourceFolder || path.dirname(htmlPaths[0]) //todo: this currently assumes that all the given html files are in the same source folder

  const dontCopyStarterArray=options.sourceFolder===null? []:htmlPaths.map(p=>path.basename(p))
  const dontCopyThese=dontCopyStarterArray.concat(
    Object.keys(realOptions.replaceJs),
    Object.keys(realOptions.replaceCss),
    realOptions.excludeJs,
    realOptions.excludeCss)
  console.log('processed the following files:',processedFiles)
  console.log(`copying over to ${destinationFolder} all files except for: `,dontCopyThese)

  function isInExcludedFolder(testPath) {
    return realOptions.excludeFoldersFromCopy.some(folderName=>testPath.startsWith(folderName))
  }
  const copyOptions={
    overwrite:true,
    filter:testPath=>!dontCopyThese.includes(testPath) && !isInExcludedFolder(testPath)
  }
  await copy(htmlPathFolder, destinationFolder, copyOptions)
}

function getPathVariant(path) {
  return path[0]=='/' ? path.substring(1) : '/'+path
}

function addPathVariantsToReplacementObj(replacementObj) {  
  const obj={...replacementObj}
  Object.keys(obj).forEach(path=>
    obj[getPathVariant(path)]=obj[path]
    )
  return obj
}
function addPathVariantsToArray(arr) {
  return arr.concat(arr.map(getPathVariant))
}
module.exports=mowDown