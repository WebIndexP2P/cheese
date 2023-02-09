'use strict';

define([
  'lib/eventemitter'
],function(
  EventEmitter
){

  var AppDbClass = null;
  var AppStateHandler = null;

  var content = {}; //{account: wip2pdb, linkedset}
  var rawDocCache = {} // {cid: buffer, callbacks: []}
  var requestQueue = []; // [account... || cid]
  var requestQueueMap = {}; // {account: [callbacks]}
  var reloadCurrentAccount = false;
  var isLoading = false;

  var events = new EventEmitter();


  var setup = function(appDbClass, appStateHandler) {

    if (appDbClass == null || appStateHandler == null) {
      throw 'missing arguments';
    }

    if (typeof appDbClass.import != 'function') {
      throw 'appDbClass missing function import()';
    }

    if (typeof appDbClass.getNamespace != 'function') {
      throw 'appDbClass missing function getNamespace()';
    }

    if (typeof appStateHandler.process != 'function') {
      throw 'appStateHandler missing function process()';
    }

    AppDbClass = appDbClass;
    AppStateHandler = appStateHandler;
  }

  var subscribeToUpdates = function(callback) {
    return events.on('update', callback);
  }

  var fetchOne = function(account, options) {

    if (options == null) {
      // pathOverride: string
      // replaceCache: bool 
      options = {}
    } else if (typeof options != 'object') {
      throw new Error('options expects object')
    }

    //console.log('loader.js -> fetchOne(' + account + ')')

    if (AppDbClass == null || AppStateHandler == null) {
      return new Promise((resolve,reject)=>{
        reject('loader not setup');
      })
    }

    if (typeof account != 'string' || account.length != 42) {
      return new Promise((resolve,reject)=>{
        console.trace()
        reject('missing valid account')
      })
    }
    account = account.toLowerCase();

    if (options.replaceCache == null) {
      options.replaceCache = false;
    }

    //console.log('loader.js -> fetchOne ' + account)

    // serve up cache
    if (content.hasOwnProperty(account) && !options.replaceCache) {
      //console.log('loader -> fetched ' + account + ' from cache');
      var nextAccount = requestQueue[0];
      if (nextAccount != null) {
        fetchOne(nextAccount);
      }
      return new Promise((resolve,reject)=>{
        resolve({state: "fromCache", db: content[account].appDb, ls: content[account].linkedSet})
      })
    }

    if (options.replaceCache) {

      delete content[account];
      if (requestQueue[0] == account) {
        reloadCurrentAccount = true;
        console.log('replacing cache for account ' + account + ' which is currently loading, will fetch again');
      } else {
        console.log('replacing cache for account ' + account);
      }
    }

    // account not cached, do we have a queue?
    if (isLoading != false && requestQueue.length > 0) {
      //console.log('loader.js -> queueing ' + account + ' (' + (requestQueue.length + 1) + ')')
      // return a queued request
      return new Promise((resolve, reject)=>{
        if (requestQueueMap.hasOwnProperty(account)) {
          requestQueueMap[account].push([resolve, reject]);
        } else {
          requestQueue.push(account);
          requestQueueMap[account] = [[resolve, reject]];
        }
      })
      
    }

    requestQueue.push(account);
    requestQueueMap[account] = [];

    return networkFetch(account, options);
  }

  var networkFetch = function(account, options) {

    console.log('loader.js -> networkFetch() ' + account)

    if (options == null) {
      // pathOverride: string
      // replaceCache: bool 
      options = {}
    } else if (typeof options != 'object') {
      throw new Error('options expects object')
    }

    isLoading = true;

    let appNamespace = AppDbClass.getNamespace();
    let ls = new libwip2p.LinkedSet();
    return ls.fetch(account, appNamespace)
    .then((result)=>{
      //console.log('loader -> fetched ' + account)
      let appDb = AppDbClass.import(ls);
      //console.log(appDb)
      /*if (account == libwip2p.Account.getWallet().address.toLowerCase()) {
        console.log(appDb)
      }*/

      let response = {state:'success', db: appDb, ls: ls}
      content[account] = {appDb: appDb, linkedSet: ls};

      // AppState->process (also returns list of detectedAccounts to further load)
      var detectedAccounts = AppStateHandler.process(account, appDb);
      for (var a = 0; a < detectedAccounts.length; a++) {
        fetchOne(detectedAccounts[a], appNamespace).catch((err)=>{});
      }

      if (requestQueueMap.hasOwnProperty(account)) {
        for (var a = 0; a < requestQueueMap[account].length; a++) {
          requestQueueMap[account][a][0](response);
        }
        delete requestQueueMap[account];
      }
      // remove the request we just performed
      if (requestQueue[0] != account) {
        throw new Error('first queue item is not account we loaded')
      }
      requestQueue.shift();

      events.emit('update', account);

      if (requestQueue.length > 0) {
        //console.log('kick off next networkFetch')
        let nextAccount = requestQueue[0];
        if (nextAccount != null) {
          networkFetch(nextAccount).catch((err)=>{});
        }
      } else {
        isLoading = false;
      }

      return response;
    })
    .catch((err)=>{
      console.log('loader -> fetch error for ' + account)
      if (err == 'account not found') {
        console.log('loader.networkFetch() -> ' + err)
      } else if (err.hasOwnProperty('message') && err.message == 'CBOR decode error: too many terminals, data makes no sense'){
        console.log('loader.networkFetch() -> ' + err.message)
      } else {
        console.error(err)
      }

      if (reloadCurrentAccount) {
        reloadCurrentAccount = false;
        let nextAccount = requestQueue.shift();
        if (nextAccount != null) {
          return networkFetch(nextAccount);
        }
      }

      if (err == 'account not found') {
        content[account] = err;
      } else {
        content[account] = null;
      }

      var callbacks = requestQueueMap[account];

      if (callbacks != null) {
        for (var a = 0; a < callbacks.length; a++) {
          callbacks[a][1]({state: "error", msg: err}).catch(()=>{});
        }
      }
      delete requestQueueMap[account];

      if (requestQueue.length > 0) {
        let nextAccount = requestQueue[0];
        if (nextAccount != null) {
          networkFetch(nextAccount).catch((err)=>{});
        }
      } else {
        isLoading = false;
      }
      return({state:"error", msg: err});
    })
  }

  var fetchSequential = function(callback) {
    //console.log('fetch sequential accounts');
    var processResults = function(response) {
      let lastSeqNo;
      for (var a = 0; a < response.result.length; a++) {
        let tmpAcct = response.result[a].account;
        console.log('add requestQueue ' + tmpAcct);
        requestQueue.push(tmpAcct);
        lastSeqNo = response.result[a].seqNo;
      }
      if (!isLoading && requestQueue.length > 0) {
        let nextAccount = requestQueue[0];
        fetchOne(nextAccount)
      }
      return lastSeqNo;
    }

    let session;
    new Promise((resolve, reject)=>{
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
    .then((_session)=>{
      session = _session;
      if (session.connState != 4)
        throw 'not connected';
      // call getBySequence twice for at most (2x10) accounts
      return session.sendMessage({method:"bundle_getBySequence", params: [0]})
    })
    .then((response)=>{
      let lastSeqNo = processResults(response);
      if (response.result.length == 10) {
        return session.sendMessage({method:"bundle_getBySequence", params: [lastSeqNo + 1]})
        .then((response)=>{
          processResults(response);
        })
      }
    })
  }

  var fetchByIndex = function(indexName) {

    let ls = new libwip2p.LinkedSet();
    return ls.fetch(indexName)
    .then((result)=>{
      if (Array.isArray(result)) {
        for (let a = 0; a < result.length; a++) {
          let tmpAddress = '0x' + Buffer.from(result[a]).toString('hex')
          fetchOne(tmpAddress)
        }
        return result.length;
      }
      return 0;
    })

  }

  var getAccountsLoaded = function() {
    return Object.keys(content).length;
  }

  var remove = function(address) {
    throw 'not yet implemented'
  }

  var fetchCid = function(address, cid) {
    console.log('loader.js -> fetchCid ' + address + ", " + cid)

    if (typeof cid != 'string') {
      throw new Error('not a valid cid string')
    }

    let linkedSet;
    return fetchOne(address)
    .then((result)=>{

      console.log('FIXME: check requestQueue')

      linkedSet = result.ls;
      return linkedSet.fetchCid(cid)
    })
    .then((result)=>{
      let cidObj = libipfs.multiformats.CID.parse(cid);
      let docBytes = linkedSet.getCachedDoc(cidObj)
      rawDocCache[cid] = docBytes;

      // update appDb based on new content
      let appDb = AppDbClass.import(linkedSet)
      //console.log(linkedSet)

      // probably also need to update app state
      AppStateHandler.process(address, appDb)

      content[address].appDb = appDb;
      return result
    })
  }

  return {
    setup: setup,
    subscribeToUpdates: subscribeToUpdates,
    fetchOne: fetchOne,
    fetchSequential: fetchSequential,
    fetchByIndex: fetchByIndex,
    getAccountsLoaded: getAccountsLoaded,
    remove: remove,
    fetchCid: fetchCid
  }

})
