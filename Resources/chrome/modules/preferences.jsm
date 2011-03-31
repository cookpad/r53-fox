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
  },

  get algorythm() {
    var v = prefs.getCharPref('algorythm');
    return (v || '').trim();
  },

  set algorythm(v) {
    v = (v || '').toString().trim();
    prefs.setCharPref('algorythm', v);
  },

  getChangeIds: function(hzid) {
    var changeIds = prefs.getCharPref('changeIds');
    changeIds = eval(changeIds);
    return changeIds[hzid];
  },

  addChangeId: function(hzid, chid, date) {
    chid = chid.toString();
    date = date.toString();
    var changeIds = prefs.getCharPref('changeIds');
    changeIds = eval(changeIds);
    if (!changeIds[hzid]) { changeIds[hzid] = []; }
    changeIds[hzid].push([chid, date]);
    prefs.setCharPref('changeIds', changeIds.toSource());
  }
};
