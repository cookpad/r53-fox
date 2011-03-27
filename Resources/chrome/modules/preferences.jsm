var EXPORTED_SYMBOLS = ['Prefs'];

var prefs = Components.classes['@mozilla.org/preferences;1'].getService(Components.interfaces.nsIPrefService);
prefs = prefs.getBranch('r53fox.');

var Prefs = {
  get accessKeyId() {
    var v = prefs.getCharPref('accessKeyId');
    return (v || '').trim();
  },

  set accessKeyId(v) {
    v = (v || '').toString().trim();
    prefs.setCharPref('accessKeyId', v);
  },

  get secretAccessKey() {
    var v = prefs.getCharPref('secretAccessKey');
    return (v || '').trim();
  },

  set secretAccessKey(v) {
    v = (v || '').toString().trim();
    prefs.setCharPref('secretAccessKey', v);
  }
};
