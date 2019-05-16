//todo: handle multiple files

const {compileJS}=require('./compileJS')
const {compileCss}=require('./compileCSS')
const fs=require('fs')
const path=require('path')
const htmlClean=require('htmlclean')
const copy = require('recursive-copy')


async function mowDown(htmlPath,destinationFolder) {
  //concatenate, babel-ify and minify js
  const htmlWithJsCompiled=compileJS(htmlPath,destinationFolder)
  //concatenate and minify css
  const htmlWithCssCompiled=compileCss(htmlWithJsCompiled.html,htmlPath,destinationFolder)
  //minify html
  const cleanedHtml=htmlClean(htmlWithCssCompiled.html)
  const htmlFileName=path.basename(htmlPath)
  fs.writeFileSync(path.join(destinationFolder,htmlFileName),cleanedHtml)

  //copy everything else over just in case (helpful for things like the fontawesome folder)
  const htmlPathFolder=path.dirname(htmlPath)
  const excludeList=htmlWithJsCompiled.scripts
    .concat(htmlWithCssCompiled.scripts)
    .concat(htmlFileName)
  console.log(`copying over to ${destinationFolder} all files except for: `,excludeList)
  const copyOptions={
    overwrite:true,
    filter:testPath=>!excludeList.includes(testPath)
  }
  await copy(htmlPathFolder, destinationFolder, copyOptions)
}

mowDown('./test/input/stuff.html','./dist') //todo: move this to test.js and assert the things you're checking