'use strict';

define(function(){

  var onGotoInvitesClick = function(e) {
    e.preventDefault();

    var myModal = bootstrap.Modal.getInstance(document.getElementById('modal'));
    myModal.hide();
    m.route.set("/settings", {tab:"invites"});
  }

  return {

    view: function(vnode) {
      return [
          m("div.modal-header",
          m("h5.modal-title", "Invite required"),
          m("button.btn-close", {type:"button", "data-bs-dismiss":"modal"})
          ),
          m("div.modal-body",
            m("p", "No invite has been found for your account."),
            m("p", "Go to Settings->Invites or click the button below to manage your invites.")
          ),
          m("div.modal-footer",
            m("button.btn btn-primary", {type:"button", onclick: onGotoInvitesClick}, "Go to Invites"),
            m("button.btn btn-secondary", {type:"button", "data-bs-dismiss":"modal"}, "Ignore")
          )
      ]
    }
  }

})
