function HostedZoneTreeView() {
  this.rows = [];
  this.printRows = [];
  this.rowCount = 0;
  this.selection = null;
  this.sorted = false;
}

HostedZoneTreeView.prototype = {
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

    var filterValue = $V('hosted-zone-tree-filter');

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
      var xhr = r53cli.listHostedZones();

      for each (var member in xhr.xml()..HostedZones.HostedZone) {
        this.rows.push(member);
      }
    }.bind(this), $('main-window-loader'));

    this.invalidate();
    /*
    this.rows.length = 0;

    protect(function() {
      var xhr = inProgress(function() {
        return this.iamcli.query_or_die('ListUsers');
      }.bind(this));

      var pathList = ['/'];

      for each (var member in xhr.xml()..Users.member) {
        this.rows.push(member);
        pathList.push(member.Path.toString());
      }

      var pathFilter = $('user-tree-path-filter');
      pathFilter.removeAllItems();
      pathList = pathList.uniq().sort();

      for (var i = 0; i < pathList.length; i++) {
        var path = pathList[i];
        pathFilter.appendItem(path, path);
      }

      pathFilter.selectedIndex = 0;

      this.invalidate();
    }.bind(this));
      */
  },

  selectedRow: function() {
    var idx = this.selection.currentIndex;
    return (idx != -1) ? this.printRows[idx] : null;
  },

  showDetail: function(event) {
    var row = this.selectedRow();

    if (!row || (event && event.target.tagName != 'treechildren')) {
      return;
    }

    var hzid = this.hostedZoneId(row);
    var xhr = null;

    $R53(function(r53cli) {
      xhr = r53cli.getHostedZone(hzid);
    }, $('main-window-loader'));

    if (xhr && xhr.success()) {
      openModalDialog('hosted-zone-detail-window', {xml: xhr.xml()});
    }
  },
  

  deleteRow: function() {
    var row = this.selectedRow();
    if (!row) { return; }

    var name = row.Name.toString();

    if (!confirm("Are you sure you want to delete '" + name + "' ?")) {
      return;
    }

    /*
    protect(function() {
      inProgress(function() {
        var xhr = this.iamcli.query_or_die('ListAccessKeys', [['UserName', userName]]);

        for each (var member in xhr.xml()..AccessKeyMetadata.member) {
          var params = [['UserName', userName], ['AccessKeyId', member.AccessKeyId]];
          this.iamcli.query_or_die('DeleteAccessKey', params);
        }

        xhr = this.iamcli.query_or_die('ListGroupsForUser', [['UserName', userName]]);

        for each (var member in xhr.xml()..Groups.member) {
          var params = [['UserName', userName], ['GroupName', member.GroupName]];
          this.iamcli.query_or_die('RemoveUserFromGroup', params);
        }

        xhr = this.iamcli.query_or_die('ListSigningCertificates', [['UserName', userName]]);

        for each (var member in xhr.xml()..Certificates.member) {
          var params = [['UserName', userName], ['CertificateId', member.CertificateId]];
          this.iamcli.query_or_die('DeleteSigningCertificate', params);
        }

        xhr = this.iamcli.query_or_die('ListUserPolicies', [['UserName', userName]]);

        for each (var member in xhr.xml()..PolicyNames.member) {
          var params = [['UserName', userName], ['PolicyName', member]];
          this.iamcli.query_or_die('DeleteUserPolicy', params);
        }

        this.iamcli.query_or_die('DeleteUser', [['UserName', userName]]);

        Prefs.deleteUserAccessKeyId(userName);
        Prefs.deleteUserSecretAccessKey(userName);

        this.refresh();
      }.bind(this));
    }.bind(this));
      */
  },

  /*
  openUserEditDialog: function() {
    var user = this.selectedRow();
    openDialog('chrome://iamfox/content/user-edit-dialog.xul', 'user-edit-dialog', 'chrome,modal',
               {view:this, inProgress:inProgress, user:user});
  },

  openViewKeyDialog: function() {
    var user = this.selectedRow();
    openDialog('chrome://iamfox/content/user-view-key-dialog.xul', 'user-edit-dialog', 'chrome,modal',
               {view:this, inProgress:inProgress, user:user});
  },

  openUserCreateLoginProfileDialog: function() {
    var user = this.selectedRow();
    openDialog('chrome://iamfox/content/user-create-login-profile-dialog.xul', 'user-create-login-profile-dialog', 'chrome,modal',
               {view:this, inProgress:inProgress, user:user});
  },

  openUserOpenConsoleDialog: function() {
    var user = this.selectedRow();
    openDialog('chrome://iamfox/content/user-open-console-dialog.xul', 'user-open-console-dialog', 'chrome,modal', {user:user});
  },
*/
  selectByName: function(name) {
    for (var i = 0; i < this.rows.length; i++) {
      var row = this.rows[i];

      if (user.Name.toString() == name.toString()) {
        this.selection.select(i);
      }
    }

    this.rows
  },
/*
  openUserGroupWindow: function() {
    var user = this.selectedRow();

    openModalWindow('user-group-window.xul', 'user-cert-window', 400, 400,
                    {iamcli:this.iamcli, userName:user.UserName});
  },

  deleteLoginProfile: function() {
    var user = this.selectedRow();
    var userName = user.UserName;

    if (!confirm("Are you sure you want to delete '" + userName + "'s login profile' ?")) {
      return;
    }

    protect(function() {
      inProgress(function() {
        this.iamcli.query_or_die('DeleteLoginProfile', [['UserName', userName]]);
      }.bind(this));
    }.bind(this));
  },

  copyColumnToClipboard: function(name) {
    var row = this.selectedRow();

    if (row) {
      copyToClipboard(row[name].toString());
    }
  }
    */

  hostedZoneId: function(row) {
    var hzid = row.Id.toString();
    hzid = hzid.split('/');
    return hzid[hzid.length - 1];
  }
};
