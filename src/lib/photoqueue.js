'use strict';

define(function() {

  let isLoading = false;
  let requestQueue = []; // array of [cid,callback]
  let cache = {};
  let UnixFS = window.libipfs.unixfs.UnixFS;

  var fetch = function(cid) {

    if (cid == null || typeof cid == 'object') {
      throw 'invalid cid'
    }

    if (cache.hasOwnProperty(cid)) {
      //console.log('retrieving from cache')
      return new Promise((resolve, reject)=>{
        resolve(cache[cid]);
      });
    }

    if (isLoading) {
      //console.log('queued ' + cid)
      return new Promise((resolve, reject)=>{
        requestQueue.push(function(){
          let fileData = fetchFromNetwork(cid);
          resolve(fileData);
        });
      });
    }

    return fetchFromNetwork(cid);
  }

  var fetchFromNetwork = function(cid) {

    isLoading = true;

    //console.log("fetching " + cid);

    return new Promise((resolve, reject)=>{
      // ensure we have a connection
      if (libwip2p.Peers.getConnState() != 4) {
        // subscribe to connection event
        libwip2p.Peers.events.on("connstatechange", function(state){
          if (state == 4) {
            resolve();
          }
        })
        // maybe a timeout??
      } else {
        resolve();
      }
    })
    .then(libwip2p.Peers.getActivePeerSession)
    .then((session)=>{
      if (session.connState != 4) {
        throw 'not connected';
      }
      return session.sendMessage({method:"doc_get", params:[cid, 'base64']})
    })
    .then((response)=>{
      var buf = Buffer.from(response.result, 'base64');
      var obj = UnixFS.unmarshal(buf);
      var fileData = Buffer.from(obj.data);

      cache[cid.toString()] = fileData;
      if (requestQueue.length > 0) {
        //console.log('processing next in queue')
        let nextQueueItem = requestQueue.shift();
        nextQueueItem();
      } else {
        isLoading = false;
        //console.log(cache)
      }

      return fileData;
    })
    .catch((err)=>{
      console.error(err);
      if (requestQueue.length > 0) {
        let nextQueueItem = requestQueue.shift();
        nextQueueItem();
      } else {
        isLoading = false;
        //console.log(cache)
      }
    })
  }

  return {
    fetch: fetch
  }
})
