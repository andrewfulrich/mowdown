This is a super simple, standalone bundler that you don't have to run locally. 

It will search given html files, note all local references to css and js files (script and link tags), and will then concatenate and minify them into bundle files. For js, it will babel-ify them too.

So, no need to run a builder every time you make a change and no need to worry about code splitting, just use what html already gives you for including scripts.

## NOTICE: 

If one of your html files refers to a css script in a CDN, add it to the excludeCss and prependCssUrls lists (see below) because otherwise mowdown currently assumes all css files are local

# To use:
```
const mowdown = require('mowdown')
mowDown(arrayOfHtmlFiles,outputFolder)
```
or if the html files are not in the same folder as the assets they refer to, you can do:
```
const mowdown = require('mowdown')
mowDown(arrayOfHtmlFiles,outputFolder,{sourceFolder:inputFolder})
```
That third param takes a few other options as well. Here are the defaults and explanations:
```
const defaults={
  sourceFolder:null, //the folder with all the asset files referred to by your html files, if different from the folder containing your html files
  isUsingBabel:true, //whether or not to use Babel to compile your js down to es5
  excludeJs:[], //a list of script sources to not include in the final output
  excludeCss:[], //a list of css script link hrefs to not include in the final output
  prependJsUrls:[], //a list of script sources to prepend to the final output (for things like polyfill/libs you would locally serve for local dev but get from a cdn for prod)
  prependCssUrls:[] //a list of css url to prepend to the final output (for things you'd get from a cdn for prod but locally for local dev)
}
```