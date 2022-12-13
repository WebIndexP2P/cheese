'use strict';

define([
  'lib/photoqueue'
],(
  PhotoQueue
)=>{

  return {
    oninit: (vnode)=>{

      vnode.state.imageSrc = "assets/cheese_192_square.png";
      vnode.state.error = false;

      if (vnode.attrs.cid != null) {
        PhotoQueue.fetch(vnode.attrs.cid.toString())
        .then((imageData)=>{
          if (imageData != null) {
            vnode.state.imageSrc = "data:image;base64," + imageData.toString('base64');
          } else {
            vnode.state.error = true;
          }
          m.redraw();
        })
      }
    },

    view: (vnode)=>{

      if (vnode.state.error) {
        if (vnode.attrs.normalizeHeight) {
          return m("div", {style:"height:100%;", onclick: vnode.attrs.onclick},
            m("div", {style:"padding-top:50px;text-align:center;width:100%;background:#dddddd;height:100%;color:#999999;"},
              m("i.fa fa-face-grimace", {style:"color:#999999;font-size:30px;width:100%;"}),
              "Image not found"
            )
          )
        } else {
          return m("div", {style:"height:250px;", onclick: vnode.attrs.onclick},
            m("div", {style:"padding-top:90px;text-align:center;width:100%;background:#dddddd;height:100%;color:#999999;"},
              m("i.fa fa-face-grimace", {style:"color:#999999;font-size:30px;width:100%;"}),
              "Image not found"
            )
          )
        }

      }

      let props = {
        src: vnode.state.imageSrc,
        class: vnode.attrs.class,
        width:"100%",
        style:"cursor:pointer;"
      }

      if (vnode.attrs.onclick) {
        props.onclick = vnode.attrs.onclick;
      }

      if (vnode.attrs.normalizeHeight) {
        props.height = "100%";
        props.style += "object-fit: cover;max-height:200px;";
      }

      if (vnode.attrs.enableFullzoom) {
        if ('ontouchstart' in window) {
          props.onclick = null;
          props.ontouchstart = function(e) {
            window.pendingTouchEvent = new Date();
          }
          props.ontouchend = function(e){
            if (document.fullscreenElement != null) {
              document.webkitExitFullscreen();
              return;
            }
            let dif = new Date() - window.pendingTouchEvent;
            if (dif < 50) {
              e.srcElement.webkitRequestFullscreen();
            }
          }
        } else {
          props.onclick = vnode.attrs.onclick;
        }
      }



      if (vnode.attrs.fullSize) {
        props.height = "100%";
      }

      return m("img", props);
    }
  }
})
