This is a super simple, standalone bundler that you don't have to run locally. 

It will search given html files, note all local references to css and js files (script and link tags), and will then concatenate and minify them into bundle files. For js, it will babel-ify them too.

So, no need to run a builder every time you make a change and no need to worry about code splitting, just use what html already gives you for including scripts.

# To use:
```
const mowdown = require('mowdown')
mowDown(arrayOfHtmlFiles,outputFolder)
```
or if the html files are not in the same folder as the assets they refer to, you can do:
```
const mowdown = require('mowdown')
mowDown(arrayOfHtmlFiles,outputFolder,inputFolder)
```
or if you want to skip babel
```
const mowdown = require('mowdown')
mowDown(arrayOfHtmlFiles,outputFolder,inputFolder,false)
```