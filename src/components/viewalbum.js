'use strict';

define([
  'lib/loader',
  'lib/cheesedb',
  'components/cidimage'
], (
  Loader,
  CheeseDb,
  CidImage
)=>{

  return {
    oninit: function(vnode) {
      vnode.state.targetAlbum = new CheeseDb.Album();

      let targetAlbumId = m.route.param().albumid;
      vnode.state.targetAlbumId = targetAlbumId;
      let decodedAlbumId = {
        address: targetAlbumId.substr(0, 42),
        id: targetAlbumId.substr(42)
      }
      Loader.fetchOne(decodedAlbumId.address)
      .then((result)=>{
        vnode.state.targetAlbum = result.db.getAlbumById(targetAlbumId);
        m.redraw();
      })
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
            let photos = [];
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
                m(CidImage, {cid :photo.cid.toString(), enableFullzoom: true, onclick: function(){
                  let pm = {view: ()=>m(CidImage, {fullSize: true, cid :photo.cid.toString()})}
                  document.getElementsByClassName('modal-content')[0].parentElement.classList.add('modal-xl')
                  document.getElementById('modal').addEventListener('hidden.bs.modal', function(){
                    document.getElementsByClassName('modal-content')[0].parentElement.classList.remove('modal-xl')
                  })
                  m.mount(document.getElementsByClassName('modal-content')[0], pm);
                  var myModal = new bootstrap.Modal(document.getElementById('modal'));
                  myModal.show();
                  document.getElementsByClassName('modal-backdrop')[0].style.opacity = "0.9";
                }}),
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

})
