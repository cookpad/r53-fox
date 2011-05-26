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
}

RRSetTreeView.prototype = {
  getCellText: function(row, column) {
    var row = this.printRows[row];
    var text = $CELL(row, column.id);

    if (/Type$/.test(column.id.toString()) && row.AliasTarget.toString()) {
      text = 'A (Alias)';
    }

    return text;
  },

  setTree: function(tree) {
    this.tree = tree;
  },

  isSorted: function() {
    return this.sorted;
  },

  cycleHeader: function(column) {
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
      var xhr = r53cli.listResourceRecordSets(this.hostedZoneId);

      for each (var member in xhr.xml()..ResourceRecordSets.ResourceRecordSet) {
        this.rows.push(member);
      }
    }.bind(this), $('rrset-window-loader'));

    var chageInfoButton = $('rrset-window-change-info-button');
    var changeIds = Prefs.getChangeIds(this.hostedZoneId);
    chageInfoButton.disabled = ((changeIds || []).length == 0);

    this.invalidate();
  },

  selectedRow: function() {
    var idx = this.selection.currentIndex;
    return (idx != -1) ? this.printRows[idx] : null;
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
    var row = this.selectedRow();

    if (!row || (event && event.target.tagName != 'treechildren')) {
      return;
    }

    openModalDialog('rrset-detail-window', {resourceRecordSet:row});
  },

  editRRSet: function() {
    var row = this.selectedRow();
    if (!row) { return; }

    var result = openModalDialog('rrset-edit-window', {resourceRecordSet:row});
    if (!result) { return; }

    var xml = <ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2011-05-05/"></ChangeResourceRecordSetsRequest>;

    if (result.comment) {
      xml.ChangeBatch.Comment = result.comment;
    }

    // DELETE
    (function() {
      var values = [];

      for each (var member in row..ResourceRecords.ResourceRecord) {
        values.push(member.Value.toString());
      }

      var change_delete = new XML('<Change></Change>');
      change_delete.Action = 'DELETE';
      change_delete.ResourceRecordSet.Name = row.Name.toString();
      change_delete.ResourceRecordSet.Type = row.Type.toString();

      if (row.SetIdentifier.toString().trim()) {
        change_delete.ResourceRecordSet.SetIdentifier = row.SetIdentifier.toString();
      }

      if (row.Weight.toString().trim()) {
        change_delete.ResourceRecordSet.Weight = row.Weight.toString();
      }

      if (row.AliasTarget.toString().trim()) {
        change_delete.ResourceRecordSet.AliasTarget.HostedZoneId = row.AliasTarget.HostedZoneId.toString();
        change_delete.ResourceRecordSet.AliasTarget.DNSName = row.AliasTarget.DNSName.toString();
      } else {
        change_delete.ResourceRecordSet.TTL = row.TTL.toString();

        for (var i = 0; i < values.length; i ++) {
          var rr = new XML('<ResourceRecord></ResourceRecord>');
          rr.Value = values[i];
          change_delete.ResourceRecordSet.ResourceRecords.ResourceRecord += rr;
        }
      }

      xml.ChangeBatch.Changes.Change += change_delete;
    })();

    // CREATE
    var error_happened = false;

    (function() {
      var change_create = new XML('<Change></Change>');
      change_create.Action = 'CREATE';
      change_create.ResourceRecordSet.Name = result.name;

      var alias = (result.type == 'AA');
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
    var row = this.selectedRow();
    if (!row) { return; }

    var name = row.Name.toString();

    var result = openModalDialog('rrset-delete-dialog', {name:name});
    if (!result) { return; }

    var type = row.Type.toString();
    var identifier = row.SetIdentifier.toString().trim();
    var weight = row.Weight.toString().trim();
    var ttl = row.TTL.toString();
    var values = [];
    var comment = result.comment;

    for each (var member in row..ResourceRecords.ResourceRecord) {
      values.push(member.Value.toString());
    }

    var xml = <ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2011-05-05/"></ChangeResourceRecordSetsRequest>;

    if (comment) {
      xml.ChangeBatch.Comment = comment;
    }

    var change = xml.ChangeBatch.Changes.Change;
    change.Action = 'DELETE';
    change.ResourceRecordSet.Name = name;
    change.ResourceRecordSet.Type = type;

    if (identifier) {
      change.ResourceRecordSet.SetIdentifier = identifier;
    }

    if (weight) {
      change.ResourceRecordSet.Weight = weight;
    }

    if (row.AliasTarget.toString().trim()) {
      change.ResourceRecordSet.AliasTarget.HostedZoneId = row.AliasTarget.HostedZoneId.toString();
      change.ResourceRecordSet.AliasTarget.DNSName = row.AliasTarget.DNSName.toString();
    } else {
      change.ResourceRecordSet.TTL = ttl;

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

  copyColumnToClipboard: function(name) {
    var row = this.selectedRow();

    if (row) {
      copyToClipboard($CELL(row, name, 0));
    }
  }
};
