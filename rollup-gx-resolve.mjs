import * as fs from 'fs'
import path from 'node:path';
import * as process from 'process'

const gxResolve = (options) => {

  let contentsString = fs.readFileSync('package.json', 'utf8')
  let contents = JSON.parse(contentsString)
  let gxDeps = contents.gxDependencies;

  let baseDir = process.cwd()
  let srcRoot = null;
  let absSrcRoot = null;

  return {
    name: 'gx-resolve',
    buildStart(options){
      srcRoot = path.dirname(options.input[0])
      absSrcRoot = path.join(baseDir, srcRoot)
    },
    resolveId(source, importer, options) {

      //console.log(source, importer, options)
      if (importer == null) {
        importer = ""
      }
      let importerDir = path.dirname(importer)
      let targetPath = path.join(importerDir, source)
      let targetPathNormal = path.normalize(targetPath)
      let relativePath = targetPathNormal.replace(absSrcRoot, "")

      if (relativePath.startsWith("/gx/")) {
        let pathParts = relativePath.split("/")
        let moduleName = pathParts[2]
        let targetFile = "/" + pathParts.slice(3).join("/")

        let hash;
        for (let a = 0; a < gxDeps.length; a++) {
          if (gxDeps[a].name == moduleName) {
            hash = gxDeps[a].hash
          }
        }

        let finalPath = "./vendor/gx/ipfs/" + hash + "/" + moduleName + targetFile
        return {id: finalPath}
      }

      return null;
    }
  };
};

export default gxResolve;