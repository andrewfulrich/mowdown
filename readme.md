This is a super simple, standalone bundler that you don't have to run locally. 

It will search given html files, note all local references to css and js files (script and link tags), and will then concatenate and minify them into bundle files. For js, it will babel-transform them too.

So, no need to run a builder every time you make a change and no need to worry about code splitting or tree shaking, just use what html already gives you for including scripts.

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
  replaceJs:{}, //an object mapping JS script URIs to their desired replacement URIs
  replaceCss:{}, //an object mapping CSS script URIs to their desired replacement UR
  excludeJs:[], //a list of script sources to not include in the final output
  excludeCss:[], //a list of css script link hrefs to not include in the final output
  prependJsUrls:[], //a list of script sources to prepend to the final output
  prependCssUrls:[] //a list of css url to prepend to the final output
  excludeFoldersFromCopy:[] //see the below section (better readability)
  mangle:true //whether to mangle/obfuscate the JS code (see https://github.com/terser/terser)
}
```
## About excludeFoldersFromCopy option

By default, mowdown copies everything it didn't already touch in the sourcefolder over to the destination folder, just to make sure it got everything needed for the site to run. Use this array of folder paths to exclude folders within the sourcefolder from being copied over