'use strict';

define(()=>{

  var publishers = {} // []address
  var albums = [] // []albums, sorted by album date

  var process = function(address, cheeseDb) {
    console.log('process ' + address)
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

  var getAlbumsPaged = function(pageOffset, numPerPage) {
    return albums;
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
