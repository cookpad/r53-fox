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

function ChangeInfoTreeView(changeIds) {
  this.changeIds = changeIds;
  this.rowCount = changeIds.length;
  this.selection = null;
}

ChangeInfoTreeView.prototype = {
  getCellText: function(row, column) {
    var cell = /\bChangeId$/i.test(column.id.toString()) ? 0 : 1;
    return this.changeIds[row][cell];
  },

  setTree: function(tree) {
    this.tree = tree;
  },

  selectedRow: function() {
    var idx = this.selection.currentIndex;
    return (idx != -1) ? this.changeIds[idx] : null;
  },

  accept: function(event) {
    try {
    var row = this.selectedRow();

    if (!row || (event && event.target.tagName != 'treechildren')) {
      return;
    }

    var args = window.arguments[0];
    args.accepted = true;
    args.result = {changeId:row[0]};
    close();
    }catch(e) {alert(e)}; 
  }
};
