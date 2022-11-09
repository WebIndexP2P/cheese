'use strict';

define([
  'components/publicmodemodal'
],(
  PublicModeModal
)=>{

  return function() {
    new Promise((resolve, reject)=>{
      if (libwip2p.Peers.getConnState() != 4) {
        libwip2p.Peers.events.on("connstatechange", function(state){
          if (state == 4) {
            resolve();
          }
          if (state == 3) {
            reject('peer connection unauthorized');
          }
        })
      } else {
        resolve();
      }
    })
    .then(()=>{
      let peer = libwip2p.Peers.getActive()
      console.log('fetching from network - ' + peer.rootAccount);
      var bs = new libwip2p.BranchSet();
      return bs.FetchByAccount(peer.rootAccount, "/wip2p")
    })
    .then((result)=>{
      if (result == null) {
        // it means no /wip2p found, which means its private
        return;
      }
      if (result.hasOwnProperty('public') && result.public) {
        m.mount(document.getElementsByClassName('modal-content')[0], PublicModeModal);
        var myModal = new bootstrap.Modal(document.getElementById('modal'));
        myModal.show();
      }
    })
    .catch((err)=>{
      if (err == 'account has not posted anything') {
        console.log(err)
      } else {
        console.error(err)
      }
    })
  };

})
