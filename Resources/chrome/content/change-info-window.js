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

function onLoad() {
  var changeIds = window.arguments[0].changeIds;
  changeIds.reverse();

  var menulist = $('change-info-window-change-id');

  for (var i = 0; i < changeIds.length; i++) {
    var chid_date = changeIds[i];
    var chid = chid_date[0];
    var date = chid_date[1];
    menulist.appendItem(chid + ' - ' + date, chid);
  }

  menulist.selectedIndex = 0;
}

function onAccept() {
  var args = window.arguments[0];

  var chid = $('change-info-window-change-id').selectedItem.value;

  args.accepted = true;
  args.result = {changeId:chid};

  close();
}
