import PageLayout from './components/layout/pagelayout.js'
import MithrilNav from './lib/mithrilnav.js'
import Version from './lib/version.js'
import {SettingsVnode} from 'wip2p-settings'
import PageMain from './components/main.js'
import NoInviteModal from './components/noinvitemodal.js'
import DisconnectModal from './components/disconnectmodal.js'
import PageEditAlbum from './components/editalbum.js'
import PageViewAlbum from './components/viewalbum.js'
import CheeseSettings from './components/cheesesettings.js'
import CheeseDb from './lib/cheesedb.js'
import CheeseState from './lib/cheesestate.js'
import PublicCheck from './lib/publiccheck.js'
import * as libwip2p from 'libwip2p'
import * as libipfs from 'libipfs'

const Loader = libwip2p.Loader;

MithrilNav.overrideMithrilRouting();
MithrilNav.restoreScrollPositions();

Loader.setup(CheeseDb, CheeseState);

window.Buffer = libipfs.buffer.Buffer;
window.Cid = libipfs.multiformats.CID;

window.logWebsocket = localStorage.getItem('logWebsocket');
if (window.logWebsocket == "true")
  window.logWebsocket = true;
else
  window.logWebsocket = false;

window.showDebugControls = localStorage.getItem('showDebugControls');
if (window.showDebugControls == "true")
  window.showDebugControls = true;
else
  window.showDebugControls = false;

window.showColorBackgrounds = localStorage.getItem('showColorBackgrounds');
if (window.showColorBackgrounds == "true")
  window.showColorBackgrounds = true;
else
  window.showColorBackgrounds = false;

libwip2p.useLocalStorage(true);
libwip2p.Account.initWallet();

libwip2p.Peers.events.on("connstatechange", function(eventData){
  let state = eventData[0]
  let manualDisconnect = eventData[1]

  //console.log(state);
  if (state == 3) {
    var myModal = bootstrap.Modal.getInstance(document.getElementById('modal'));
    if (myModal != null) {
      myModal.hide();
    }
    //console.log('show redeem invite screen');
    m.mount(document.getElementsByClassName('modal-content')[0], NoInviteModal);
    var myModal = new bootstrap.Modal(document.getElementById('modal'));
    myModal.show();
  }

  if (state == 0 && !manualDisconnect) {
    var myModal = bootstrap.Modal.getInstance(document.getElementById('modal'));
    if (myModal != null) {
      myModal.hide();
    }

    m.mount(document.getElementsByClassName('modal-content')[0], DisconnectModal);
    var myModal = new bootstrap.Modal(document.getElementById('modal'));
    myModal.show();
  }
})

libwip2p.Peers.init(null, libwip2p.Account.getWallet)
.then(()=>{
  if (window.location.hash.startsWith("#!/boot/")) {
    var bootPeer = window.location.hash.substring(8);
    return libwip2p.Peers.addPeer(bootPeer);
  } else {
    if (libwip2p.Peers.getPeers().length == 0) {
      return libwip2p.Peers.addPeer("wss://tulip.wip2p.com");
    }
  }
})
.then(()=>{
  // make sure we always subscribe to new bundle events
  libwip2p.Peers.events.on('peerconnected', function(){    
    libwip2p.Peers.getActivePeerSession()
    .then((ps)=>{
      ps.onBundleReceived = function(bundle){
        console.log('new bundle received')
        Loader.fetchOne(bundle.account, {replaceCache: true})
        .then(()=>m.redraw())
      }
    })

    //load root to see if public
    PublicCheck();
  })

  // load the UI
  var a = document.getElementById('app');

  let settingsConfig = {
    hideEth: true,
    hideIpfs: true,
    name:"Cheese",
    version: "v" + Version,
    description: m("span", " is a peer-to-peer photo sharing app. All data is stored in ", m("a[href='http://wip2p.com']", {target:"_blank"}, "WebIndexP2P"), " nodes run by volunteers."),
    icon:"assets/cheese_192_round.png",
    additionalTabs: [{key:"cheese", name:"Cheese", vnode: CheeseSettings}]
  }

  m.route(a, "/", {
    "/": {render: function() {
      return m(PageLayout, {}, m(PageMain))
    }},
    "/page/:page": {render: function() {
      return m(PageLayout, {}, m(PageMain))
    }},
    "/editalbum": {render: function() {
      return m(PageLayout, {}, m(PageEditAlbum))
    }},
    "/editalbum/:albumid": {render: function() {
      return m(PageLayout, {}, m(PageEditAlbum, {key: m.route.param("albumid")}))
    }},
    "/viewalbum/:albumid": {render: function() {
      return m(PageLayout, {}, m(PageViewAlbum, {key: m.route.param("albumid")}))
    }},
    "/settings": {render: function() {
        return m(PageLayout, {}, m(SettingsVnode, settingsConfig))
    }},
    "/settings/:tab": {render: function() {
      return m(PageLayout, {}, m(SettingsVnode, settingsConfig))
    }},
  })

  document.getElementsByClassName("loader")[0].classList.add('fadeout');  
})
