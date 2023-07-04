var overrideMithrilRouting = function() {
  var setOrig = m.route.set;
  m.route.set = function(path, data, options){
    setOrig(path, data, options);
    window.scrollTo({ top:0, left:0, behavior: "instant"});
  }
}

var restoreScrollPositions = function() {
    window.pageScrollPositions = {};

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    window.addEventListener('scroll', function() {
      window.pageScrollPositions[window.location.hash] = window.pageYOffset || document.documentElement.scrollTop;
    })

    window.addEventListener('popstate', (event) => {
      var scrollPos = window.pageScrollPositions[event.target.location.hash];
      if (scrollPos > 0) {
        setTimeout(function(){
          window.scrollTo(0, scrollPos);
        }, 100);
      }
    })
}

export default {
    overrideMithrilRouting: overrideMithrilRouting,
    restoreScrollPositions: restoreScrollPositions
}
