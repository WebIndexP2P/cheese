import CidImage from './cidimage.js'
import EditPhotoModal from './editphotomodal.js'

export default {

  view: (vnode)=>{

    let photos = [];
    let hr = null;
    if (Array.isArray(vnode.attrs.draftAlbum.photos)) {
      for (let a = 0; a < vnode.attrs.draftAlbum.photos.length; a++) {
        if (vnode.attrs.draftAlbum.photos[a]._upload) {
          continue;
        }
        hr = m("hr");
        let photo = vnode.attrs.draftAlbum.photos[a];
        if (photo == null) {
          photos.push(m("div.col-12 col-lg-6 mb-3", {style:"height:250px;"},
            m("div", {style:"padding-top:90px;text-align:center;width:100%;background:#dddddd;height:100%;color:#999999;"},
              m("i.fa fa-face-grimace", {style:"color:#999999;font-size:30px;width:100%;"}),
              "Image not found"
            )
          ))
          continue;
        }
        photos.push(m("div.col-12 col-lg-4 mb-3",
          m(CidImage, {key: photo.cid.toString(), cid :photo.cid.toString(), normalizeHeight: true, onclick: function(){
            let pm = {view: ()=>m(EditPhotoModal, {ondelete: ()=>{
              vnode.attrs.draftAlbum.deletePhoto(a);
            }, photo: photo})}
            m.mount(document.getElementsByClassName('modal-content')[0], pm);
            var myModal = new bootstrap.Modal(document.getElementById('modal'));
            myModal.show();
          }})
        ))
      }
    }

    return m("div.row", photos, hr);
  }

}
