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
