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

function onAccept() {
  var args = window.arguments[0];

  var name = $V('hosted-zone-create-window-name');
  var cr = $V('hosted-zone-create-window-caller-reference');
  var comment = $V('hosted-zone-create-window-comment');

  if (!name || !cr) {
    alert("Please input 'Name' and 'Caller Reference'.");
    return;
  }

  args.accepted = true;
  args.result = {name:name, callerReference:cr, comment:comment};

  close();
}

function inputCallerReference() {
  var name = $V('hosted-zone-create-window-name');
  var cre = $('hosted-zone-create-window-caller-reference');
  if ((cre.value || '').trim() || !name) { return; }
  cre.value = ['CreateHostedZone', name, (new Date()).toString()].join(', ');
}
