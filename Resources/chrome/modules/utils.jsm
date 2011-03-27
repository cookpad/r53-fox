var EXPORTED_SYMBOLS = [
  '$',
  '$V',
  '$R53',
  '$CELL',
  'sortRowsByColumn',
  'openModalDialog',
  'copyToClipboard',
  'openURL'
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
  var query_orig = r53cli.query;

  r53cli.query = function() {
    var xhr = query_orig.apply(r53cli, arguments);

    if (!xhr.success()) {
      throw xhr.xml();
    }

    return xhr;
  }

  if (!callback) {
    return r53cli;
  }

  var callback_with_client = function() {
    callback(r53cli);
  };

  if (loader) {
    var callback_with_client_orig = callback_with_client;

    callback_with_client = function() {
      return progress(loader, callback_with_client_orig);
    };
  }

  var window_alert = this.alert;

  return protect(callback_with_client, function(e) {
    if (typeof(e) == 'xml') {
      window_alert('[XML]\n' + e);
    } else {
      window_alert(e);
    }
  });
}

function openModalDialog(name, args, features) {
  if (!features) {
    features = 'chrome,modal,centerscreen';
  }

  var h = {accepted:false, result:null};

  if (args) {
    for (var i in args) {
      h[i] = args[i];
    }
  }

  this.openDialog('chrome://r53fox/content/' + name + '.xul', name, features, h);

  return(h.accepted ? h.result : null);
}

function copyToClipboard(text) {
  var str = Components.classes['@mozilla.org/supports-string;1'].createInstance(Components.interfaces.nsISupportsString);
  var trans = Components.classes['@mozilla.org/widget/transferable;1'].createInstance(Components.interfaces.nsITransferable);
  var clip = Components.classes['@mozilla.org/widget/clipboard;1'].getService(Components.interfaces.nsIClipboard);

  if (str && trans && clip) {
    str.data = text;
    trans.addDataFlavor('text/unicode');
    trans.setTransferData('text/unicode', str, text.length * 2);
    clip.setData(trans, null, Components.interfaces.nsIClipboard.kGlobalClipboard);
  }
}

function openURL(url) {
  var io = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces.nsIIOService);
  var uri = io.newURI(url, null, null);
  var eps = Components.classes['@mozilla.org/uriloader/external-protocol-service;1'].getService(Components.interfaces.nsIExternalProtocolService);
  var launcher = eps.getProtocolHandlerInfo('http');

  launcher.preferredAction = Components.interfaces.nsIHandlerInfo.useSystemDefault;
  launcher.launchWithURI(uri, null);
}

function $CELL(row, netedId) {
  netedId = netedId.toString();

  var keys = netedId.split('.');

  if (keys.length < 2) {
    return null;
  }

  keys.shift();

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    row = row[key];
  }

  return row.toString();
}

function sortRowsByColumn(column, rows) {
  var sortDirection = column.element.getAttribute('sortDirection');

  for (var i = 0; i < column.columns.count; i++) {
    column.columns.getColumnAt(i).element.setAttribute('sortDirection', 'natural');
  }

  rows.sort(function(a, b) {
    a = $CELL(a, column.id);
    b = $CELL(b, column.id);
    return (a < b) ? -1 : (a > b) ? 1 : 0;
  });

  if (sortDirection == 'ascending' || sortDirection == 'natural') {
    sortDirection = 'descending';
    rows.reverse();
  } else {
    sortDirection = 'ascending';
  }

  column.element.setAttribute('sortDirection', sortDirection);
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
