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
  version: '0.2.1',

  get currentUser() {
    return prefs.getCharPref('currentUser', null);
  },

  set currentUser(v) {
    prefs.setCharPref('currentUser', v);
  },

  convert: function() {
    var version = prefs.getCharPref('version');
    var accessKeyId = (prefs.getCharPref('accessKeyId') || '');

    if (!version && accessKeyId) {
      var secretAccessKey = (prefs.getCharPref('secretAccessKey') || '');
      var changeIds = prefs.getCharPref('changeIds');
      changeIds = eval(changeIds);

      Prefs.currentUser = 'Your name';

      var accounts = [
        [
          Prefs.currentUser,
          {
            accessKeyId:accessKeyId,
            secretAccessKey:secretAccessKey,
            changeIds:changeIds
          }
        ]
      ];

      prefs.setCharPref('accounts', accounts.toSource());
      prefs.setCharPref('version', this.version);
    }
  },

  getAccountList: function() {
    this.convert();
    var accounts = prefs.getCharPref('accounts', '([])');
    return eval(accounts);
  },

  storeAccountList: function(updated) {
    prefs.setCharPref('accounts', updated.toSource());
  },

  addAccount: function(userName, accessKeyId, secretAccessKey) {
    var accounts = this.getAccountList();

    var newAccount = [
      userName,
      {
        accessKeyId:accessKeyId,
        secretAccessKey:secretAccessKey
      }
    ];

    var index = -1;

    for(var i = 0; i < accounts.length; i++) {
      if (accounts[i][0] == userName) {
        index = i;
        break;
      }
    }

    if (index == -1) {
      accounts.push(newAccount);
    } else {
      accounts.splice(index, 1, newAccount);
    }

    this.storeAccountList(accounts);

    if (accounts.length == 1) {
      this.currentUser = accounts[0][0];
    }
  },

  deleteAccount: function(userName) {
    var accounts = this.getAccountList();
    var index = -1;

    for(var i = 0; i < accounts.length; i++) {
      if (accounts[i][0] == userName) {
        index = i;
        break;
      }
    }

    if (index != -1) {
      accounts.splice(index, 1);
      this.storeAccountList(accounts);

      if (accounts.length > 0) {
        this.currentUser = accounts[0][0];
      } else {
        this.currentUser = '';
      }
    }
  },

  getAccount: function() {
    var accounts = this.getAccountList();

    var userName = this.currentUser;
    if (!userName) { return {}; }

    for (var i = 0; i < accounts.length; i++) {
      if (accounts[i][0] == userName) {
        return accounts[i][1];
      }
    }

    return {};
  },

  storeAccount: function(updated) {
    var accounts = this.getAccountList();

    var userName = this.currentUser;
    if (!userName) { return; }

    for (var i = 0; i < accounts.length; i++) {
      if (accounts[i][0] == userName) {
        accounts[i][1] = updated;
        this.storeAccountList(accounts);
        break;
      }
    }
  },

  get accessKeyId() {
    var account = this.getAccount();
    return (account.accessKeyId || '').trim();
  },

  set accessKeyId(v) {
    var account = this.getAccount();
    account.accessKeyId = (v || '').toString().trim();
    this.storeAccount(account);
  },

  get secretAccessKey() {
    var account = this.getAccount();
    return (account.secretAccessKey || '').trim();
  },

  set secretAccessKey(v) {
    var account = this.getAccount();
    account.secretAccessKey = (v || '').toString().trim();
    this.storeAccount(account);
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
    var account = this.getAccount();
    var changeIds = (account.changeIds || {});
    return changeIds[hzid];
  },

  addChangeId: function(hzid, chid, date) {
    chid = chid.toString();
    date = date.toString();
    var account = this.getAccount();
    var changeIds = (account.changeIds || {});
    if (!changeIds[hzid]) { changeIds[hzid] = []; }
    changeIds[hzid].push([chid, date]);
    account.changeIds = changeIds;
    this.storeAccount(account);
  }
};
