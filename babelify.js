var babel = require("@babel/core");
const path=require('path')
const {promisify} = require('util')

function babelify(code) {
  babel.transform(code,{
    configFile:path.join(process.cwd(),'.babelrc'),
    generatorOpts:{
      minified:true,
    },
    parserOpts:{
      sourceType:'unambiguous'
    }
  },function(err,result) {
    if(err) {
      console.log("Error: ",err)
    } else {
      console.log("Result:",result)
      // fs.writeFileSync('test/expected/microplugin-transformed.min.js',result.code)
    }
  })
}
async function babelify2(code) {
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
function b(code) {
  babelify2(code).then(r=>{
    console.log(r.code)
    const fs=require('fs')
    fs.writeFileSync('test/expected/microplugin-transformed.min.js',r.code)
  }).catch(console.log)
}
module.exports=babelify2