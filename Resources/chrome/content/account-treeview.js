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

Components.utils.import('resource://r53fox/preferences.jsm');

function AccountTreeView(userNameElement, accessKeyIdElement, secretAccessKeyElement) {
  this.userNameElement = userNameElement;
  this.accessKeyIdElement = accessKeyIdElement;
  this.secretAccessKeyElement = secretAccessKeyElement;

  this.rowCount = 0;
  this.selection = null;
  this.sorted = false;
  this.data = [];
}

AccountTreeView.prototype = {
  updateData: function() {
    var accounts = Prefs.getAccountList();
    var data = [];

    for (var i = 0; i < accounts.length; i++) {
      var account = accounts[i];
      data.push([account[0], account[1].accessKeyId, account[1].secretAccessKey]);
    }

    this.data = data;
  },

  getCellText: function(row, column) {
    if (column.id == 'account-tree-use') {
      return null;
    }

    var accounts = Prefs.getAccountList();

    var idx = column.id.toString().split('.');
    idx = idx[idx.length - 1];

    return this.data[row][idx];
  },

  getCellValue: function(row, column) {
    if (column.id != 'account-tree-use') {
      return null;
    }

    var userName = this.data[row][0];
    var currentUser = Prefs.currentUser;

    return (currentUser && (currentUser == userName));
  },

  setTree: function(tree) {
    this.tree = tree;
  },

  isEditable: function(row, column) {
    return (column.id == 'account-tree-use');
  },

  setCellValue: function(row, column, value) {
    if (!value) { return; }

    var userName = this.data[row][0];
    Prefs.currentUser = userName;
    this.refresh();
  },

  refresh: function() {
    this.updateData();

    if (this.rowCount != this.data.length) {
      this.tree.rowCountChanged(0, -this.rowCount);
      this.rowCount = this.data.length;
      this.tree.rowCountChanged(0, this.rowCount);
    }

    this.tree.invalidate();
  },

  selectedRow: function() {
    var idx = this.selection.currentIndex;
    return (idx != -1) ? this.data[idx] : null;
  },

  copyColumnToClipboard: function(name) {
    var row = this.selectedRow();

    if (row) {
      var value = (row[name] || '').toString().trim();
      if (!value) { value = '(empty)'; }
      copyToClipboard(value);
    }
  },

  addAccount: function(userName, accessKeyId, secretAccessKey) {
    Prefs.addAccount(userName, accessKeyId, secretAccessKey);
    this.refresh();
  },

  deleteAccount: function() {
    var row = this.selectedRow();
    if (!row) { return; }

    var userName = row[0];

    if (!confirm("Are you sure you want to delete '" + userName + "'?")) {
      return;
    }

    Prefs.deleteAccount(userName);
    this.refresh();
  },

  onDblclick: function(event) {
    var row = this.selectedRow();

    if (!row || (event && event.target.tagName != 'treechildren')) {
      return;
    }

    this.userNameElement.value = row[0];
    this.accessKeyIdElement.value = row[1];
    this.secretAccessKeyElement.value = row[2];
  }
};
