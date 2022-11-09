'use strict';

define([
  'lib/utils'
], function(Utils){

  var onCycleClick = function(vnode, e) {
    e.preventDefault();

    if (vnode.state.displayMode == 'unix') {
      vnode.state.displayMode = 'date';
    } else if (vnode.state.displayMode == 'date') {
      vnode.state.displayMode = 'delta';
    } else {
      vnode.state.displayMode = 'unix'
    }
    return false;
  }

  var renderTimestamp = function(vnode) {
    if (vnode.state.displayMode == 'unix') {
      return vnode.attrs.timestamp;
    } else if (vnode.state.displayMode == 'date') {
      var date = new Date(vnode.attrs.timestamp * 1000)
      return Utils.dateSimpleFormat(date);
    } else {
      var dateNow = new Date()
      var dateThen = new Date(vnode.attrs.timestamp * 1000)
      return Utils.secondsToHuman((dateNow - dateThen) / 1000) + " ago";
    }
  }

  return {
    oninit: function(vnode) {
      vnode.state.displayMode = "unix";
    },

    view: function(vnode){
      return m("span",
        renderTimestamp(vnode),
        m("a", {href:"#", onclick: onCycleClick.bind(null, vnode), style:"margin-left:5px;font-size:12px;"}, m("i.fa.fa-sync"))
      )
    }
  }
})
