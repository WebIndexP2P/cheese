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
    this.upload = false;

    Object.seal(this);
    return this;
  }

  Photo.prototype.export = function() {
    let obj = {}

    if (this.cid == null) {
      throw new Error('cid cannot be null');
    } else {
      obj.c = {"/": this.cid.toString()};
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
      tmpPhoto.cid = data.c["/"];
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
    p.upload = true;
    if (photoCidAndBuf.title != null) {
      p.title = photoCidAndBuf.title;
      let datePart;
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
  }

  Album.prototype.getCoverImageCid = function() {
    if (this.photos.length > 0 && this.photos[0] != null && this.photos[0].hasOwnProperty('cid')) {
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
      if (this.photos[a].upload) {
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
    if (this.photos.length > 0) {
      obj.p = [];
      for (var a = 0; a < this.photos.length; a++) {
        obj.p[a] = this.photos[a].export();
      }
    }
    if (this.mapId != null) {
      obj.m = this.mapId;
    }

    return obj;
  }

  Album.import = function(data) {
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
    if (data.hasOwnProperty('p') && data.p.length > 0) {
      tmpAlbum.photos = [];
      for (var a = 0; a < data.p.length; a++) {
        let tmpPhoto = Photo.import(data.p[a]);
        if (tmpPhoto == null) {
          continue;
        }
        tmpAlbum.photos[a] = tmpPhoto;
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
    this.avatar = null;
    this.name = null;
    this.nextAlbumId = 1;

    Object.seal(this);
    return this;
  }

  CheeseDb.prototype.setOwner = function(address) {
    this.owner = address;
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

  CheeseDb.prototype.export = function() {
    let obj = {}
    if (this.albums.length > 0) {
      obj.a = [];
      for (var i = 0; i < this.albums.length; i++) {
        obj.a[i] = this.albums[i].export();
      }
    }
    obj.ni = this.nextAlbumId;
    return obj;
  }

  CheeseDb.prototype.publish = function(owner) {
    if (owner == null)
      throw 'no owner set';

    var bs = new libwip2p.BranchSet();
    var sigBundle;
    bs.address = owner;
    var newDb = this.export();
    //console.log(newDb)
    return bs.FetchByAccount(owner, "/cheese")
    .catch((err)=>{
      if (err == 'account has not posted anything' || err == 'path doesnt exist') {

      } else {
        throw err;
      }
    })
    .then(()=>{
      return bs.Update("/cheese", newDb, true);
    })
    .then(()=>{
      return bs.sign();
    })
    .then(()=>{
      sigBundle = bs.exportSigBundle();
      let newPhotosToUpload = this.getPendingPhotosToUpload();
      sigBundle.cborData = sigBundle.cborData.concat(newPhotosToUpload);
      return libwip2p.Peers.getActivePeerSession();
    })
    .then((session)=>{
      if (session.connState != 4)
        throw 'not connected';
      return session.doBundlePublish(sigBundle);
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

  CheeseDb.fetch = function(address) {
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
    .then(()=>{
      var bs = new libwip2p.BranchSet();
      return bs.FetchByAccount(address, "/cheese")
      .then(async (rawCheeseDb)=>{
        var db = CheeseDb.import(address, rawCheeseDb)
        return db;
      })
    })
  }

  CheeseDb.import = function(owner, data) {
    //console.log('CheeseDb.import() -> ')
    //console.log(data)
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
      for (var a = 0; a < data.a.length; a++) {
        let tmpAlbum = Album.import(data.a[a]);
        if (tmpAlbum == null) {
          continue;
        }
        tmpAlbum.owner = owner.toLowerCase();
        db.albums.push(tmpAlbum);
      }
    }

    return db;
  }

  return CheeseDb;

})
