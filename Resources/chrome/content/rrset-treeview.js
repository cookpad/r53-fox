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

function RRSetTreeView(hostedZoneId, hostedZoneName) {
  this.hostedZoneId = hostedZoneId;
  this.hostedZoneName = hostedZoneName;
  this.rows = [];
  this.printRows = [];
  this.rowCount = 0;
  this.selection = null;
  this.sorted = false;
  this.changes = {};
}

RRSetTreeView.prototype = {
  getCellText: function(row, column) {
    var colid = $COLID(column);
    var updval = (this.changes[row] || {})[colid];
    if (updval) { return updval; }

    var row = this.printRows[row];
    var text = $CELL(row, column.id);

    if ('Type' == colid && row.AliasTarget.toString()) {
      text = 'A (Alias)';
    }

    return text;
  },

  setTree: function(tree) {
    this.tree = tree;
  },

  toggleEditable: function() {
    var rrsetTree = this.tree.element;
    var toggleButton = $('rrset-tree-toggle-editable-button');
    var filter = $('rrset-tree-filter');
    var clearButton = $('rrset-tree-filter-clear-button');

    var update = true;

    if (rrsetTree.editable) {
      var hasChange = false;
      for (var i in this.changes) { hasChange = true; break; }

      if (hasChange && confirm('Are you sure you want to update ResourceSets?')) {
        try {
        update = this.editInlineRRSet();
        } catch(e) { alert(e); }
      } else {
        update = false;
      }
    }

    if (update) {
      // toggle editable
      rrsetTree.editable = (!rrsetTree.editable);

      toggleButton.label = rrsetTree.editable ? 'Save' : 'Edit';
      filter.disabled = (!!rrsetTree.editable);
      clearButton.disabled = (!!rrsetTree.editable);
    }
  },

  disableEditable: function() {
    var rrsetTree = this.tree.element;
    var toggleButton = $('rrset-tree-toggle-editable-button');
    var filter = $('rrset-tree-filter');
    var clearButton = $('rrset-tree-filter-clear-button');

    this.changes = {};
    this.invalidate();

    rrsetTree.editable = false;
    toggleButton.label = 'Edit';
    filter.disabled = false;
    clearButton.disabled = false;
  },

  isTreeEditable: function() {
    var rrsetTree = this.tree.element;
    return (!!rrsetTree.editable);
  },

  isEditable: function(row, column) {
    if (!this.isTreeEditable()) {
      return false;
    }

    return ({SetIdentifier:1, Weight:1, TTL:1})[$COLID(column)];
  },

  setCellText: function(row, column, value) {
    this.changes[row] = (this.changes[row] || {});
    this.changes[row][$COLID(column)] = (value || '').trim();
    this.tree.invalidate();
  },

  getCellProperties: function(row, column, props) {
    if (!this.isTreeEditable()) {
      return;
    }

    var updval = (this.changes[row] || {})[$COLID(column)];

    if (updval) {
      var aserv = Components.classes['@mozilla.org/atom-service;1'].getService(Components.interfaces.nsIAtomService);
      props.AppendElement(aserv.getAtom('updated'));
    }
  },

  isSorted: function() {
    return this.sorted;
  },

  cycleHeader: function(column) {
    if (this.isTreeEditable()) {
      return;
    }

    var row = this.selectedRow();

    sortRowsByColumn(column, this.rows);
    this.invalidate();
    this.sorted = true;

    if (row) {
      this.selectByName(row.Name);
    }
  },

  invalidate: function() {
    this.printRows.length = 0;

    var filterValue = $V('rrset-tree-filter');

    function filter(elem) {
      if (!filterValue) { return true; }

      var r = new RegExp(filterValue);

      for each (var child in elem.*) {
        var innerText = child.toString().replace(/<[^>]+>/g, '');
        if (r.test(innerText)) { return true;  }
      }

      return false;
    };

    for (var i = 0; i < this.rows.length; i++) {
      var row =  this.rows[i];

      if (filter(row)) {
        this.printRows.push(row);
      }
    }

    if (this.rowCount != this.printRows.length) {
      this.tree.rowCountChanged(0, -this.rowCount);
      this.rowCount = this.printRows.length;
      this.tree.rowCountChanged(0, this.rowCount);
    }

    this.tree.invalidate();
  },

  refresh: function() {
    this.rows.length = 0;

    $R53(function(r53cli) {
      function walkRows(hzid, rows, nextRecord) {
        var params = [];
        nextRecord = (nextRecord || {});

        nextRecord.name && params.push(['name', nextRecord.name]);
        nextRecord.type && params.push(['type', nextRecord.type]);
        nextRecord.identifier && params.push(['identifier', nextRecord.identifier]);

        var xhr = r53cli.listResourceRecordSets(hzid, params);
        var xml = xhr.xml();

        for each (var member in xml..ResourceRecordSets.ResourceRecordSet) {
          var name = member.Name.toString();

          try {
            member.Name = eval('"' + name + '"');
          } catch (e) {
            member.Name = name;
          }

          rows.push(member);
        }

        var isTruncated = ((xml.IsTruncated || '').toString().trim().toLowerCase() == 'true');

        if (isTruncated) {
          var nextRecord = {};
          nextRecord.name = (xml.NextRecordName || '').toString().trim();
          nextRecord.type = (xml.NextRecordType || '').toString().trim();
          nextRecord.identifier = (xml.NextRecordIdentifier || '').toString().trim();
          return nextRecord;
        } else {
          return null;
        }
      }

      var nextRecord = {};

      while (nextRecord) {
        nextRecord = walkRows(this.hostedZoneId, this.rows, nextRecord);
      }
    }.bind(this), $('rrset-window-loader'));

    var chageInfoButton = $('rrset-window-change-info-button');
    var changeIds = Prefs.getChangeIds(this.hostedZoneId);
    chageInfoButton.disabled = ((changeIds || []).length == 0);

    this.disableEditable();
    this.invalidate();
  },

  selectedRow: function() {
    var idx = this.selection.currentIndex;

    if (idx != -1) {
      this.selection.select(idx);
      return this.printRows[idx];
    } else {
      return null;
    }
  },

  selectedMultipleRows: function() {
    var rows = [];
    var start = {};
    var end = {};
    var numRanges = this.selection.getRangeCount();

    for (var t = 0; t < numRanges; t++) {
      this.selection.getRangeAt(t, start, end);

      for (var v = start.value; v <= end.value; v++) {
        rows.push(this.printRows[v]);
      }
    }

    return rows;
  },

  createRRSet: function() {
    var result = openModalDialog('rrset-create-window', {hostedZoneName:this.hostedZoneName});
    if (!result) { return; }

    var xml = <ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2011-05-05/"></ChangeResourceRecordSetsRequest>;

    if (result.comment) {
      xml.ChangeBatch.Comment = result.comment;
    }

    var change = xml.ChangeBatch.Changes.Change;
    change.Action = 'CREATE';
    change.ResourceRecordSet.Name = result.name;

    var alias = (result.type == 'AA');
    change.ResourceRecordSet.Type =  alias ? 'A' : result.type;

    if (result.identifier) {
      change.ResourceRecordSet.SetIdentifier = result.identifier;
    }

    if (result.weight) {
      change.ResourceRecordSet.Weight = result.weight;
    }

    if (alias) {
      var endpoint = ELBClient.getEndpoint(result.value);

      if (!endpoint) {
        alert('Cannot get ELB endpoint.');
        return;
      }

      var canonicalHostedZoneNameId = null;

      $ELB(endpoint, function(elbcli) {
        var xhr = elbcli.query('DescribeLoadBalancers');

        for each (var member in xhr.xml()..LoadBalancerDescriptions.member) {
          var r = new RegExp('^' + member.DNSName.toString().replace(/\./g, '\\.') + '\\.?$');

          if (r.test(result.value)) {
            canonicalHostedZoneNameId = member.CanonicalHostedZoneNameID.toString();
            break;
          }
        }

        if (!canonicalHostedZoneNameId) {
          alert('Cannot get Canonical Hosted Zone Name ID.');
        }
      }.bind(this), $('rrset-window-loader'));

      if (!canonicalHostedZoneNameId) {
        return;
      }

      change.ResourceRecordSet.AliasTarget.HostedZoneId = canonicalHostedZoneNameId;
      change.ResourceRecordSet.AliasTarget.DNSName = result.value;
    } else {
      change.ResourceRecordSet.TTL = result.ttl;

      var values = result.value.split(/\n+/);

      for (var i = 0; i < values.length; i ++) {
        var rr = new XML('<ResourceRecord></ResourceRecord>');
        rr.Value = values[i];
        change.ResourceRecordSet.ResourceRecords.ResourceRecord += rr;
      }
    }

    var xhr = null;

    $R53(function(r53cli) {
      xhr = r53cli.changeResourceRecordSets(this.hostedZoneId, '<?xml version="1.0" encoding="UTF-8"?>' + xml);
    }.bind(this), $('rrset-window-loader'));

    if (xhr && xhr.success()) {
      var changeInfo = xhr.xml()..ChangeInfo;
      var chid = changeInfo.Id.toString();
      chid = chid.split('/');
      chid = chid[chid.length - 1];
      Prefs.addChangeId(this.hostedZoneId, chid, changeInfo.SubmittedAt);
      openModalDialog('change-info-detail-window', {changeInfo:changeInfo});
      this.refresh();
    }
  },

  showDetail: function(event) {
    if (this.isTreeEditable()) {
      return;
    }

    var row = this.selectedRow();

    if (!row || (event && event.target.tagName != 'treechildren')) {
      return;
    }

    openModalDialog('rrset-detail-window', {resourceRecordSet:row});
  },

  editRRSet: function() {
    if (this.isTreeEditable()) {
      return;
    }

    var row = this.selectedRow();
    if (!row) { return; }

    var result = openModalDialog('rrset-edit-window', {resourceRecordSet:row});
    if (!result) { return; }

    var xml = <ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2011-05-05/"></ChangeResourceRecordSetsRequest>;

    if (result.comment) {
      xml.ChangeBatch.Comment = result.comment;
    }

    var alias = (result.type == 'AA');
    var ttl_is_changed = ((row.TTL.toString() != result.ttl) && !alias);

    var other_rows = [];

    for (var i = 0; ttl_is_changed && i < this.rows.length; i++) {
      if ((row.Name.toString() != this.rows[i].Name.toString()) ||
          (this.rows[i].AliasTarget.toString().trim()) ||
          (row.Type.toString() != this.rows[i].Type.toString()) ||
          (row.SetIdentifier.toString() == this.rows[i].SetIdentifier.toString())) {
        continue;
      }

      other_rows.push(this.rows[i]);
    }

    // DELETE
    function editRRSet_delete(delete_row) {
      var change_delete = new XML('<Change></Change>');
      change_delete.Action = 'DELETE';
      change_delete.ResourceRecordSet = delete_row;
      xml.ChangeBatch.Changes.Change += change_delete;
    }

    editRRSet_delete(row);

    for (var i = 0; ttl_is_changed && i < other_rows.length; i++) {
      editRRSet_delete(other_rows[i]);
    }

    // CREATE
    var error_happened = false;

    (function() {
      var change_create = new XML('<Change></Change>');
      change_create.Action = 'CREATE';
      change_create.ResourceRecordSet.Name = result.name;

      change_create.ResourceRecordSet.Type =  alias ? 'A' : result.type;

      if (result.identifier) {
        change_create.ResourceRecordSet.SetIdentifier = result.identifier;
      }

      if (result.weight) {
        change_create.ResourceRecordSet.Weight = result.weight;
      }

      if (alias) {
        var endpoint = ELBClient.getEndpoint(result.value);

        if (!endpoint) {
          alert('Cannot get ELB endpoint.');
          error_happened = true;
          return;
        }

        var canonicalHostedZoneNameId = null;

        $ELB(endpoint, function(elbcli) {
          var xhr = elbcli.query('DescribeLoadBalancers');

          for each (var member in xhr.xml()..LoadBalancerDescriptions.member) {
            var r = new RegExp('^' + member.DNSName.toString().replace(/\./g, '\\.') + '\\.?$');

            if (r.test(result.value)) {
              canonicalHostedZoneNameId = member.CanonicalHostedZoneNameID.toString();
              break;
            }
          }

          if (!canonicalHostedZoneNameId) {
            alert('Cannot get Canonical Hosted Zone Name ID.');
          }
        }.bind(this), $('rrset-window-loader'));

        if (!canonicalHostedZoneNameId) {
          error_happened = true;
          return;
        }

        change_create.ResourceRecordSet.AliasTarget.HostedZoneId = canonicalHostedZoneNameId;
        change_create.ResourceRecordSet.AliasTarget.DNSName = result.value;
      } else {
        change_create.ResourceRecordSet.TTL = result.ttl;

        var values = result.value.split(/\n+/);

        for (var i = 0; i < values.length; i ++) {
          var rr = new XML('<ResourceRecord></ResourceRecord>');
          rr.Value = values[i];
          change_create.ResourceRecordSet.ResourceRecords.ResourceRecord += rr;
        }
      }

      xml.ChangeBatch.Changes.Change += change_create;
    })();

    if (error_happened) {
      return;
    }

    for (var i = 0; ttl_is_changed && i < other_rows.length; i++) {
      var rrset_src = other_rows[i].toString().replace(/<TTL>[^<]+<\/TTL>/im, function(m) {
        return '<TTL>' + result.ttl + '</TTL>';
      });

      xml.ChangeBatch.Changes.Change += new XML('<Change><Action>CREATE</Action>' + rrset_src + '</Change>');
    }

    var xhr = null;

    $R53(function(r53cli) {
      xhr = r53cli.changeResourceRecordSets(this.hostedZoneId, '<?xml version="1.0" encoding="UTF-8"?>' + xml);
    }.bind(this), $('rrset-window-loader'));

    if (xhr && xhr.success()) {
      var changeInfo = xhr.xml()..ChangeInfo;
      var chid = changeInfo.Id.toString();
      chid = chid.split('/');
      chid = chid[chid.length - 1];
      Prefs.addChangeId(this.hostedZoneId, chid, changeInfo.SubmittedAt);
      openModalDialog('change-info-detail-window', {changeInfo:changeInfo});
      this.refresh();
    }
  },

  deleteRRSet: function() {
    if (this.isTreeEditable()) {
      return;
    }

    var selectedRows = this.selectedMultipleRows();
    if (!selectedRows || selectedRows.length < 1) { return; }

    var name = (selectedRows.length == 1) ? selectedRows[0].Name.toString() : '';

    var result = openModalDialog('rrset-delete-dialog', {name:name});
    if (!result) { return; }

    var comment = result.comment;

    var xml = <ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2011-05-05/"></ChangeResourceRecordSetsRequest>;

    if (comment) {
      xml.ChangeBatch.Comment = comment;
    }

    function deleteRRSet_delete(delete_row) {
      var change_delete = new XML('<Change></Change>');
      change_delete.Action = 'DELETE';
      change_delete.ResourceRecordSet = delete_row;
      xml.ChangeBatch.Changes.Change += change_delete;
    }

    for (var i = 0; i < selectedRows.length; i++) {
      deleteRRSet_delete(selectedRows[i]);
    }

    var xhr = null;

    $R53(function(r53cli) {
      xhr = r53cli.changeResourceRecordSets(this.hostedZoneId, '<?xml version="1.0" encoding="UTF-8"?>' + xml);
    }.bind(this), $('rrset-window-loader'));

    if (xhr && xhr.success()) {
      var changeInfo = xhr.xml()..ChangeInfo;
      var chid = changeInfo.Id.toString();
      chid = chid.split('/');
      chid = chid[chid.length - 1];
      Prefs.addChangeId(this.hostedZoneId, chid, changeInfo.SubmittedAt);
      openModalDialog('change-info-detail-window', {changeInfo:changeInfo});
      this.refresh();
    }
  },

  showChangeInfo: function() {
    var changeIds = Prefs.getChangeIds(this.hostedZoneId);

    if ((changeIds || []).length == 0) {
      alert('Cannot find Change Info.');
      return;
    }

    var result = openModalDialog('change-info-window', {changeIds:changeIds});
    if (!result) { return; }

    var xhr = null;

    $R53(function(r53cli) {
      xhr = r53cli.getChange(result.changeId);
    }.bind(this), $('rrset-window-loader'));

    if (xhr && xhr.success()) {
      openModalDialog('change-info-detail-window', {changeInfo:(xhr.xml()..ChangeInfo)});
    }
  },

  selectByName: function(name) {
    for (var i = 0; i < this.rows.length; i++) {
      var row = this.rows[i];

      if (user.Name.toString() == name.toString()) {
        this.selection.select(i);
      }
    }

    this.rows
  },

  editInlineRRSet: function() {
    var row_changes = [];

    for (var i in this.changes) {
      row_changes.push([this.printRows[i], this.changes[i]]);
    }

    if (row_changes.length == 0) { return; }

    var xml = <ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2011-05-05/"></ChangeResourceRecordSetsRequest>;

    // DELETE
    function editInlineRRSet_delete(delete_row) {
      var change_delete = new XML('<Change></Change>');
      change_delete.Action = 'DELETE';
      change_delete.ResourceRecordSet = delete_row;
      xml.ChangeBatch.Changes.Change += change_delete;
    }

    for (var i = 0; i < row_changes.length; i++) {
      editInlineRRSet_delete(row_changes[i][0]);
    }

    // CREATE
    function editInlineRRSet_create(create_row, change) {
      var change_create = new XML('<Change></Change>');
      change_create.Action = 'CREATE';

      for (var name in change) {
        create_row[name] = change[name]
      }

      change_create.ResourceRecordSet = create_row;
      xml.ChangeBatch.Changes.Change += change_create;
    }

    for (var i = 0; i < row_changes.length; i++) {
      editInlineRRSet_create(row_changes[i][0], row_changes[i][1]);
    }

    var xhr = null;

    $R53(function(r53cli) {
      xhr = r53cli.changeResourceRecordSets(this.hostedZoneId, '<?xml version="1.0" encoding="UTF-8"?>' + xml);
    }.bind(this), $('rrset-window-loader'));

    var retval = false;

    if (xhr && xhr.success()) {
      this.changes = {}
      var changeInfo = xhr.xml()..ChangeInfo;
      var chid = changeInfo.Id.toString();
      chid = chid.split('/');
      chid = chid[chid.length - 1];
      Prefs.addChangeId(this.hostedZoneId, chid, changeInfo.SubmittedAt);
      openModalDialog('change-info-detail-window', {changeInfo:changeInfo});
      this.refresh();
      retval = true;
    }

    return retval;
  },

  copyColumnToClipboard: function(name) {
    var row = this.selectedRow();

    if (row) {
      copyToClipboard($CELL(row, name, 0));
    }
  }
};
