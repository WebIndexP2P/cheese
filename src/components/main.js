'use strict';

define([
  'lib/cheesestate',
  'components/cidimage'
],(
  CheeseState,
  CidImage
)=>{

  const Loader = libwip2p.Loader;

  var renderAlbum = function(vnode, album) {

    //return m("div", album.owner, " ", album.title, album.description, album.date);

    return m("div.col-10 col-sm-6 col-md-4 col-lg-3", {key: album.getAlbumId(), style:"margin-bottom:10px;"},
      m(m.route.Link, {selector:"a.nostyle full-width d-flex", href:"/viewalbum/" + album.getAlbumId(), onclick:function(e){
        e.preventDefault();
        m.route.set('/viewalbum/' + album.getAlbumId())
      }},
        m("div.card", {style:"width: 100%;"},
          [ m(CidImage, {key: album.getCoverImageCid(), isGallery: true, normalizeHeight: true, class:"card-img-top", cid: album.getCoverImageCid()}) ],
          m("div.card-body",
            m("h5.card-title", {style:"white-space:nowrap;overflow:hidden;"}, album.title),
            m("p.card-text", {style:"height:50px;overflow:hidden;margin-bottom:0px;"}, album.description),
            m("p.card-text text-end", m("small.text-muted", album.date))
          )
        )
      )
    )
  }

  return {
    oninit: (vnode)=>{
      vnode.state.albumsPerPage = 8;

      vnode.state.page = parseInt(m.route.param().page);
      if (isNaN(vnode.state.page)) {
        vnode.state.page = 1;
      }
      vnode.state.pageResults = CheeseState.getAlbumsPaged(vnode.state.page, vnode.state.albumsPerPage);

      Loader.subscribeToUpdates(function(account){
        console.log('loaded ' + account)
        vnode.state.pageResults = CheeseState.getAlbumsPaged(vnode.state.page, vnode.state.albumsPerPage);
        m.redraw();
      })

      //load our doc to see if any albums
      Loader.fetchOne(libwip2p.Account.getWallet().address)
      .catch((err)=>{})
      .then((result)=>{
        Loader.fetchByIndex("cheese_index")
      })

    },

    onbeforeupdate: (vnode)=>{
      let newPage = parseInt(m.route.param().page);
      if (isNaN(newPage)) {
        newPage = 1;
      }
      vnode.state.page = newPage;
      vnode.state.pageResults = CheeseState.getAlbumsPaged(vnode.state.page, vnode.state.albumsPerPage);
    },

    view: (vnode)=>{

      return m("div.container",
        m("div.row", {style:"margin-top:10px;margin-bottom:10px;"},
          m("div.col", m("button.btn btn-primary", {onclick: function(){
            m.route.set("/editalbum");
          }}, m("i.fa fa-add"), " New album"))
        ),
        m("div.row justify-content-center",
          vnode.state.pageResults.albums.map((album)=>{
            return renderAlbum(vnode, album);
          })
        ),
        m("nav",
          m("ul.pagination",
            m("li.page-item " + ((vnode.state.page==1)?"disabled":""), m(m.route.Link, {href:"/page/" + (vnode.state.page - 1), selector:"a.page-link"}, "Previous")),
            (function(){
              let pageLinks = [];
              for (let a = 0; a < vnode.state.pageResults.pages; a++) {
                let active;
                if (a + 1 == vnode.state.page) {
                  active = "active"
                }
                pageLinks.push(m("li.page-item " + active, m(m.route.Link, {href:"/page/" + (a + 1), selector:"a.page-link"}, a + 1)))
              }
              return pageLinks;
            })(),            
            m("li.page-item " + ((vnode.state.page==vnode.state.pageResults.pages)?"disabled":""), m(m.route.Link, {href:"/page/" + (vnode.state.page + 1), selector:"a.page-link"}, "Next"))
          )
        )
      )
    }
  }
})
