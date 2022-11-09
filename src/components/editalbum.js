'use strict';

define([
  'lib/loader',
  'lib/utils',
  'lib/cheesedb',
  'lib/cheesestate',
  'components/cidimage',
  'components/selectableimagegrid',
  'gx/wip2p-settings/src/publishcallback'
], (
  Loader,
  Utils,
  CheeseDb,
  CheeseState,
  CidImage,
  SelectableImageGrid,
  PublishCallback
)=>{

  var resizePhoto = (fileDataB64) => {
    var img = new Image();
    return new Promise((resolve, reject)=>{
      img.src = 'data:image/jpeg;base64,' + fileDataB64;
      img.onload = function() {
        resolve({height: img.height, width: img.width})
      }
    })
    .then((imgDimensions)=>{
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      var MAX_WIDTH = 1280;
      var MAX_HEIGHT = 1280;
      var width = imgDimensions.width;
      var height = imgDimensions.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      //Specify the resizing result
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      var resizedImageDataUrl = canvas.toDataURL("image/jpeg", 70/100);
      var resizedImageDataB64 = resizedImageDataUrl.split(",")[1];
      let myFileData = Buffer.from(resizedImageDataB64, 'base64');

      if (myFileData.length >= 262144) {
        resizedImageDataUrl = canvas.toDataURL("image/jpeg", 60/100);
        resizedImageDataB64 = resizedImageDataUrl.split(",")[1];
        myFileData = Buffer.from(resizedImageDataB64, 'base64');
      }

      return {b64: resizedImageDataB64, buf: myFileData}
    })
  }

  var onNewPhoto = async (vnode, file)=>{

    m.redraw();

    var fileDataB64 = file.dataURL.split(",")[1];
    var myFileData = Buffer.from(fileDataB64, 'base64');

    //resize image
    if (myFileData.length >= 262144) {
      await resizePhoto(fileDataB64)
      .then((fileBufs)=>{
        fileDataB64 = fileBufs.b64;
        myFileData = fileBufs.buf;
      })
    }
    //console.log(myFileData)

    if (myFileData.length >= 262144) {
      throw new Error("image still too big even after resize attempt")
    }

    //document.body.appendChild(canvas)
    //console.log(myFileData.length)
    let img = file.previewTemplate.querySelector(".preview>img");
    img.src = "data:image;base64," + fileDataB64;
    img.height = "80";
    img.objectFit = "cover";
    //img.width = "auto";
    file.previewTemplate.querySelector(".size").innerHTML = Utils.getReadableFileSizeString(myFileData.length);
    let cidNode = file.previewTemplate.querySelector(".cid");
    cidNode.parentNode.removeChild(cidNode.nextElementSibling)
    cidNode.parentNode.removeChild(cidNode.nextElementSibling)

    calcCid(myFileData)
    .then((result)=>{
      result.title = file.name;
      vnode.state.draftAlbum.addPhotoForUpload(result);
      cidNode.innerHTML = result.cid.toString();
    })

    //m.redraw();
  }

  var calcCid = async function(fileBuf) {

    let UnixFS = window.libipfs.unixfs.UnixFS;
    let dagPB = window.libipfs.dagPB;
    var Sha = window.libipfs.shajs;
    var CID = window.libipfs.multiformats.CID;

    const sha256 = window.libipfs.multiformats.hasher.from({
      name: 'sha2-256',
      code: 0x12,
      encode: (input) => Sha('sha256').update(input).digest()
    })

    const file = new UnixFS({ type: 'file' })
    file.data = fileBuf

    // format the unixfs into pb structure then encode
    var pbStruct = {Data: file.marshal(), Links:[]}
    var pbBuf = dagPB.encode(pbStruct)

    var myFileData = Buffer.from(pbBuf).toString("base64");

    // hash then construct CID
    let digest = sha256.digest(pbBuf)
    var cid = CID.create(0, dagPB.code, digest)
    return {cid: cid, buf: myFileData};
  }

  return {

    oninit: (vnode)=>{

      vnode.state.myCheeseDb = null;
      vnode.state.draftAlbum = new CheeseDb.Album();
      vnode.state.pageTitle = null;
      vnode.state.myDropzone = null;

      // first we fetch our account and get the cheeseDb
      Loader.fetchOne(libwip2p.Account.getWallet().address)
      .then((result)=>{
        if (result.msg == "account not found" || result.db == "account not found") {
          PublishCallback.setOnPublishCallback(function(){
            Loader.fetchOne(libwip2p.Account.getWallet().address, true)
            .then((result)=>{
              m.route.set("/editalbum");
            })
          })
          m.route.set("/settings?tab=invites");
          return;
        }
        if (result.db != null) {
          vnode.state.myCheeseDb = result.db;
        } else {
          vnode.state.myCheeseDb = new CheeseDb();
          vnode.state.myCheeseDb.setOwner(libwip2p.Account.getWallet().address);
          //CheeseState.process(vnode.state.myCheeseDb.owner, vnode.state.myCheeseDb);
        }
        let targetAlbumId = m.route.param().albumid;
        if (targetAlbumId == null) {
          vnode.state.pageTitle = "New album";
          vnode.state.draftAlbum = vnode.state.myCheeseDb.newAlbum();
        } else {
          vnode.state.pageTitle = "Edit album";
          vnode.state.draftAlbum = vnode.state.myCheeseDb.getAlbumById(targetAlbumId);
          if (vnode.state.draftAlbum == null) {
            vnode.state.error = "Album not found";
          }
        }
        m.redraw();

        //console.log(vnode.state.myCheeseDb)
        //console.log(vnode.state.draftAlbum)
      })
    },

    oncreate: (vnode)=>{
      // hide the template
      var previewNode = document.querySelector("#template");
      previewNode.id = "";
      var previewTemplate = previewNode.parentNode.innerHTML;
      previewNode.parentNode.removeChild(previewNode);

      var myDropzone = new Dropzone(document.querySelector("#previews"), { // Make the whole body a dropzone
        url: "/target-url", // Set the url
        thumbnailWidth: 80,
        thumbnailHeight: 80,
        parallelUploads: 20,
        createImageThumbnails: false,
        previewTemplate: previewTemplate,
        autoQueue: false, // Make sure the files aren't queued until manually added
        previewsContainer: "#previews", // Define the container to display the previews
        clickable: ".fileinput-button" // Define the element that should be used as click trigger to select files.
      });

      vnode.state.myDropzone = myDropzone;

      myDropzone.on("addedfile", function(origFile) {

        var reader = new FileReader();

        reader.addEventListener("load", function(event) {
          let fileData = reader.result;
          onNewPhoto(vnode, {name: origFile.name, dataURL: fileData, previewTemplate: origFile.previewTemplate})
        });

        reader.readAsDataURL(origFile);
      });

      myDropzone.on("removedfile", function(f){
        vnode.state.draftAlbum.deletePhotoByName(f.name);
        m.redraw();
      })
    },

    view: (vnode)=>{

      if (vnode.state.error) {
        return m("div.container", m("div.alert alert-danger", vnode.state.error));
      }

      let dropHere = null;

      if (vnode.state.myDropzone != null) {
        //console.log(vnode.state.myDropzone)
        if (vnode.state.myDropzone.files.length == 0) {
          dropHere = m("div", {style:"color: #bbbbbb;width:300px;padding:10px;"}, "Drag and drop photos here");
        }
      }

      return m("div.container",
        m("div.row", {id:"template", style:"margin-top:5px;"},
          m("div.col-4 col-md-4 col-lg-3 col-xxl-2", {style:"display:inline-block;vertical-align:top;"},
            m("span.preview", m("img", {style:"max-width:143px;object-fit:cover;", "data-dz-thumbnail":true}))
          ),
          m("div.col-3 col-md-3 col-lg-4 col-xxl-5", {style:"display:inline-block;left:0px;right:0px;overflow:hidden;"},
            m("p.name", {"data-dz-name":true, style:"margin-bottom:0px;"},
              m("div.cid", {style:"font-size:14px;"}, "...")
            ),
            m("strong.error text-danger", {"data-dz-errormessage":true})
          ),
          m("div.col-2", {style:"vertical-align:top;display:inline-block;"},
            m("p.size", {style:"font-weight:bold;"})
          ),
          m("div.col-2", {style:"display:inline-block;vertical-align:top;"},
            m("button.btn btn-outline-danger delete", {"data-dz-remove":true},
              m("span", "Remove")
            )
          )
        ),
        m("div.row",
          m("div.col-12",
            m("h4", vnode.state.pageTitle)
          )
        ),
        m("div.row",
          m("div.col-12 col-sm-12 col-md-4",
            m("div.mb-3",
              m("label.form-label", "Title"),
              m("input.form-control", {"type":"text", value: vnode.state.draftAlbum.title, onchange: function(e){
                vnode.state.draftAlbum.title = e.target.value;
              }})
            ),
            m("div.mb-3",
              m("label.form-label", "Description"),
              m("textarea.form-control", {"rows": 3, value: vnode.state.draftAlbum.description, onchange: function(e){
                vnode.state.draftAlbum.description = e.target.value;
              }})
            ),
            m("div.mb-3",
              m("label.form-label", "Date"),
              m("input.form-control", {"type":"date", value: vnode.state.draftAlbum.date, onchange: function(e){
                vnode.state.draftAlbum.date = e.target.value;
              }})
            ),
            m("div.row mb-3",
              m("div.col-12",
                m("button.btn btn-primary", {style:"margin-bottom:10px;", onclick: function(){
                  if (vnode.state.draftAlbum.date == null) {
                    let d = new Date();
                    vnode.state.draftAlbum.date = Utils.dateToLogDateFormat(d);
                  }
                  if (vnode.state.pageTitle == "New album") {
                    vnode.state.myCheeseDb.addAlbum(vnode.state.draftAlbum);
                  }
                  vnode.state.myCheeseDb.publish(libwip2p.Account.getWallet().address)
                  .then((result)=>{
                    return Loader.fetchOne(libwip2p.Account.getWallet().address, true);
                  })
                  .then((result)=>{
                    m.route.set("/");
                  })
                }}, m("i.fa fa-save"), " Publish album"),
                (function(){
                  if (vnode.state.pageTitle == "Edit album") {
                    return m("button.btn btn-danger", {style:"vertical-align:top;margin-left:10px;", onclick: function(){
                      vnode.state.myCheeseDb.deleteAlbum(vnode.state.draftAlbum.id)
                      vnode.state.myCheeseDb.publish(libwip2p.Account.getWallet().address)
                      .then((result)=>{
                        return Loader.fetchOne(libwip2p.Account.getWallet().address, true);
                      })
                      .then(()=>{
                        m.route.set("/");
                      })
                    }}, m("i.fa fa-trash"), " Delete album")
                  }
                })()
              )
            )
          ),
          m("div.col-12 col-sm-12 col-md-8",
            // existing image display
            m(SelectableImageGrid, {draftAlbum: vnode.state.draftAlbum}),

            m("button.btn btn-secondary fileinput-button", m("i.fa fa-image"), " Add photos"),
            m("div.table table-striped files", {id:"previews", style:"margin-top:10px;height:300px;border:1px solid #bbbbbb;border-radius:5px;"},
            dropHere
          )
        )
      ));
    }
  }

})