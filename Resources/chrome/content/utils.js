/*
R53 Fox - a GUI client of Amazon Route 53
Copyright (C) 2011 Genki Sugawara

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/

Components.utils.import('resource://r53fox/r53-client.jsm');
Components.utils.import('resource://r53fox/elb-client.jsm');
Components.utils.import('resource://r53fox/preferences.jsm');

function $(element) {
  return document.getElementById(element);
}

function $V(element) {
  element = $(element);

  if (!element || element.disabled) {
    return '';
  } else {
    return (element.value || '').trim();
  }
}

function $R53(callback, loader) {
  var accessKeyId = Prefs.accessKeyId;
  var secretAccessKey = Prefs.secretAccessKey;
  var algorythm = Prefs.algorythm;

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  var r53cli = new R53Client(window, accessKeyId, secretAccessKey, algorythm);
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

  return protect(callback_with_client, function(e) {
    if (typeof(e) == 'xml') {
      openModalDialog('error-dialog', {error:(e..Error)});
    } else {
      alert(e);
    }
  });
}

function $ELB(endpoint, callback, loader) {
  var accessKeyId = Prefs.accessKeyId;
  var secretAccessKey = Prefs.secretAccessKey;
  var algorythm = Prefs.algorythm;

  if (!accessKeyId || !secretAccessKey) {
    return null;
  }

  var elbcli = new ELBClient(window, accessKeyId, secretAccessKey, algorythm, endpoint);
  var query_orig = elbcli.query;

  elbcli.query = function() {
    var xhr = query_orig.apply(elbcli, arguments);

    if (!xhr.success()) {
      throw xhr.xml();
    }

    return xhr;
  }

  if (!callback) {
    return elbcli;
  }

  var callback_with_client = function() {
    callback(elbcli);
  };

  if (loader) {
    var callback_with_client_orig = callback_with_client;

    callback_with_client = function() {
      return progress(loader, callback_with_client_orig);
    };
  }

  return protect(callback_with_client, function(e) {
    if (typeof(e) == 'xml') {
      openModalDialog('error-dialog', {error:(e..Error)});
    } else {
      alert(e);
    }
  });
}

function openModalDialog(name, args, features) {
  features = (features || '').trim();
  features = features ? features.split(/\s*,\s*/) : [];

  var default_features = {chrome:0, modal:0, dialog:'no', resizable:0, centerscreen:0};

  for (var i = 0; i < features.length; i++) {
    var feature = features[i];
    feature = feature.split(/=/, 2);
    default_features[feature[0]] = feature[1];
  }

  features = [];

  for (var key in default_features) {
    var value = default_features[key];
    features.push(value ? [key, value].join('=') : key);
  }

  features = features.join(',');

  var h = {accepted:false, result:null};

  if (args) {
    for (var i in args) {
      h[i] = args[i];
    }
  }

  openDialog('chrome://r53fox/content/' + name + '.xul', name, features, h);

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

function $COLID(column) {
  column = column.id.toString().split('.');
  return column[column.length - 1];
}

function $CELL(row, netedId, depth) {
  netedId = netedId.toString();

  if (depth != 0 && !depth) {
    depth = 1;
  }

  var keys = netedId.split('.');

  for (var i = 0; i < depth; i++) {
    keys.shift();
  }

  if (keys.length == 0) {
    return null;
  }

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

function beep() {
  var sound = Components.classes["@mozilla.org/sound;1"].createInstance(Components.interfaces.nsISound);
  sound.beep();
}

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

Function.prototype.bind = function(self) {
  var func = this;

  return function() {
    return func.apply(self, arguments);
  };
}

Array.prototype.uniq = function() {
  var hash = {}

  for (var i = 0; i < this.length; i++) {
    var value = this[i];
    hash[value] = value;
  }

  var array = [];

  for (var i in hash) {
    array.push(i);
  }

  return array;
};

function createFilePicker(name, initializer) {
  if (!window.$cachedPicker) {
    window.$cachedPicker = {};
  }

  if (!window.$cachedPicker[name]) {
    var nsIFilePicker = Components.interfaces.nsIFilePicker;
    var picker =  Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);

    if (initializer) {
      initializer(picker);
    }

    window.$cachedPicker[name] = picker;
  }

  return window.$cachedPicker[name];
}
