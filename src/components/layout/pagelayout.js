import Header from './header.js'

export default {

  view: function(vnode) {
    return [
      m(Header),
      m("div.container-fluid", {style:"padding-left:0px;padding-right:0px;padding-top:0px;"},
        vnode.children
      )
    ]
  }
}
