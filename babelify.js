var babel = require("@babel/core");
const path=require('path')
const {promisify} = require('util')

async function babelify(code) {
  const transform=promisify(babel.transform)
  try {
    const stuff=await transform(code,{
      configFile:path.join(process.cwd(),'.babelrc'),
      generatorOpts:{
        minified:true,
      },
      parserOpts:{
        sourceType:'unambiguous'
      }
    })
    return stuff;
  } catch(e) {
    throw e
  }
}

module.exports=babelify