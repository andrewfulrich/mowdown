var CleanCSS = require('clean-css');

const cheerio = require('cheerio')
const path=require('path')
const fs=require('fs')

function stripPrecedingSlash(path) {
  return path[0] == '/' ? path.substring(1) : path;
}

function getCssFromHtml(sourceFolder,$) {
  // no support for css cdns yet
  const scripts=[]
  //ignore inline/internal css
  $('link[rel="stylesheet"]').each((index,el)=>scripts.push(path.join(sourceFolder,stripPrecedingSlash($(el).attr('href')).split('?')[0])))

  return new CleanCSS().minify(scripts).styles;
}

function compileCss(htmlString,htmlFilePath,destinationFolder,sourceFolder) {
  const basePath=sourceFolder || path.dirname(htmlFilePath)
  var $=cheerio.load(htmlString)
  const cssString=getCssFromHtml(basePath,$)
  const outputFile=path.basename(htmlFilePath).replace(/html*/,'css')
  fs.writeFileSync(path.join(destinationFolder,outputFile),cssString)
  const concatenatedScripts=[]
  $('link[rel="stylesheet"]').each((index,el)=>concatenatedScripts.push(stripPrecedingSlash($(el).attr('href'))))
  $('link[rel="stylesheet"]').remove()
  $('head').append(`<link rel="stylesheet" href="${outputFile}">`)
  return { html: $.html(), scripts:concatenatedScripts }
}
//todo: adds empty css file if no css script(s) are included in the html file
module.exports={
  compileCss
}