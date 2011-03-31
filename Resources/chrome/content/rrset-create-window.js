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

Components.utils.import('resource://r53fox/utils.jsm');

function onLoad() {
  var hostedZoneName = window.arguments[0].hostedZoneName;
  $('rrset-create-window-name').value = '.' + hostedZoneName;
}

function onAccept() {
  var args = window.arguments[0];

  var name = $V('rrset-create-window-name');
  var type = $('rrset-create-window-type').selectedItem.value;
  var ttl = $V('rrset-create-window-ttl');
  var value = $V('rrset-create-window-value');
  var comment = $V('rrset-create-window-comment');

  if (!name || !ttl || !value) {
    alert("Please input 'Name', 'TTL' and 'Value'.");
    return;
  }

  args.accepted = true;
  args.result = {name:name, type:type, ttl:ttl, value:value, comment:comment};

  close();
}
