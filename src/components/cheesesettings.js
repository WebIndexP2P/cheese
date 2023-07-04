import * as libwip2p from 'libwip2p'

const Loader = libwip2p.Loader;

var fetch = function(vnode){
  var address = libwip2p.Account.getWallet().address;

  Loader.fetchOne(address)
  .then((result)=>{
    vnode.state.myDb = result.db;
    vnode.state.myDb.setOwner(address);

    vnode.state.linkedset = result.ls;
    if (result.ls.rootNode.content.hasOwnProperty('cheese') && 'asCID' in result.ls.rootNode.content.cheese == false) {
      vnode.state.showNamespaceMigration = true;
      m.redraw();
    }
  })
}

var migrateData = function(vnode) {
  vnode.state.migrateStatus = 1;

  vnode.state.myDb.setExportAsLinkedNamespace();
  vnode.state.myDb.flagAllLinkedPhotosForUpload();
  vnode.state.myDb.publish()
  .then((response)=>{
    vnode.state.migrateStatus = 2;
    console.log(response)
    return Loader.fetchOne(libwip2p.Account.getWallet().address, true)
  })
  .then(()=>{
    m.redraw();
  })
  .catch((err)=>{
    console.log(err)
  })
}

export default {

  oninit: (vnode)=>{
    vnode.state.linkedset = new libwip2p.LinkedSet();
    vnode.state.myDb = null;
    vnode.state.showNamespaceMigration = false;

    fetch(vnode);
  },

  view: (vnode)=>{

    let namespaceMigration;
    if (vnode.state.showNamespaceMigration) {
      let status;
      if (vnode.state.migrateStatus == 1) {
        status = m("div.alert alert-warning mt-2", "Migration in progess")
      } else if (vnode.state.migrateStatus == 2) {
        status = m("div.alert alert-success mt-2", "Migration complete")
      }
      namespaceMigration = m("div",
        m("div", m("button.btn btn-outline-primary", {onclick: migrateData.bind(null, vnode)}, m("i.fa fa-folder-tree"), " Migrate app data into linked namespace")),
        status
      )
    } else {
      namespaceMigration = m("div", "No migration required")
    }

    return m(".card bg-light",
      m(".card-body",
        namespaceMigration
      )
    )
  }
}
