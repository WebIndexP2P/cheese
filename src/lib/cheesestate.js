'use strict';

define([
  'lib/loader',
], (
  Loader
)=>{

  var publishers = {} // {}address
  var albums = [] // []albums, sorted by album date

  var linkedDocRequests = {} // {account: {cid: true}}

  var process = function(address, cheeseDb) {
    //console.log('process ' + address)
    address = address.toLowerCase();

    if (publishers.hasOwnProperty(address)) {
      if (cheeseDb.albums.length == 0) {
        delete publishers[address];
      }
    } else {
      if (cheeseDb.albums.length > 0) {
        publishers[address] = true;
      }
    }

    // delete all albums for this address
    let updatedAlbums = []
    for (var a = 0; a < albums.length; a++) {
      //console.log(albums[a].owner, address)
      if (albums[a].owner != address) {
        updatedAlbums.push(albums[a]);
      }
    }
    albums = updatedAlbums;
    updatedAlbums = null;

    // add back new albums
    for (var a = 0; a < cheeseDb.albums.length; a++) {
      if (cheeseDb.albums[a].sortDate == null) {
        let d = new Date(cheeseDb.albums[a].date);
        cheeseDb.albums[a].sortDate = d.getTime();
      }
      albums.push(cheeseDb.albums[a]);
    }

    // sort albums chronological
    albums = albums.sort((a, b)=>b.sortDate - a.sortDate)

    let detectedAccounts = []
    return detectedAccounts;
  }

  var getAlbumsPaged = function(page, numPerPage) {
    let offset = (page - 1) * numPerPage
    let tmpAlbums = albums.slice(offset, offset + numPerPage);

    // attempt to load any linked photocollection docs
    for (let a = 0; a < tmpAlbums.length; a++) {
      if (tmpAlbums[a]._photosCid != null && tmpAlbums[a].photos == null) {

        let tmpCid = tmpAlbums[a]._photosCid.toString();
        //console.log(tmpAlbums[a])
        let bFound = false;
        if (linkedDocRequests.hasOwnProperty(tmpAlbums[a].owner)) {
          if (linkedDocRequests[tmpAlbums[a].owner].hasOwnProperty(tmpCid) == false) {
            linkedDocRequests[tmpAlbums[a].owner][tmpCid] = true;
            bFound = true;
          }
        } else {
          linkedDocRequests[tmpAlbums[a].owner] = {}
          linkedDocRequests[tmpAlbums[a].owner][tmpCid] = true;
          bFound = true;
        }
        if (bFound) {
          Loader.fetchCid(tmpAlbums[a].owner, tmpCid)
          .then((result)=>{
            //console.log(result)
            m.redraw()
          })
        }
      }
    }

    let pages = Math.ceil(albums.length / numPerPage)
    return {albums: tmpAlbums, pages: pages};
  }

  var reset = function() {
    publishers = {}
    albums = []
  }

  return {
    process: process,
    reset: reset,
    getAlbumsPaged: getAlbumsPaged
  };

})
