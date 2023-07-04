import PublicModeModal from '../components/publicmodemodal.js'
import * as libwip2p from 'libwip2p'

const Loader = libwip2p.Loader;

export default function() {

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

};
