import CheeseDb from '../lib/cheesedb.js'
import CidImage from './cidimage.js'
import GeoShareDb from '../gx/libgeoshare/geosharedb.js'
import * as MapState from '../gx/libgeoshare/mapstate.js'
import * as libwip2p from 'libwip2p'

const Loader = libwip2p.Loader;

var loadMapData = function(vnode, address, mapId) {
  let mainFeatureSet;
  return GeoShareDb.fetch(address)
  .then((result)=>{
    vnode.state.myGeoShareDb = result;
    for (let a = 0; a < result.featureSets.length; a++) {
      if (mapId == result.featureSets[a].id) {
        mainFeatureSet = result.featureSets[a]
        break;
      }
    }      
    return vnode.state.myGeoShareDb.fetchFeatureSetGeoJson(mainFeatureSet)
  })
  .then(async (result)=>{
    MapState.addFeatureSets('local', [ result ])
    MapState.zoomTo(result);
    for (let a = 0; a < mainFeatureSet.offlineMaps.length; a++) {
      let offlineMapId = mainFeatureSet.offlineMaps[a];
      let offlineFeatureSet = vnode.state.myGeoShareDb.getFeatureSetById(offlineMapId);
      await vnode.state.myGeoShareDb.fetchFeatureSetGeoJson(offlineFeatureSet);
    }
  })
}

export default {
  oninit: function(vnode) {
    vnode.state.targetAlbum = new CheeseDb.Album();
    vnode.state.mapActivated = false;

    let targetAlbumId = m.route.param().albumid;
    vnode.state.targetAlbumId = targetAlbumId;
    let decodedAlbumId = {
      address: targetAlbumId.substr(0, 42),
      id: targetAlbumId.substr(42)
    }
    Loader.fetchOne(decodedAlbumId.address)
    .then((result)=>{
      vnode.state.targetAlbum = result.db.getAlbumById(targetAlbumId);
      if (vnode.state.targetAlbum._photosCid != null) {
        Loader.fetchCid(decodedAlbumId.address, vnode.state.targetAlbum._photosCid.toString())
        .then((result)=>{
          Loader.fetchOne(decodedAlbumId.address)
          .then((result)=>{
            vnode.state.targetAlbum = result.db.getAlbumById(targetAlbumId);
            m.redraw()
          })
        })
      }
      m.redraw();
      if (vnode.state.targetAlbum.mapId != null) {
        loadMapData(vnode, decodedAlbumId.address, vnode.state.targetAlbum.mapId);
      }
    })
  },

  onupdate: (vnode)=>{
    if (vnode.state.targetAlbum.mapId != null && !vnode.state.mapActivated) {
      vnode.state.mapActivated = true;
      MapState.init(document.getElementById('mymap'));
      MapState.invalidateSize();
    }
    if (vnode.state.mapActivated) {
      MapState.invalidateSize();
    }
  },

  view: function(vnode) {

    let editButton;
    if (vnode.state.targetAlbum.owner == libwip2p.Account.getWallet().address.toLowerCase()) {
      editButton = m("button.btn btn-primary float-end", {onclick: function(){
        m.route.set("/editalbum/" + vnode.state.targetAlbumId);
      }}, m("i.fa fa-edit"), " Edit")
    }

    return m("div.container",
      m("div.row mb-3",
        m("div.col-12",
          m("h5.text-center", "View album"),
          m("div", m("strong", "Title: "), vnode.state.targetAlbum.title),
          m("div", m("strong", "Description: "), vnode.state.targetAlbum.description),
          m("div",
            m("strong", "Date: "), vnode.state.targetAlbum.date,
            editButton
          )
        )
      ),
      m("div.row.mb-3",
        (function(){
          if (vnode.state.targetAlbum.mapId != null) {
            return m("div.col-12 col-lg-6 mb-3",
              m("div", {id:"mymap", style:"border:1px solid;position:relative;height:100%;min-height:300px;width:100%;"})
            )
          }
        })(),
        (function(){
          let photos = [];
          if (vnode.state.targetAlbum.photos == null) {
            return;
          }
          for (var a = 0; a < vnode.state.targetAlbum.photos.length; a++) {
            let photo = vnode.state.targetAlbum.photos[a];
            if (photo == null) {
              photos.push(m("div.col-12 col-lg-6 mb-3", {style:"height:250px;"},
                m("div", {style:"padding-top:90px;text-align:center;width:100%;background:#dddddd;height:100%;color:#999999;"},
                  m("i.fa fa-face-grimace", {style:"color:#999999;font-size:30px;width:100%;"}),
                  "Image not found"
                )
              ))
              continue;
            }
            let desc;
            if (photo.description != null) {
              desc = photo.description;
            }
            photos.push(m("div.col-12 col-lg-6 mb-3",
              m("div",
                m(CidImage, {key: photo.cid.toString(), cid :photo.cid.toString(), resizePortrait: true, onclick: function(){
                  let pm = {view: ()=>m("div", {style:"text-align:center;"}, 
                    m(CidImage, {resizePortrait: true, fullscreen: true, cid :photo.cid.toString()})
                  )}
                  document.getElementById('modalPhotoContent').parentElement.classList.add('modal-xl')
                  document.getElementById('modal').addEventListener('hidden.bs.modal', function(){
                    //document.getElementsByClassName('modal-content')[0].parentElement.classList.remove('modal-xl')
                  })
                  m.mount(document.getElementById('modalPhotoContent'), pm);
                  var myModal = new bootstrap.Modal(document.getElementById("modalPhotoview"));
                  myModal.show();
                  document.getElementsByClassName('modal-backdrop')[0].style.opacity = "0.9";
                }})
              ),
              m("div", m("span", {style:"font-size:12px;font-weight:bold;"}, photo.title), m("span.float-end", {style:"font-size:12px;font-weight:bold;"}, photo.date)),
              desc
            ))
          }
          return photos;
        })()
      )
    );
  }
}
