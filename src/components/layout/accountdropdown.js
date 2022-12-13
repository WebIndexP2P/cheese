'use strict'

define([
    'gx/ethereum-blockies/blockies.min',
    'lib/cheesestate',
    'lib/loader'
], function(
    MakeBlockies,
    CheeseState,
    Loader
) {

    var showAccount = function(vnode, e) {

        e.preventDefault();

        var modalContent = {view: function(){
            return [
                m("div.modal-header",
                  m("h5.modal-title","Show account"),
                  m("button.btn-close", {type:"button", "data-bs-dismiss":"modal"})
                ),
                m("div.modal-body",
                    m("p", m("div", {style:"font-weight: bold;"}, "Your account public address is:"),
                        m("div", {style:'word-wrap: break-word;font-family:"Courier New", Courier, monospace;'}, vnode.state.account)
                    )
                ),
                m("div.modal-footer",
                m("button.btn btn-secondary", {type:"button", "data-bs-dismiss":"modal"},"Close")
                )
            ]
        }}

        m.mount(document.getElementsByClassName('modal-content')[0], modalContent);
        var myModal = new bootstrap.Modal(document.getElementById('modal'));
        myModal.show();
    }

    var showSeed = function(e) {

        e.preventDefault();

        let seedPhrase;
        if (libwip2p.Account.getWallet().mnemonic == null) {
          seedPhrase = ethers.utils.entropyToMnemonic(libwip2p.Account.getWallet().privateKey);
        } else {
          seedPhrase = libwip2p.Account.getWallet().mnemonic.phrase;
        }

        var modalContent = {view: function(){
            return [
                m("div.modal-header",
                m("h5.modal-title","Account seed phrase"),
                    m("button.btn-close", {type:"button", "data-bs-dismiss":"modal"})
                ),
                m("div.modal-body",
                    m("div.alert alert-primary", {style:'font-family:"Courier New", Courier, monospace;'}, seedPhrase)
                ),
                m("div.modal-footer",
                    m("button.btn btn-secondary", {type:"button", "data-bs-dismiss":"modal"}, "Close")
                )
            ]
        }}

        m.mount(document.getElementsByClassName('modal-content')[0], modalContent);
        var myModal = new bootstrap.Modal(document.getElementById('modal'));
        myModal.show();
    }

    var showWarning = function(vnode, nextStep, e) {

        e.preventDefault();

        var myModal = new bootstrap.Modal(document.getElementById('modal'));

        var proceedFunction = function() {
            if (nextStep == 'new') {
                libwip2p.Account.newWallet()
                .then(()=>{
                  vnode.state.account = libwip2p.Account.getWallet().address;
                  CheeseState.reset();
                  Loader.fetchSequential();
                  m.route.set("/");
                  m.redraw();
                })
            } else if (nextStep == 'restore') {
                document.getElementById('modal').addEventListener('hidden.bs.modal', function(e) {
                    showRestoreAccount(vnode);
                }, {once: true})
            }
            myModal.hide();
        }

        var modalContent = {view: function(){
            return [
                m("div.modal-header",
                m("h5.modal-title","Account warning"),
                    m("button.btn-close", {type:"button", "data-bs-dismiss":"modal"})
                ),
                m("div.modal-body",
                    m("p","Your account is only stored in your browser, no one else can recover it once its gone except you. If you wish to use the existing \
                    account at some time in the future, please click cancel and then show the seed phrase and write it down somewhere safe."),
                    m("p","If you have already written down the seed phrase or do not intend to use this account again then click \"Proceed\" to replace it.")
                ),
                m("div.modal-footer",
                    m("button.btn btn-primary", {type:"button", onclick: proceedFunction}, "Proceed"),
                    m("button.btn btn-secondary", {type:"button", "data-bs-dismiss":"modal"},"Cancel")
                )
            ]
        }}

        m.mount(document.getElementsByClassName('modal-content')[0], modalContent);
        myModal.show();
    }

    var showRestoreAccount = function(vnode) {

        var modalContent = {view: function(){
            return [
                m("div.modal-header",
                m("h5.modal-title","Account restore"),
                    m("button.btn-close", {type:"button", "data-bs-dismiss":"modal"})
                ),
                m("div.modal-body",
                    m("form",
                        m("div.form-group",
                            m("label", {for:"seedTextarea"}, "Seed phrase"),
                            m("textarea.form-control", {id:"seedTextarea", rows:"3"})
                        )
                    )
                ),
                m("div.modal-footer",
                    m("button.btn btn-primary", {type:"button", onclick: doRestoreAccount.bind(this, vnode)}, "Restore"),
                    m("button.btn btn-secondary", {type:"button", "data-bs-dismiss":"modal"},"Cancel")
                )
            ]
        }}

        m.mount(document.getElementsByClassName('modal-content')[0], modalContent);
        var myModal = new bootstrap.Modal(document.getElementById('modal'));
        myModal.show();
        document.getElementById('seedTextarea').focus();
    }

    var doRestoreAccount = function(vnode) {

      var seed = document.getElementById('seedTextarea').value;
      var bSuccess = libwip2p.Account.restoreWallet(seed, false);

      if (bSuccess) {
        vnode.state.account = libwip2p.Account.getWallet().address;
        var myModal = bootstrap.Modal.getInstance(document.getElementById('modal'));
        myModal.hide();
        CheeseState.reset();
        libwip2p.Peers.getActivePeerSession()
        .then((session)=>{
          session.disconnect();
          return libwip2p.Peers.connect();
        })
        .then(()=>{
          return Loader.fetchOne(vnode.state.account)
        })
        .catch((err)=>{})
        .then((result)=>{
            Loader.fetchSequential();
            m.route.set("/");
            m.redraw();
        })
      } else {
        document.getElementById('seedTextarea').classList.add('is-invalid');
      }
    }

    return {
        oninit: function(vnode) {
            vnode.state.account = libwip2p.Account.getWallet().address;
        },

        view: function(vnode) {
            return m("div.btn-group",
                m("a", {href:"#", "data-bs-toggle":"dropdown", style:"outline:none;"},
                    m("img", {src: MakeBlockies(vnode.state.account), style:"height:40px;width:40px;border-radius:15%;"})
                ),
                m("div.dropdown-menu dropdown-menu-end",
                    m("a.dropdown-item", {href:"#", onclick: showAccount.bind(this, vnode)}, m("i.fas fa-eye", {style:"width:25px;"}), "Show account"),
                    m("a.dropdown-item", {href:"#", onclick: showSeed}, m("i.fas fa-key", {style:"width:25px;"}), "Show seed"),
                    m("div.dropdown-divider"),
                    m("a.dropdown-item", {href:"#", onclick: showWarning.bind(this, vnode, 'new')}, m("i.fas fa-user-plus", {style:"width:25px;"}), "New account"),
                    m("a.dropdown-item", {href:"#", onclick: showWarning.bind(this, vnode, 'restore')}, m("i.fas fa-user-cog", {style:"width:25px;"}), "Restore account"),
                    m("div.dropdown-divider"),
                    m(m.route.Link, {selector:"a", class:"dropdown-item", href:"/settings"}, m("i.fas fa-cog", {style:"width:25px;"}), "Settings")
                )
            )
        }
    }
})
