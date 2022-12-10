'use strict';

define([
  'lib/eventemitter'
],function(
  EventEmitter
){

  var AppDbClass = null;
  var AppStateHandler = null;

  var content = {}; //{account: wip2pDb}
  var requestQueue = []; // [account...]
  var reloadCurrentAccount = false;
  var isLoading = false;

  var requestQueueMap = {}; // {account: [callbacks]}

  var events = new EventEmitter();

  var setup = function(appDbClass, appStateHandler) {

    if (appDbClass == null || appStateHandler == null) {
      throw 'missing arguments';
    }

    if (typeof appDbClass.fetch != 'function') {
      throw 'appDbClass missing function fetch()';
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

  var fetchOne = function(account, replaceCache) {

    if (AppDbClass == null || AppStateHandler == null) {
      return new Promise((resolve,reject)=>{
        reject('loader not setup');
      })
    }

    account = account.toLowerCase();

    if (replaceCache == null)
      replaceCache = false;

    console.log('loader.js -> fetchOne ' + account)

    // serve up cache
    if (content.hasOwnProperty(account) && !replaceCache) {
      console.log('loader -> fetched ' + account + ' from cache');
      var nextAccount = requestQueue.shift();
      if (nextAccount != null) {
        fetchOne(nextAccount);
      }
      return new Promise((resolve,reject)=>{
        resolve({state: "fromCache", db: content[account]})
      })
    }

    if (replaceCache) {

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
      return new Promise((resolve,reject)=>{
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

    return networkFetch(account);
  }

  var networkFetch = function(account) {
    isLoading = true;
    //console.log('networkFetch() -> begin fetch ' + account)
    return AppDbClass.fetch(account)
    .then((appDb)=>{
      //console.log('loader -> fetched ' + account)

      if (account == libwip2p.Account.getWallet().address.toLowerCase()) {
        console.log(appDb)
      }

      if (reloadCurrentAccount) {
        reloadCurrentAccount = false;
        return networkFetch(requestQueue[0]);
      }

      var result = {state:'success', db: appDb}

      content[account] = appDb;
      var detectedAccounts = AppStateHandler.process(account, appDb);
      for (var a = 0; a < detectedAccounts.length; a++) {
        fetchOne(detectedAccounts[a]).catch((err)=>{});
        //if (!content.hasOwnProperty(detectedAccounts[a]) && requestQueue.indexOf(detectedAccounts[a]) == -1) {
        //  requestQueue.push(detectedAccounts[a]);
        //  requestQueueMap[detectedAccounts[a]] = [];
        //  console.log('loader.js -> added ' + detectedAccounts[a] + ' to requestQueue');
        //}
      }

      if (requestQueueMap.hasOwnProperty(account)) {
        for (var a = 0; a < requestQueueMap[account].length; a++) {
          requestQueueMap[account][a][0](result);
        }
        delete requestQueueMap[account];
      }

      events.emit('update', account);

      if (requestQueue.length > 0) {
        //console.log('kick off next networkFetch')
        let nextAccount = requestQueue.shift();
        if (nextAccount != null) {
          networkFetch(nextAccount).catch((err)=>{});
        }
      } else {
        isLoading = false;
      }

      return(result);
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
        let nextAccount = requestQueue.shift();
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
        let nextAccount = requestQueue.shift();
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

  var getAccountsLoaded = function() {
    return Object.keys(content).length;
  }

  return {
    setup: setup,
    subscribeToUpdates: subscribeToUpdates,
    fetchOne: fetchOne,
    fetchSequential: fetchSequential,
    getAccountsLoaded: getAccountsLoaded
  }

})
