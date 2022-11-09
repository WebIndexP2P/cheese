'use strict';

define(function() {

  return {
    view: function(vnode) {
      return [
          m("div.modal-header",
            m("h5.modal-title","Peer ID changed"),
            m("button.btn-close", {type:"button", "data-bs-dismiss":"modal"})
          ),
          m("div.modal-body",
              m("p", "The PeerID for this endpoint (", vnode.attrs.endpoint ,") appears to have changed from:"),
              m("p", vnode.attrs.origPeerId),
              m("p", "to"),
              m("p", vnode.attrs.newPeerId),
              m("p",
                "How would you like to proceed? You can ", m("strong", "update"), " your local endpoint to this new PeerID, or you can ",
                m("strong", "remove"), " the endpoint from your peer list. Or you can go to ", m("strong", "settings"), " to fix it manually."
              )
          ),
          m("div.modal-footer",
            m("button.btn btn-outline-primary", {type:"button", "data-bs-dismiss":"modal", onclick:function(e){
              e.preventDefault();
              libwip2p.Peers.updatePeerId(vnode.attrs.endpoint, vnode.attrs.newPeerId);
              libwip2p.Peers.connect();
            }}, "Update"),
            m("button.btn btn-outline-primary", {type:"button", "data-bs-dismiss":"modal", onclick:function(e){
              e.preventDefault();
              libwip2p.Peers.removeByEndpoint(vnode.attrs.endpoint);
              libwip2p.Peers.connect();
            }}, "Remove"),
            m("button.btn btn-outline-primary", {type:"button", "data-bs-dismiss":"modal", onclick:function(e){
              e.preventDefault();
              m.route.set("/settings");
            }}, "Settings")
          )
      ]
    }
  }

})
