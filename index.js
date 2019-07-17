//todo: handle multiple files
const {compileJS}=require('./compileJS')
const {compileCss}=require('./compileCSS')
const fs=require('fs')
const path=require('path')
const htmlClean=require('htmlclean')
const copy = require('recursive-copy')


function processSingleFile(htmlPath,destinationFolder,options) {
  //concatenate, babel-ify and minify js
  const htmlWithJsCompiled=compileJS(htmlPath,destinationFolder,options)
  //concatenate and minify css
  const htmlWithCssCompiled=compileCss(htmlWithJsCompiled.html,htmlPath,destinationFolder,options)
  //minify html
  const cleanedHtml=htmlClean(htmlWithCssCompiled.html)
  const htmlFileName=path.basename(htmlPath)
  fs.writeFileSync(path.join(destinationFolder,htmlFileName),cleanedHtml)
  return htmlWithCssCompiled.scripts.concat(htmlWithJsCompiled.scripts).concat(htmlFileName)
}

const defaults={
  sourceFolder:null, //the folder with all the asset files referred to by your html files, if different from the folder containing your html files
  isUsingBabel:true, //whether or not to use Babel to compile your js down to es5
  excludeJs:[], //a list of script sources to not include in the final output
  excludeCss:[], //a list of css script link hrefs to not include in the final output
  prependJsUrls:[], //a list of script sources to prepend to the final output (for things like polyfill/libs you would locally serve for local dev but get from a cdn for prod)
  prependCssUrls:[], //a list of css url to append to the final output (for things you'd get from a cdn for prod but locally for local dev)
  excludeFoldersFromCopy:[] //by default, mowdown copies everything it didn't already touch in the sourcefolder over to the destination folder, just to make sure it got everything needed for the site to run. Use this array of folder paths to exclude folders within the sourcefolder from being copied over
}

/**
 * 
 * @param {Array(string)} htmlPaths - the paths to the html files
 * @param {string} destinationFolder - the path the path to the output folder
 * @param {object} options - see defaults above, along with their comments
 */
async function mowDown(htmlPaths,destinationFolder,options={}) {
  const realOptions={...defaults,...options}
  //include both "path" and "/path" variants for excluded scripts
  function getpathVariant(path) {
    return path[0]=='/' ? path.substring(1) : '/'+path
  }
  const excludeJsVariants=realOptions.excludeJs.map(getpathVariant)
  realOptions.excludeJs=Array.from(new Set(realOptions.excludeJs.concat(excludeJsVariants)))
  const excludeCssVariants=realOptions.excludeCss.map(getpathVariant)
  realOptions.excludeCss=Array.from(new Set(realOptions.excludeCss.concat(excludeCssVariants)))

  const processedFiles=htmlPaths
    .reduce((accum,htmlPath)=>accum.concat(processSingleFile(htmlPath,destinationFolder,realOptions)),[])

  //copy everything else over just in case (helpful for things like the fontawesome folder)
  const htmlPathFolder=realOptions.sourceFolder || path.dirname(htmlPaths[0]) //todo: this currently assumes that all the given html files are in the same source folder
  const dontCopyThese=processedFiles.concat(realOptions.excludeCss,realOptions.excludeJs)
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
module.exports=mowDown