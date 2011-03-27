var EXPORTED_SYMBOLS = [
  '$',
  '$V',
  '$R53',
  'openModalDialog'
  ];

Components.utils.import('resource://r53fox/r53-client.jsm');
Components.utils.import('resource://r53fox/preferences.jsm');

function $(element) {
  return this.document.getElementById(element);
}

function $V(element) {
  return ($.apply(this, [element]).value || '').trim();
}

function $R53(callback, loader, self) {
  if (!self) { self = this; }

  var accessKeyId = Prefs.accessKeyId;
  var secretAccessKey = Prefs.secretAccessKey;

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  var r53cli = new R53Client(accessKeyId, secretAccessKey);

  if (!callback) {
    return r53cli;
  }

  var callback_in_self = function() {
    callback.apply(self, [r53cli]);
  };
  
  if (loader) {
    var callback_in_self_orig = callback_in_self;

    callback_in_self = function() {
      return progress(loader, callback_in_self_orig);
    };
  }

  return protect(callback_in_self, this.alert);
}

function openModalDialog(name, callback, features) {
  if (!features) {
    features = 'chrome,modal,centerscreen';
  }

  var retval = {accepted:false, result:null};

  this.openDialog('chrome://r53fox/content/' + name + '.xul', name, features, retval);

  if (!callback) {
    return(retval.accepted ? retval.result : null);
  } else {
    callback.apply(this, [retval.result]);
  }
}

// private
function protect(callback, alert) {
  var retval = null;

  try {
    retval = callback();
  } catch (e) {
    if (alert) { alert(e); }
  }

  return retval;
}

function progress(loader, callback) {
  loader.hidden = false;

  var retval = null;
  var exception = null;

  try {
    retval = callback();
  } catch (e) {
    exception = e;
  }

  loader.hidden = true;

  if (exception) {
    throw exception;
  }

  return retval;
}

