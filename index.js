//todo: handle multiple files
const {compileJS}=require('./compileJS')
const {compileCss}=require('./compileCSS')
const fs=require('fs')
const path=require('path')
const htmlClean=require('htmlclean')
const copy = require('recursive-copy')


function processSingleFile(htmlPath,destinationFolder,sourceFolder,isUsingBabel) {
  //concatenate, babel-ify and minify js
  const htmlWithJsCompiled=compileJS(htmlPath,destinationFolder,sourceFolder,isUsingBabel)
  //concatenate and minify css
  const htmlWithCssCompiled=compileCss(htmlWithJsCompiled.html,htmlPath,destinationFolder,sourceFolder)
  //minify html
  const cleanedHtml=htmlClean(htmlWithCssCompiled.html)
  const htmlFileName=path.basename(htmlPath)
  fs.writeFileSync(path.join(destinationFolder,htmlFileName),cleanedHtml)
  return htmlWithCssCompiled.scripts.concat(htmlWithJsCompiled.scripts).concat(htmlFileName)
}

/**
 * 
 * @param {Array(string)} htmlPaths - the paths to the html files
 * @param {string} destinationFolder - the path the path to the output folder
 * @param {string} sourceFolder - (optional) the path to the basepath of the project. if not given, it is assumed to be the directory of the htmlPath(s)
 * @param boolean isUsingBabel - whether or not to use Babel to compile it down to es5
 */
async function mowDown(htmlPaths,destinationFolder,sourceFolder,isUsingBabel=true) {
  const processedFiles=htmlPaths
    .reduce((accum,htmlPath)=>accum.concat(processSingleFile(htmlPath,destinationFolder,sourceFolder,isUsingBabel)),[])

  //copy everything else over just in case (helpful for things like the fontawesome folder)
  const htmlPathFolder=sourceFolder || path.dirname(htmlPaths[0]) //todo: this currently assumes that all the given html files are in the same source folder
  console.log(`copying over to ${destinationFolder} all files except for: `,processedFiles)
  const copyOptions={
    overwrite:true,
    filter:testPath=>!processedFiles.includes(testPath)
  }
  await copy(htmlPathFolder, destinationFolder, copyOptions)
}
module.exports=mowDown
