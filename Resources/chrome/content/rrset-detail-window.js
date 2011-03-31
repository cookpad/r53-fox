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
  var resourceRecordSet = window.arguments[0].resourceRecordSet;
  var values = [];

  for each (var member in resourceRecordSet..ResourceRecords.ResourceRecord) {
    values.push(member.Value.toString());
  }

  $('rrset-detail-window-name').value = resourceRecordSet.Name.toString();
  $('rrset-detail-window-type').value = resourceRecordSet.Type.toString();
  $('rrset-detail-window-ttl').value = resourceRecordSet.TTL.toString();
  $('rrset-detail-window-value').value = values.join('\n');
}
