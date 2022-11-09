'use strict';

define(function(){

  return {

    view: function(vnode) {
      return [
          m("div.modal-header",
            m("h5.modal-title", "Warning - Public network"),
            m("button.btn-close", {type:"button", "data-bs-dismiss":"modal"})
          ),
          m("div.modal-body",
            m("p", m("i.fa-solid fa-triangle-exclamation", {style:"color:#fd7e14;font-size:25px;"}), " You are connected to a public network. Any photos or data published here will be visible to anyone."),
          ),
          m("div.modal-footer",
            m("button.btn btn-secondary", {type:"button", "data-bs-dismiss":"modal"}, "Dismiss")
          )
      ]
    }
  }

})
