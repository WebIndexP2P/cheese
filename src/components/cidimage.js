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

    onupdate: (vnode)=>{
      if (vnode.attrs.resizePortrait) {
        vnode.instance.dom.classList.remove('landscape');
        vnode.instance.dom.classList.remove('portrait');

        //console.log(vnode.instance.dom.clientWidth/vnode.instance.dom.clientHeight)
        if (vnode.instance.dom.clientWidth/vnode.instance.dom.clientHeight > 1) {
          vnode.instance.dom.classList.add('landscape');
        } else {
          vnode.instance.dom.classList.add('portrait');
          if (vnode.attrs.fullscreen && window.innerWidth >= 576) {
            vnode.instance.dom.style.height = "90vh"
          }
        }
      }      
    },

    view: (vnode)=>{

      if (vnode.state.error) {
        if (vnode.attrs.normalizeHeight) {
          return m("div", {style:"height:200px;", onclick: vnode.attrs.onclick},
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
        style:"cursor:pointer;",
        cid: vnode.attrs.cid
      }

      if (!vnode.attrs.resizePortrait) {
        props.width = "100%"
      }

      if (vnode.attrs.onclick) {
        props.onclick = vnode.attrs.onclick;
      }

      if (vnode.attrs.normalizeHeight) {
        props.height = "100%";
        props.style += "object-fit: cover;max-height:200px;";
      }

      if (vnode.attrs.isGallery) {
        props.style = "height:200px;width:100%;object-fit:cover;"
      }

      props.onload = ()=>{
        //console.log('loaded ' + vnode.attrs.cid)
      }

      return m("img", props);
    }
  }
})
