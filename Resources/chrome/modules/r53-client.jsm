var EXPORTED_SYMBOLS = ['R53Client'];

Components.utils.import('resource://r53fox/sha1.jsm');

var window = Components.classes["@mozilla.org/appshell/appShellService;1"].getService(Components.interfaces.nsIAppShellService).hiddenDOMWindow;
var XMLHttpRequest = window.XMLHttpRequest;

// classs R53Client
function R53Client(accessKeyId, secretAccessKey) {
  this.accessKeyId = accessKeyId;
  this.secretAccessKey = secretAccessKey;
}

R53Client.prototype = {
  USER_AGENT: 'R53Client/0.1.0',
  HOST: 'route53.amazonaws.com',
  API_VERSION: '2010-10-01',
  TIMEOUT: 30000,

  // Actions on Hosted Zones
  createHostedZone: function(xml, callback) {
    var url = this.url('hostedzone');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, !!callback);
    xhr.setRequestHeader('Content-Length', xml.length);
    xhr.setRequestHeader('Content-Type', 'text/xml');

    return this.query(xhr, xml, callback);
  },

  getHostedZone: function(hostedZoneId, callback) {
    var url = this.url('hostedzone', hostedZoneId);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, !!callback);

    return this.query(xhr, null, callback);
  },

  deleteHostedZone: function(hostedZoneId, callback) {
    var url = this.url('hostedzone', hostedZoneId);
    var xhr = new XMLHttpRequest();
    xhr.open('DELETE', url, !!callback);

    return this.query(xhr, null, callback);
  },

  listHostedZones: function(params, callback) {
    var url = this.url('hostedzone');

    if (params) {
      var qs = this.queryString(params);
      url += ('?' + qs);
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, !!callback);

    return this.query(xhr, null, callback);
  },

  // Actions on Resource Records Sets
  changeResourceRecordSets: function(hostedZoneId, xml, callback) {
    var url = this.url('hostedzone', hostedZoneId, 'rrset');

    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, !!callback);
    xhr.setRequestHeader('Content-Length', xml.length);
    xhr.setRequestHeader('Content-Type', 'text/xml');

    return this.query(xhr, xml, callback);
  },

  listResourceRecordSets: function(hostedZoneId, params, callback) {
    var url = this.url('hostedzone', hostedZoneId, 'rrset');

    if (params) {
      var qs = this.queryString(params);
      url += ('?' + qs);
    }

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, !!callback);

    return this.query(xhr, null, callback);
  },

  getChange: function(changeId, callback) {
    var url = this.url('change', changeId);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, !!callback);

    return this.query(xhr, null, callback);
  },

  // private
  query: function(xhr, body, callback) {
    var date = (new Date()).toUTCString();
    xhr.setRequestHeader('X-Amzn-Authorization', this.xAmznAuthorization(date));
    xhr.setRequestHeader('Host', this.HOST);
    xhr.setRequestHeader('x-amz-date', date);
    xhr.setRequestHeader('User-Agent', this.USER_AGENT);
    xhr.setRequestHeader('Connection', 'close');

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
          window.alert(e);
        }
      };
    } else {
      xhr.onreadystatechange = function() {};
    }

    var timer = window.setTimeout(xhr.abort, this.TIMEOUT);

    try {
      xhr.send(body);
      window.clearTimeout(timer);
    } catch(e) {
      if (!callback) { clearTimeout(timer); }
      throw e;
    }

    return extxhr();
  }, // query

  xAmznAuthorization: function(date) {
    var signature = b64_hmac_sha1(this.secretAccessKey, date);

    var params = [
      'AWSAccessKeyId=' + this.accessKeyId,
      'Algorithm=HmacSHA1',
      'Signature=' + signature];

    return 'AWS3-HTTPS ' + params.join(',');
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

    for (var key in params) {
      var val = encode(kvs[key]);
      encoded.push(key + '=' + val);
    }

    return encoded.join('&');
  }, // queryString

  url: function() {
    var base = 'https://' + this.HOST + '/' + this.API_VERSION + '/';
    return base + Array.prototype.join.apply(arguments, ['/']);
  }
}

