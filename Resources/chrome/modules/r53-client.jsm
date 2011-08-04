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

var EXPORTED_SYMBOLS = ['R53Client'];

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

// class R53Client
function R53Client(window, accessKeyId, secretAccessKey, algorythm) {
  this.window = window;
  this.accessKeyId = accessKeyId;
  this.secretAccessKey = secretAccessKey;
  this.algorythm = algorythm;
}

R53Client.prototype = {
  USER_AGENT: 'R53Client/0.1.1',
  HOST: 'route53.amazonaws.com',
  API_VERSION: '2011-05-05',
  TIMEOUT: 30000,

  // Actions on Hosted Zones
  createHostedZone: function(xml, callback) {
    var url = this.url('hostedzone');
    var headers = [['Content-Length', xml.length], ['Content-Type', 'text/xml']]
    return this.query(url, 'POST', headers, xml, callback);
  },

  getHostedZone: function(hostedZoneId, callback) {
    var url = this.url('hostedzone', hostedZoneId);
    return this.query(url, 'GET', [], null, callback);
  },

  deleteHostedZone: function(hostedZoneId, callback) {
    var url = this.url('hostedzone', hostedZoneId);
    return this.query(url, 'DELETE', [], null, callback);
  },

  listHostedZones: function(params, callback) {
    var url = this.url('hostedzone');

    if (params) {
      var qs = this.queryString(params);
      url += ('?' + qs);
    }

    return this.query(url, 'GET', [], null, callback);
  },

  // Actions on Resource Records Sets
  changeResourceRecordSets: function(hostedZoneId, xml, callback) {
    var url = this.url('hostedzone', hostedZoneId, 'rrset');
    var headers = [['Content-Length', xml.length], ['Content-Type', 'text/xml']]
    return this.query(url, 'POST', headers, xml, callback);
  },

  listResourceRecordSets: function(hostedZoneId, params, callback) {
    var url = this.url('hostedzone', hostedZoneId, 'rrset');

    if (params) {
      var qs = this.queryString(params);
      url += ('?' + qs);
    }

    return this.query(url, 'GET', [], null, callback);
  },

  getChange: function(changeId, callback) {
    var url = this.url('change', changeId);
    return this.query(url, 'GET', [], null, callback);
  },

  // private
  fetchDate: function() {
    var xhr = new this.window.XMLHttpRequest();
    xhr.open('GET', 'https://' + this.HOST + '/date', false);

    var timer = this.window.setTimeout(xhr.abort, this.TIMEOUT);

    try {
      xhr.send(null);
      this.window.clearTimeout(timer);
    } catch(e) {
      this.window.clearTimeout(timer);
      throw e;
    }

    if (!(xhr.status && xhr.status >= 200 && xhr.status < 300)) {
      throw 'could not fetch date';
    }

    return xhr.getResponseHeader('Date');
  },

  query: function(url, method, headers, body, callback) {
    var date = this.fetchDate();
    //var date = (new Date()).toUTCString();

    var xhr = new this.window.XMLHttpRequest();
    xhr.open(method, url, !!callback);

    xhr.setRequestHeader('X-Amzn-Authorization', this.xAmznAuthorization(date));
    xhr.setRequestHeader('Host', this.HOST);
    xhr.setRequestHeader('x-amz-date', date);
    xhr.setRequestHeader('User-Agent', this.USER_AGENT);
    xhr.setRequestHeader('Connection', 'close');

    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      xhr.setRequestHeader(header[0], header[1].toString());
    }

    function extxhr() {
      xhr.success = function() {
        return (xhr.status && xhr.status >= 200 && xhr.status < 300);
      };

      xhr.callback = function(xhr) {
        callback && callback(xhr);
      };

      xhr.xml = function() {
        var responseText = xhr.responseText;
        responseText = responseText.replace(/<\s*\?\s*xml\s+version\s*=\s*"[^"]*"\s*\?\s*>/, '');
        responseText = responseText.replace(/xmlns="[^"]*"/, '');
        var xml = new XML(responseText);
        return xml;
      };

      return xhr;
    }

    if (callback) {
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
      xhr.send(body);
      this.window.clearTimeout(timer);
    } catch(e) {
      if (!callback) { this.window.clearTimeout(timer); }
      throw e;
    }

    return extxhr();
  }, // query

  xAmznAuthorization: function(date) {
    var signature = null;

    if (this.algorythm == 'HmacSHA1') {
      signature = b64_hmac_sha1(this.secretAccessKey, date);
    } else {
      signature = b64_hmac_sha256(this.secretAccessKey, date);
    }

    var auth = 'AWS3-HTTPS AWSAccessKeyId=' + this.accessKeyId + ',Algorithm=' + this.algorythm + ',Signature=' + signature;

    return auth;
  }, // xAmznAuthorization

  queryString: function(params) {
    if (params.length == 0) {
      return null;
    }

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

    var encoded = [];

    for (var i = 0; i < params.length; i++) {
      var key = params[i][0];
      var val = params[i][1];
      val = encode(val);
      encoded.push(key + '=' + val);
    }

    return encoded.join('&');
  }, // queryString

  url: function() {
    var base = 'https://' + this.HOST + '/' + this.API_VERSION + '/';
    return base + Array.prototype.join.call(arguments, '/');
  }
};
