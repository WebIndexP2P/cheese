'use strict';

define([
  'components/publicmodemodal',
  'lib/loader'
],(
  PublicModeModal,
  Loader
)=>{

  return function() {

    let peer = libwip2p.Peers.getActive()
    Loader.fetchOne(peer.rootAccount, {pathOverride: "/wip2p/public"})
    .then((result)=>{
      if (result.hasOwnProperty('content')) {
        // content not actually built yet
        if (result.content != null || result.content == true) {
          m.mount(document.getElementsByClassName('modal-content')[0], PublicModeModal);
          var myModal = new bootstrap.Modal(document.getElementById('modal'));
          myModal.show();
        }
      } else {
        if (result.ls.rootNode.content.hasOwnProperty("wip2p") && result.ls.rootNode.content.wip2p.hasOwnProperty("public")) {
          if (result.ls.rootNode.content.wip2p.public) {
            m.mount(document.getElementsByClassName('modal-content')[0], PublicModeModal);
            var myModal = new bootstrap.Modal(document.getElementById('modal'));
            myModal.show();
          }
        }
      }      
    })

    /*
    .catch((err)=>{
      console.log(err)
      if (err == 'account has not posted anything') {
      } else if (err == "unauthorized"){
        m.route.set("/settings?tab=invites");
      } else {
      }
    })
    */
  };

})
