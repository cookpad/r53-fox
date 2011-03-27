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
    return $CELL(this.printRows[row], column.id);
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

    this.invalidate();
  },

  selectedRow: function() {
    var idx = this.selection.currentIndex;
    return (idx != -1) ? this.printRows[idx] : null;
  },

  createRRSet: function() {
    var result = openModalDialog('rrset-create-window', {hostedZoneName:this.hostedZoneName});
    if (!result) { return; }

    var xml = <ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2010-10-01/"></ChangeResourceRecordSetsRequest>;

    if (result.comment) {
      xml.ChangeBatch.Comment = result.comment;
    }

    var change = xml.ChangeBatch.Changes.Change;
    change.Action = 'CREATE';
    change.ResourceRecordSet.Name = result.name;
    change.ResourceRecordSet.Type = result.type;
    change.ResourceRecordSet.TTL = result.ttl;

    var values = result.value.split(/\n+/);

    for (var i = 0; i < values.length; i ++) {
      var rr = new XML('<ResourceRecord><Value>' + values[i] + '</Value></ResourceRecord>');
      change.ResourceRecordSet.ResourceRecords.ResourceRecord += rr;
    }

    $R53(function(r53cli) {
      r53cli.changeResourceRecordSets(this.hostedZoneId, '<?xml version="1.0" encoding="UTF-8"?>' + xml);
      this.refresh();
    }.bind(this), $('rrset-window-loader'));
  },

  showDetail: function(event) {
    var row = this.selectedRow();

    if (!row || (event && event.target.tagName != 'treechildren')) {
      return;
    }

    openModalDialog('rrset-detail-window', {resourceRecordSet: row});
  },

  deleteRRSet: function() {
    var row = this.selectedRow();
    if (!row) { return; }

    var name = row.Name.toString();

    if (!confirm("Are you sure you want to delete '" + name + "' ?")) {
      return;
    }

    var type = row.Type.toString();
    var ttl = row.TTL.toString();
    var values = [];

    for each (var member in row..ResourceRecords.ResourceRecord) {
      values.push(member.Value.toString());
    }

    var xml = <ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2010-10-01/"></ChangeResourceRecordSetsRequest>;

    // XXX:
    //xml.ChangeBatch.Comment = ;

    var change = xml.ChangeBatch.Changes.Change;
    change.Action = 'DELETE';
    change.ResourceRecordSet.Name = name;
    change.ResourceRecordSet.Type = type;
    change.ResourceRecordSet.TTL = ttl;

    for (var i = 0; i < values.length; i ++) {
      var rr = new XML('<ResourceRecord><Value>' + values[i] + '</Value></ResourceRecord>');
      change.ResourceRecordSet.ResourceRecords.ResourceRecord += rr;
    }

    $R53(function(r53cli) {
      r53cli.changeResourceRecordSets(this.hostedZoneId, '<?xml version="1.0" encoding="UTF-8"?>' + xml);
      this.refresh();
    }.bind(this), $('rrset-window-loader'));
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
