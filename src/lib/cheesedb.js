'use strict';

define(()=>{

  /*****************************************************************************
  **** Photo - accessible at CheeseDb.Album.Photo
  *****************************************************************************/
  var Photo = function() {
    this.cid = null;
    this.buf = null; //base64
    this.title = null;
    this.description = null;
    this.date = null;

    this._upload = false;

    Object.seal(this);
    return this;
  }

  Photo.prototype.export = function() {
    let obj = {}

    if (this.cid == null) {
      throw new Error('cid cannot be null');
    } else {
      obj.c = this.cid;
    }
    if (this.title != null) {
      obj.t = this.title;
    }
    if (this.description != null) {
      obj.d = this.description;
    }
    if (this.date != null) {
      obj.da = this.date;
    }

    return obj;
  }

  Photo.import = function(data) {
    let tmpPhoto = new Photo();

    if (data.c == null) {
      console.log('skipping photo with missing cid')
      return;
    } else {
      tmpPhoto.cid = data.c;
    }
    if (data.t != null) {
      tmpPhoto.title = data.t;
    }
    if (data.d != null) {
      tmpPhoto.description = data.d;
    }
    if (data.da != null) {
      tmpPhoto.date = data.da;
    }
    return tmpPhoto;
  }

  /*****************************************************************************
  **** Album - accessible at CheeseDb.Album
  *****************************************************************************/
  var Album = function() {
    this.id = null;
    this.owner = null;
    this.title = null;
    this.description = null;
    this.date = null;
    this.sortDate = null;
    this.cover = null;
    this.photos = [];
    this.mapId = null;

    this._photosCid = null;
    this._linkedPhotosUpload = false;
    this._linkedPhotosFetched = false;

    Object.seal(this);
    return this;
  }

  Album.prototype.getAlbumId = function() {
    return this.owner + this.id;
  }

  Album.prototype.addPhotoForUpload = function(photoCidAndBuf) {
    if (photoCidAndBuf.cid == null || photoCidAndBuf.buf == null) {
      throw new Error("invalid photo data");
    }

    let p = new Photo();
    p.cid = photoCidAndBuf.cid;
    p.buf = photoCidAndBuf.buf;
    p._upload = true;
    if (photoCidAndBuf.title != null) {
      p.title = photoCidAndBuf.title;
      let pos = p.title.search(/_[0-9]{8}_/)
      if (pos >= 0) {
        pos++;
      } else {
        pos = p.title.search(/^[0-9]{8}_/)
      }
      if (pos >= 0) {
        p.date = p.title.substr(pos,4) + "-" + p.title.substr(pos+4,2) + "-" + p.title.substr(pos+6,2)
        if (this.date == null) {
          this.date = p.date;
          m.redraw();
        }
      }
    }

    this.photos.push(p);

    let photoCollection = [];
    for (var a = 0; a < this.photos.length; a++) {
      photoCollection.push(this.photos[a].export())
    }
    let ls = new libwip2p.LinkedSet();
    ls.update("/", photoCollection)
    this._photosCid = ls.rootNode.cid;
    this._linkedPhotosUpload = true;
  }

  Album.prototype.getCoverImageCid = function() {
    if (this.photos != null && this.photos.length > 0 && this.photos[0] != null && this.photos[0].hasOwnProperty('cid')) {
      return this.photos[0].cid;
    } else {
      return null;
    }
  }

  Album.prototype.deletePhoto = function(idx) {
    if (idx < 0 || idx > this.photos.length - 1) {
      throw 'invalid photo index';
    }
    this.photos.splice(idx, 1);
  }

  Album.prototype.deletePhotoByName = function(name) {
    for (var a = 0; a < this.photos.length; a++) {
      if (this.photos[a].title == name) {
        this.photos.splice(a, 1);
        return;
      }
    }
    throw 'photo not found'
  }

  Album.prototype.getPendingPhotosToUpload = function() {
    let pending = [];
    for (var a = 0; a < this.photos.length; a++) {
      if (this.photos[a]._upload) {
        pending.push(this.photos[a].buf);
      }
    }
    return pending;
  }

  Album.prototype.setMapId = function(id) {
    this.mapId = id;
  }

  Album.prototype.export = function() {
    let obj = {}

    if (this.id == null) {
      throw new Error('id is missing!')
    }
    obj.i = this.id;

    if (this.title != null) {
      obj.t = this.title;
    }
    if (this.description != null) {
      obj.d = this.description;
    }
    if (this.date != null) {
      obj.da = this.date;
    }
    if (this.cover != null) {
      obj.c = this.cover;
    }

    if (this._photosCid != null) {
      obj.p = this._photosCid;
    } else {
      if (this.photos.length > 0) {
        obj.p = [];
        for (var a = 0; a < this.photos.length; a++) {
          obj.p[a] = this.photos[a].export();
        }
      }
    }

    if (this.mapId != null) {
      obj.m = this.mapId;
    }

    return obj;
  }

  Album.prototype.exportPhotosAsEncodedCbor = function() {
    let tmpPhotos = [];
    for (var a = 0; a < this.photos.length; a++) {
      tmpPhotos.push(this.photos[a].export());
    }
    let ls = new libwip2p.LinkedSet();
    ls.update("/", tmpPhotos)
    return ls.rootNode.docBytes;
  }

  Album.import = function(data, dataResolved) {

    //console.log('Album->import()')

    let tmpAlbum = new Album();

    if (data.i == null) {
      console.log('skipping album without id');
      return;
    }
    tmpAlbum.id = data.i;
    if (data.t != null) {
      tmpAlbum.title = data.t;
    }
    if (data.d != null) {
      tmpAlbum.description = data.d;
    }
    if (data.da != null) {
      tmpAlbum.date = data.da;
      tmpAlbum.sortDate = new Date(tmpAlbum.date).getTime();
    }
    if (data.c != null) {
      tmpAlbum.cover = data.c;
    }
    if (data.hasOwnProperty('p')) {
      if (typeof data.p == 'object') {
        if (data.p[Symbol.toStringTag] == "CID") {
          tmpAlbum._photosCid = data.p;
        }
        
        tmpAlbum.photos = [];
        for (var prop in dataResolved.p) {
          let tmpPhoto = Photo.import(dataResolved.p[prop]);
          if (tmpPhoto == null) {
            continue;
          }
          tmpAlbum.photos.push(tmpPhoto);
        }
      }
    }
    if (data.m != null) {
      tmpAlbum.mapId = data.m;
    }

    return tmpAlbum;
  }

  /*****************************************************************************
  **** CheeseDb - the only class returned in this module
  *****************************************************************************/
  var CheeseDb = function() {

    this.owner = null;
    this.albums = [];
    this.nextAlbumId = 1;

    this._exportAsLinkedNamespace = false;

    Object.seal(this);
    return this;
  }

  CheeseDb.prototype.setOwner = function(address) {
    this.owner = address;
  }

  CheeseDb.prototype.setExportAsLinkedNamespace = function() {
    this._exportAsLinkedNamespace = true;
  }

  CheeseDb.prototype.flagAllLinkedPhotosForUpload = function() {
    for (var a = 0; a < this.albums.length; a ++) {
      this.albums[a]._linkedPhotosUpload = true; 
    }
  }

  CheeseDb.prototype.getAlbumById = function(albumId) {
    albumId = albumId.toLowerCase();
    for (var a = 0; a < this.albums.length; a ++) {
      if (this.albums[a].getAlbumId() == albumId) {
        return this.albums[a];
      }
    }
    return null;
  }

  CheeseDb.prototype.newAlbum = function() {
    let a = new Album();
    a.id = this.nextAlbumId;
    this.nextAlbumId++;
    a.owner = this.owner;
    return a;
  }

  CheeseDb.prototype.addAlbum = function(album) {
    this.albums.push(album);
  }

  CheeseDb.prototype.deleteAlbum = function(id) {
    for (var a = 0; a < this.albums.length; a++) {
      if (this.albums[a].id == id) {
        this.albums.splice(a, 1)
        return;
      }
    }
    throw 'not found'
  }

  CheeseDb.prototype.getPendingPhotosToUpload = function() {
    let pending = [];
    for (var a = 0; a < this.albums.length; a++) {
      pending = pending.concat(this.albums[a].getPendingPhotosToUpload())
    }
    return pending;
  }

  CheeseDb.prototype.getPendingPhotoCollectionsToUpload = function() {
    let pending = [];
    for (var a = 0; a < this.albums.length; a++) {
      if (this.albums[a]._linkedPhotosUpload) {
        pending.push(this.albums[a].exportPhotosAsEncodedCbor())
      }      
    }
    return pending;
  }

  CheeseDb.prototype.export = function() {
    let obj = {}
    if (this.albums.length > 0) {
      obj.a = [];
      for (var i = 0; i < this.albums.length; i++) {
        let exportedAlbum = this.albums[i].export();
        obj.a[i] = exportedAlbum
      }
    }
    obj.ni = this.nextAlbumId;
    return obj;
  }

  CheeseDb.prototype.publish = function() {
    if (this.owner == null)
      throw 'no owner set';

    var ls = new libwip2p.LinkedSet();
    ls.address = this.owner;

    return ls.fetch(this.owner, "/cheese", {dontResolveCids: true})
    .catch((err)=>{
      if (err == 'account has not posted anything' || err == 'path doesnt exist') {

      } else {
        throw err;
      }
    })
    .then(()=>{
      let rootAlreadyLinked = false;
      if (ls.rootNode.content.cheese[Symbol.toStringTag] == "CID") {
        this._exportAsLinkedNamespace = true;
        rootAlreadyLinked = true;
      }

      let newPhotoCollectionsToUpload = this.getPendingPhotoCollectionsToUpload();
      for (let a = 0; a < newPhotoCollectionsToUpload.length; a++) {
        ls.addCachedDoc(newPhotoCollectionsToUpload[a]);
      }

      // export the new content
      var newDb = this.export();      
      ls.update("/cheese", newDb, {createMissing: true})

      if (this._exportAsLinkedNamespace && !rootAlreadyLinked) {
        ls.linkify("/cheese")
      }

      return ls.sign()
    })
    .then(()=>{      
      let newPhotosToUpload = this.getPendingPhotosToUpload();
      for (let a = 0; a < newPhotosToUpload.length; a++) {
        ls.addCachedDoc(newPhotosToUpload[a]);
      }

      //console.log(ls)
      //throw 'stop'
      return ls.publish();
    })
    .then((response)=>{
      if (response.result) {
        return response.result;
      } else {
        throw response.error;
      }
    })
  }

  CheeseDb.Album = Album;

  /*CheeseDb.fetch = function(address) {
    let ls = new libwip2p.LinkedSet();
    return ls.fetch(address, "/cheese")
    .then((rawCheeseDb)=>{
      var db = CheeseDb.import(address, rawCheeseDb)
      return {appDb: db, linkedSet: ls};
    })
  }*/

  CheeseDb.import = function(linkedSet) {
    //console.log('CheeseDb.import() -> ')
    //console.log(linkedSet)
    //console.log(CheeseDb.getNamespace())

    let owner = linkedSet.address;
    let data = linkedSet.getContentByPath(CheeseDb.getNamespace(), {dontResolveCids: true})
    let dataResolved = linkedSet.getContentByPath(CheeseDb.getNamespace(), {dontResolveCids: false})

    var db = new CheeseDb();
    db.owner = owner.toLowerCase();

    if (data == null) {
      return db;
    }

    if (data.ni != null) {
      db.nextAlbumId = data.ni;
    }

    if (data.a == null) {
      db.albums = [];
    } else {
      for (let a = 0; a < data.a.length; a++) {
        let tmpAlbum = Album.import(data.a[a], dataResolved.a[a]);
        if (tmpAlbum == null) {
          continue;
        }
        tmpAlbum.owner = owner.toLowerCase();
        db.albums.push(tmpAlbum);
      }
    }

    return db;
  }

  CheeseDb.getNamespace = function() {
    return "/cheese"
  }

  return CheeseDb;

})
