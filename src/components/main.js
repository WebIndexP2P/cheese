'use strict';

define([
  'lib/loader',
  'lib/cheesestate',
  'components/cidimage'
],(
  Loader,
  CheeseState,
  CidImage
)=>{

  var renderAlbum = function(vnode, album) {

    //console.log(album)
    //return m("div", album.owner, " ", album.title, album.description, album.date);

    return m("div.col-10 col-sm-6 col-md-4 col-lg-3 d-flex", {key: album.getAlbumId(), style:"margin-bottom:10px;"},
      m("div.card", {style:"width: 100%;cursor:pointer;", onclick:function(){
        m.route.set('/viewalbum/' + album.getAlbumId())
      }},
        m(CidImage, {normalizeHeight: true, class:"card-img-top", cid: album.getCoverImageCid()}),
        m("div.card-body",
          m("h5.card-title", {style:"white-space:nowrap;overflow:hidden;"}, album.title),
          m("p.card-text", {style:"height:50px;overflow:hidden;margin-bottom:0px;"}, album.description),
          m("p.card-text text-end", m("small.text-muted", album.date))
        )
      )
    )
  }

  return {
    oninit: (vnode)=>{

      Loader.subscribeToUpdates(function(account){
        //console.log('loaded ' + account)
        m.redraw();
      })

      //load our doc to see if any albums
      Loader.fetchOne(libwip2p.Account.getWallet().address)
      .catch((err)=>{})
      .then((result)=>{
        // load all most recent accounts
        Loader.fetchSequential();
      })

    },

    view: (vnode)=>{

      return m("div.container",
        m("div.row", {style:"margin-top:10px;margin-bottom:10px;"},
          m("div.col", m("button.btn btn-primary", {onclick: function(){
            m.route.set("/editalbum");
          }}, m("i.fa fa-add"), " New album"))
        ),
        m("div.row justify-content-center",
          CheeseState.getAlbumsPaged(0, 10).map(function(album, idx) {
            return renderAlbum(vnode, album);
          })
        )
      );
    }
  }
})
