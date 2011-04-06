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
  var resourceRecordSet = window.arguments[0].resourceRecordSet;
  var name = resourceRecordSet.Name.toString();

  var values = [];

  for each (var member in resourceRecordSet..ResourceRecords.ResourceRecord) {
    values.push(member.Value.toString());
  }

  document.title = "Edit - " + name;
  $('rrset-edit-window-name').value = name;
  $('rrset-edit-window-type').value = resourceRecordSet.Type.toString();
  $('rrset-edit-window-ttl').value = resourceRecordSet.TTL.toString();
  $('rrset-edit-window-value').value = values.join('\n');
}

function onAccept() {
  var args = window.arguments[0];

  var name = $V('rrset-edit-window-name');
  var type = $('rrset-edit-window-type').selectedItem.value;
  var ttl = $V('rrset-edit-window-ttl');
  var value = $V('rrset-edit-window-value');
  var comment = $V('rrset-edit-window-comment');

  if (!name || !ttl || !value) {
    alert("Please input 'Name', 'TTL' and 'Value'.");
    return;
  }

  args.accepted = true;
  args.result = {name:name, type:type, ttl:ttl, value:value, comment:comment};

  close();
}
