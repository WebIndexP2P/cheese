var path = require('path');
var fs = require('fs');

var exec = require('child_process').exec;
var mkdirp = require('mkdirp');
var ncp = require('ncp');
var mv = require('mv');
var gxDeps = require('./package.json').gxDependencies;

var buildDir = 'build/';

var rName;
if (process.platform == 'win32') {
    rName = "r";
} else {
    rName = "r.js";
}

var filesToCopy = [
    // main app files
    {type:"file", src: "src/index.html", dst: "index.html"},
    {type:"file", src: "src/service-worker.js", dst: "service-worker.js"},
    {type:"file", src: "src/manifest.json", dst: "manifest.json"},
    {type:"file", src: "src/world.geojson.compressed", dst: "world.geojson.compressed"},

    {type:"file", src: "src/css/app.css", dst: "css/app.css"},
    {type:"file", src: "src/assets/cheese_192_round.png", dst: "assets/cheese_192_round.png"},
    {type:"file", src: "src/assets/cheese_192_square.png", dst: "assets/cheese_192_square.png"},
    {type:"file", src: "src/assets/cheese_512_round.png", dst: "assets/cheese_512_round.png"},

    // GX deps
    {type:"file", src: "/node_modules/bootstrap/dist/css/bootstrap.min.css", dst:"/npm/bootstrap/dist/css/bootstrap.min.css"},
    {type:"file", src: "/node_modules/bootstrap/dist/js/bootstrap.bundle.min.js", dst:"/npm/bootstrap/dist/js/bootstrap.bundle.min.js"},

    {type:"file", src: "/node_modules/@fortawesome/fontawesome-free/css/fontawesome.min.css", dst: "/npm/@fortawesome/fontawesome-free/css/fontawesome.min.css"},
    {type:"file", src: "/node_modules/@fortawesome/fontawesome-free/css/solid.min.css", dst: "/npm/@fortawesome/fontawesome-free/css/solid.min.css"},
    {type:"file", src: "/node_modules/@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2", dst: "/npm/@fortawesome/fontawesome-free/webfonts/fa-solid-900.woff2"},

    {type:"file", src: "/node_modules/dropzone/dist/dropzone.css", dst: "/npm/dropzone/dist/dropzone.css"},
    {type:"file", src: "/node_modules/dropzone/dist/dropzone-min.js", dst: "/npm/dropzone/dist/dropzone-min.js"},

    {type:"file", src: "/node_modules/qrcode-generator/qrcode.js", dst:"/npm/qrcode-generator/qrcode.js"},

    {type:"file", src: "/node_modules/leaflet/dist/leaflet.css", dst:"/npm/leaflet/dist/leaflet.css"},
    {type:"file", src: "/node_modules/leaflet/dist/leaflet.js", dst:"/npm/leaflet/dist/leaflet.js"},
    {type:"file", src: "/node_modules/leaflet/dist/images/marker-icon-2x.png", dst:"/npm/leaflet/dist/images/marker-icon-2x.png"},
    {type:"file", src: "/node_modules/leaflet/dist/images/marker-icon.png", dst:"/npm/leaflet/dist/images/marker-icon.png"},
    {type:"file", src: "/node_modules/leaflet/dist/images/marker-shadow.png", dst:"/npm/leaflet/dist/images/marker-shadow.png"},

    {type:"file", src: "/node_modules/fflate/umd/index.js", dst:"/npm/fflate/umd/index.js"},

    {type:"file", src: "/node_modules/mithril/mithril.min.js", dst: "/npm/mithril/mithril.min.js"},

    {type:"file", src: "/node_modules/ethers/dist/ethers.umd.min.js", dst:"/npm/ethers/dist/ethers.umd.min.js"},

    {type:"file", src: "/gx/ethereum-blockies/main.js"},

    {type:"file", src: "/gx/wip2p-settings/dist/wip2p-settings.iife.min.js"},

    {type:"file", src: "/gx/tweetnacl/nacl-fast.min.js", dst:"/gx/tweetnacl/nacl-fast.min.js"},

    {type:"file", src: "/gx/libwip2p/libwip2p.iife.min.js"},

    {type:"file", src: "/gx/libipfs/libipfs.iife.min.js"}
]


// build the main app AMD file
var results = exec("rollup -c");
results.stdout.on("data", function(data){
    process.stdout.write(data)
})
results.stderr.on("data", function(data){
    process.stdout.write(data)
})
results.on('close', function(errCode){
    if (errCode != 0) {
        console.error('failed')
        return;
    }
    console.log('Rollup build done.')
    console.log('');

    renameIndex()
    .then(copyFiles)
    .then(replaceImportMap)
    .catch((err)=>{
        console.log(err)
    })
})

var renameIndex = function(){
    return new Promise((resolve, reject)=>{
        fs.rename('build/index.min.js', 'build/index.js', function(){
            resolve();
        });
    })
}

// copy the files
var copyFiles = function() {
    return new Promise(async (resolve, reject)=>{
        for (var idx = 0; idx < filesToCopy.length; idx++) {
            var entry = filesToCopy[idx];

            var destFolder;

            // replace any gx refs
            if (entry.src.startsWith('/gx/')) {
                destFolder = entry.src;
                var targetModule = entry.src.substring(4, entry.src.indexOf("/", 4))
                var moduleHash;
                for (var a = 0; a < gxDeps.length; a++) {
                    if (gxDeps[a].name == targetModule) {
                        moduleHash = gxDeps[a].hash;
                        break;
                    }
                }
                if (moduleHash == null) throw new Error('missing gx dep ' + entry.src);

                var actualPath = 'vendor/gx/ipfs/' + moduleHash + '/' + targetModule;
                entry.src = entry.src.replace('/gx/' + targetModule, actualPath)

                entry.src = entry.src.replace('{ver}', gxDeps[a].version);
            } else {
                // for regular copy operations (not gx)
                if (entry.dst != null)
                    destFolder = entry.dst;
                else
                    destFolder = entry.src;
            }

            console.log(destFolder)

            var fullSrcPath = path.join(process.cwd(), entry.src);
            var fullDestPath = path.join(process.cwd(), buildDir, destFolder);
            mkdirp.sync(path.dirname(fullDestPath));
            if (entry.type == 'folder' || entry.type == 'file') {
                await new Promise((resolve, reject)=>{
                    ncp(fullSrcPath, fullDestPath, function(err){
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                })
            }
        }

        console.log('');
        resolve();
    })
}

var replaceImportMap = function(){
    let indexPath = path.join(buildDir, "index.html");
    let indexHtml = fs.readFileSync(indexPath).toString();
    let startPos = indexHtml.indexOf("<script type=\"importmap\">")
    let endPos = indexHtml.indexOf("</script>", startPos + 10) + 9

    let iifePrefered = "<script>window.iifePrefered = true;</script>"

    indexHtml = indexHtml.substring(0, startPos) + iifePrefered + indexHtml.substring(endPos)
    fs.writeFileSync(indexPath, indexHtml);
    console.log('index.html -> importmap removed')
}