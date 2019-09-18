var babel = require("@babel/core");


const fs=require('fs')
const path=require('path')
const axios=fs.readFileSync('test/expected/microplugin.min.js')
const code=`
const foo=(f,d)=>{
  let b={a:'sdf',c:'dfd'}
  const {a,c}=b
  const n=[1,3,5,6]
  const n2=[...n,7]
  console.log(a,c,n2)
  notDefinedInThisScope()
}
`
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
    // console.log("Result:",result)
    fs.writeFileSync('babel-temp-transformed.js',result.code)
  }
  
})

// const b=require('./babelify')
// b(axios)