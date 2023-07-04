var onReconnectClick = function(e) {
  e.preventDefault();

  libwip2p.Peers.connect();

  var myModal = bootstrap.Modal.getInstance(document.getElementById('modal'));
  myModal.hide();
}

export default {

  view: function(vnode) {
    return [
        m("div.modal-header",
        m("h5.modal-title", "Connection lost"),
        m("button.btn-close", {type:"button", "data-bs-dismiss":"modal"})
        ),
        m("div.modal-body",
          m("p", "The websocket connection to the wip2p peer has disconnected."),
        ),
        m("div.modal-footer",
          m("button.btn btn-primary", {type:"button", onclick: onReconnectClick}, "Reconnect"),
          m("button.btn btn-secondary", {type:"button", "data-bs-dismiss":"modal"}, "Ignore")
        )
    ]
  }
}