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

var EXPORTED_SYMBOLS = ['ELBClient'];

Components.utils.import('resource://r53fox/sha1.jsm');
Components.utils.import('resource://r53fox/base64.jsm');
Components.utils.import('resource://r53fox/jssha256.jsm');

// sha256 encoding function
function b64_hmac_sha256(key, data) {
  HMAC_SHA256_init(key);
  HMAC_SHA256_write(data);
  var ary = HMAC_SHA256_finalize();

  var str = '';

  for (var i = 0; i < ary.length; i++) {
    str += String.fromCharCode(ary[i]);
  }

  return rstr2b64(str);
}

var ENDPOINTS = {
  'us-east-1.elb.amazonaws.com'     : 'elasticloadbalancing.us-east-1.amazonaws.com',
  'us-west-1.elb.amazonaws.com'     : 'elasticloadbalancing.us-west-1.amazonaws.com',
  'eu-west-1.elb.amazonaws.com'     : 'elasticloadbalancing.eu-west-1.amazonaws.com',
  'ap-southeast-1.elb.amazonaws.com': 'elasticloadbalancing.ap-southeast-1.amazonaws.com',
  'ap-northeast-1.elb.amazonaws.com': 'elasticloadbalancing.ap-northeast-1.amazonaws.com'
};

// class ELBClient
function ELBClient(window, accessKeyId, secretAccessKey, algorythm, endpoint) {
  this.window = window;
  this.accessKeyId = accessKeyId;
  this.secretAccessKey = secretAccessKey;
  this.algorythm = algorythm;
  this.endpoint = endpoint;
}

ELBClient.getEndpoint = function(url) {
  for (var i in ENDPOINTS) {
    var r = new RegExp(i.replace(/\./g, '\\.')+ '\\.?$');

    if (r.test(url)) {
      return ENDPOINTS[i];
    }
  }

  return null;
};

ELBClient.prototype = {
  USER_AGENT: 'ELBClient/0.1.0',
  API_VERSION: '2011-04-05',
  TIMEOUT: 30000,

  query: function(action, params, callback, async) {
    if (!params) {
      params = [];
    }

    var queryString = this.makeQuery(action, params);

    var xhr = new this.window.XMLHttpRequest();
    xhr.open('GET', 'https://' + this.endpoint + '/?' + queryString, async);
    xhr.setRequestHeader('Host', this.endpoint);
    xhr.setRequestHeader('User-Agent', this.USER_AGENT);
    xhr.setRequestHeader('Connection', 'close');

    function extxhr() {
      xhr.success = function() {
        return (xhr.status && xhr.status >= 200 && xhr.status < 300);
      }

      xhr.callback = function(xhr) {
        callback && callback(xhr);
      }

      xhr.xml = function() {
        var responseText = xhr.responseText;
        responseText = responseText.replace(/<\s*\?\s*xml\s+version\s*=\s*"[^"]*"\s*\?\s*>/, '');
        responseText = responseText.replace(/xmlns="[^"]*"/, '');
        var xml = new XML(responseText);
        return xml;
      }

      return xhr;
    }

    if (async) {
      xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) { return; }
        try {
          extxhr().callback();
        } catch (e) {
          this.window.alert(e);
        }
      };
    } else {
      xhr.onreadystatechange = function() {};
    }

    var timer = this.window.setTimeout(xhr.abort, this.TIMEOUT);

    try {
      xhr.send(null);
      this.window.clearTimeout(timer);
    } catch(e) {
      if (!async) { this.window.clearTimeout(timer); }
      throw e;
    }

    return extxhr();
  }, // query

  makeQuery: function(action, params) {
    var kvs = [];

    kvs.push(['Action', action]);
    kvs.push(['Version', this.API_VERSION]);
    kvs.push(['SignatureVersion', '2']);
    kvs.push(['SignatureMethod', this.algorythm]);
    kvs.push(['Timestamp', this.timestamp()]);
    kvs.push(['AWSAccessKeyId', this.accessKeyId]);

    for (var i = 0; i < params.length; i++) {
      kvs.push(params[i]);
    }

    kvs.sort(function(a, b) {
      a = a[0]; b = b[0];
      return (a < b) ? -1 : (a > b) ? 1 : 0;
    });

    var queryParams = [];

    function encode(str) {
      str = encodeURIComponent(str);

      var func = function(m) {
        switch(m) {
        case '!':
          return '%21';
        case "'":
          return '%27';
        case '(':
          return '%28';
        case ')':
          return '%29';
        case '*':
          return '%2A';
        default:
          return m;
        }
      };

      return str.replace(/[!'()*~]/g, func); // '
    }

    for (var i = 0; i < kvs.length; i++) {
      var key = kvs[i][0];
      var val = encode(kvs[i][1]);
      queryParams.push(key + '=' + val);
    }

    var queryString = queryParams.join('&');
    var stringToSign = 'GET\n' + this.endpoint + '\n/\n' + queryString;
    var signature = null;

    if (this.algorythm == 'HmacSHA1') {
      signature = b64_hmac_sha1(this.secretAccessKey, stringToSign);
    } else {
      signature = b64_hmac_sha256(this.secretAccessKey, stringToSign);
    }

    queryString += '&Signature=' + encodeURIComponent(signature);

    return queryString;
  }, // makeQuery

  timestamp: function(date) {
    if (!date) {
      date = new Date();
    }

    function pad(num) {
      return (num < 10 ? '0' : '') + num;
    }

    var year = pad(date.getUTCFullYear());
    var mon  = pad(date.getUTCMonth() + 1);
    var day  = pad(date.getUTCDate());
    var hour = pad(date.getUTCHours());
    var min  = pad(date.getUTCMinutes());
    var sec  = pad(date.getUTCSeconds());

    return [year, mon, day].join('-') + 'T' + [hour, min, sec].join(':') + 'Z';
  } // timestamp
};
