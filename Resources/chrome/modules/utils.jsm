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

function $R53(callback, loader) {
  var accessKeyId = Prefs.accessKeyId;
  var secretAccessKey = Prefs.secretAccessKey;

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  var r53cli = new R53Client(accessKeyId, secretAccessKey);

  if (!callback) {
    return r53cli;
  }

  if (loader) {
    var callback_orig = callback;

    callback = function(client) {
      progress.apply(this, [loader, function() {
        callback_orig.apply(this, [client]);
      }]);
    }
  }

  return protect.apply(this, [function() {
    callback.apply(this, [r53cli]);
  }]);
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
    retval = callback.apply(this);
  } catch (e) {
    this.alert(e);
  }

  return retval;
}

function progress(loader, callback) {
  loader = $.apply(this, [loader]);
  loader.hidden = false;

  var retval = null;
  var exception = null;

  try {
    retval = callback.apply(this);
  } catch (e) {
    exception = e;
  }

  loader.hidden = true;

  if (exception) {
    throw exception;
  }

  return retval;
}
