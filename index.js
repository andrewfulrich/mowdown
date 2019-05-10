const Babel=require('@babel/standalone')

var input = 'const getMessage = () => "Hello World";';
var output = Babel.transform(input, { presets: ['es2015'] }).code;

console.log(output)

const fs=require('fs')
const path = require('path');


function getScriptTags(dom) {
  return dom.children
  .filter(tag=>tag.type.toLowerCase()=='script')
  .filter(tag=>tag.name.toLowerCase()==='script')
}

function hasAttrib(attribs,tagName) {
  return Object.keys(attribs).some(attrib=>attrib.toLowerCase()===tagName)
}

function sortScriptTags(headTags,bodyTags) {
  const deferTags=headTags.filter(tag=>hasAttrib(tag.attribs,'defer'))
  const headTagsWithoutDefer=headTags.filter(tag=>!hasAttrib(tag.attribs,'defer'))
  return headTagsWithoutDefer.concat(bodyTags,deferTags)
}

function getCode(tag,basePath) {
  function getAttrib(attribs,tagName) {
    return attribs[Object.keys(attribs).find(attrib=>attrib.toLowerCase()===tagName)]
  }
  //what about cdns? return null and don't do anything with them
  if(hasAttrib(tag.attribs,'src')) {
    const src= getAttrib(tag.attribs,'src')
    try {
      return {
        src,
        code:fs.readFileSync(path.join(basePath,src),'utf8')
      }
    } catch(e) {
      //cdns would be caught here
      return {
        src,
        code:null
      } 
    }
  } 
  else if(tag.children.length > 1 && tag.children[0].data && tag.children[0].data.length > 1) {
    //inline scripts etc. would be caught here
    return tag.children[0].data //only returns the first child, assumes no nesting inside script tags
  }
  
  return {
    src:null,
    code:null
  };
}

function getSources(tags,basePath) {
  return tags
    .map(tag=>getCode(tag,basePath))
    .filter(code=> code !== null)
}

function compileJS(htmlFilePath) {
  // const emptyRegex=/<\s*script[^>]*>\s*?<\/\s*script\s*>/gims
  
  function replaceScriptTagsHavingSrc(srcArray,htmlString) {
    //from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
    function escapeRegExp(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }
    const escapedURLS=srcArray.map(escapeRegExp)
    const emptyTagRegex=new RegExp(`<\s*script[^>]*?src=['"](${escapedURLS.join('|')})['"]>\s*?<\/\s*script\s*>`,'gmis')
    return htmlString.replace(emptyTagRegex,'')
  }
  function replaceScriptTagsHavingCode(htmlString) {
    const nonEmptyTagRegex=/<\s*script[^>]*>.+?<\/\s*script\s*>/gims
    return htmlString.replace(nonEmptyRegex,'')
  }
  const basePath=path.dirname(htmlFilePath)
  const htmlString=fs.readFileSync(htmlFilePath,'utf8')

  const Parser = require('html-dom-parser');
  const parsedHtml = Parser(htmlString)
  //assumption: parsedHtml[0] is the html tag
  const head = parsedHtml[0].children.find(tag=>tag.name.toLowerCase()=='head')
  const body = parsedHtml[0].children.find(tag=>tag.name.toLowerCase()=='body')

  const sortedScriptTags=sortScriptTags(getScriptTags(head),getScriptTags(body))
  const codeAndSrc=sortedScriptTags()

}
console.log('sorted: ',sortScriptTags(scriptTagsHead,scriptTagsBody))