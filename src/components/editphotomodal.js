export default {

  view: function(vnode) {
    return [
        m("div.modal-header",
        m("h5.modal-title", "Edit photo"),
        m("button.btn-close", {type:"button", "data-bs-dismiss":"modal"})
        ),
        m("div.modal-body",
          //m("div.col-12 col-sm-12 col-md-4",
            m("div.mb-3",
              m("label.form-label", "Title"),
              m("input.form-control", {"type":"text", value: vnode.attrs.photo.title, onchange: function(e){
                vnode.attrs.photo.title = e.target.value;
              }})
            ),
            m("div.mb-3",
              m("label.form-label", "Description"),
              m("textarea.form-control", {"rows": 3, value: vnode.attrs.photo.description, onchange: function(e){
                vnode.attrs.photo.description = e.target.value;
              }})
            ),
            m("div.mb-3",
              m("label.form-label", "Date"),
              m("input.form-control", {"type":"date", value: vnode.attrs.photo.date, onchange: function(e){
                vnode.attrs.photo.date = e.target.value;
              }})
            )
          //)
        ),
        m("div.modal-footer",
          m("button.btn btn-danger", {style:"position:absolute;left:10px;", type:"button", "data-bs-dismiss":"modal", onclick: vnode.attrs.ondelete}, m("i.fa fa-trash"), " Delete"),
          m("button.btn btn-primary", {type:"button", "data-bs-dismiss":"modal"}, m("i.fa fa-images"), " Back to album")
        )
    ]
  }
}
