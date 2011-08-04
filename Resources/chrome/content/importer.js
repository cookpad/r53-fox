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

Components.utils.import('resource://r53fox/io.jsm');

function Importer(exporter) {
  this.exporter = exporter;
}

Importer.prototype = {
  importData: function() {
    var fp = createFilePicker('impexp', function(picker) {
      picker.defaultString = 'zones.json';
      picker.appendFilter('*.json', '*.json');
    });

    fp.init(window, 'Import Data from JSON', Components.interfaces.nsIFilePicker.modeOpen);

    var result = fp.show();

    switch (result) {
    case Components.interfaces.nsIFilePicker.returnOK:
    case Components.interfaces.nsIFilePicker.returnReplace:
      this.readDataFromFile(fp.file);
      $view.refresh();
      break;
    }
  },

  readDataFromFile: function(fin) {
    var new_data = FileIO.read(fin);

    if (!new_data) {
      alert("Cannnot read file.");
      return false;
    }

    try {
      new_data = eval('(' + new_data + ')');
    } catch (e) {
      alert(e);
      return false;
    }

    var data = this.exporter.getCurrentData();

    try {
      for (var name in new_data) {
        var row = data[name];
        var new_row = new_data[name];
        var hzid = null;

        if (row) {
          hzid = row.HostedZoneId;
        } else {
          hzid = this.createHostedZone(name, new_row.Comment);
        }

        if (!hzid) {
          return false;
        }

        var rrsets = ((row || {}).ResourceRecordSets || []);
        var new_rrsets = (new_row.ResourceRecordSets || []);

        if (!this.createRRSets(hzid, rrsets, new_rrsets)) {
          return false;
        }
      }
    } catch (e) {
      alert(e);
      return false;
    }
  },

  getCurrentData: function() {
    var data = {};

    $R53(function(r53cli) {
      var xhr = r53cli.listHostedZones();
      for each (var member in xhr.xml()..HostedZones.HostedZone) {
        data[member.Name.toString()] = {
          HostedZoneId: this.basehzid(member.Id.toString()),
          CallerReference: member.CallerReference.toString(),
          Comment: member.Config.Comment.toString(),
          ResourceRecordSets: []
        };
      }
    }.bind(this), $('main-window-loader'));

    for (var name in data) {
      var rrsets = data[name].ResourceRecordSets;
      var hzid = data[name].HostedZoneId;

      $R53(function(r53cli) {
        var xhr = r53cli.listResourceRecordSets(hzid);

        for each (var member in xhr.xml()..ResourceRecordSets.ResourceRecordSet) {
          var values = [];
          var name = member.Name.toString();

          var row = {
            SetIdentifier: member.SetIdentifier.toString(),
            Weight: member.Weight.toString(),
            TTL: member.TTL.toString(),
            Value: values
          };

          try {
            row.Name = eval('"' + name + '"');
          } catch (e) {
            row.Name = name;
          }

          if (member.AliasTarget.toString().trim()) {
            row.Type = 'A (Alias)';
            values.push(member.AliasTarget.DNSName.toString());
          } else {
            for each (var rr in member..ResourceRecords.ResourceRecord) {
              values.push(rr.Value.toString());
            }

            row.Type = member.Type.toString();
          }

          rrsets.push(row);
        }
      }.bind(this), $('main-window-loader'));
    }

    return data;
  },

  createHostedZone: function(name, comment) {
    var xml = <CreateHostedZoneRequest xmlns="https://route53.amazonaws.com/doc/2011-05-05/"></CreateHostedZoneRequest>;
    xml.Name = name;
    xml.CallerReference = ['CreateHostedZone', name, (new Date()).toString()].join(', ');

    if (comment) {
      xml.HostedZoneConfig.Comment = comment;
    }

    var xhr = null;

    $R53(function(r53cli) {
      xhr = r53cli.createHostedZone('<?xml version="1.0" encoding="UTF-8"?>' + xml);
    }.bind(this), $('main-window-loader'));

    return (xhr && xhr.success()) ? this.basehzid(xhr.xml().HostedZone.Id.toString()) : null;
  },

  createRRSets: function(hzid, rrsets, new_rrsets) {
    var rows = {};
    var change_count = 0;

    for (var i = 0; i < rrsets.length; i ++) {
      var row = rrsets[i];
      var row_id = row.Name + ' ' + row.Type + ' ' + row.SetIdentifier;
      rows[row_id] = row;
    }

    var xml = <ChangeResourceRecordSetsRequest xmlns="https://route53.amazonaws.com/doc/2011-05-05/"></ChangeResourceRecordSetsRequest>;

    for (var i = 0; i < new_rrsets.length; i++) {
      var new_row = new_rrsets[i];

      if (({NS:1, SOA:1})[new_row.Type]) {
        continue;
      }

      var new_row_id = new_row.Name + ' ' + new_row.Type + ' ' + new_row.SetIdentifier;

      if (!rows[new_row_id]) {
        if (!this.appendChange(new_row, xml)) { return(false); }
        change_count++;
      }
    }

    if (change_count < 1) {
      return true;
    }

    var xhr = null;

    $R53(function(r53cli) {
      xhr = r53cli.changeResourceRecordSets(hzid, '<?xml version="1.0" encoding="UTF-8"?>' + xml);
    }.bind(this), $('main-window-loader'));

    return (xhr && xhr.success());
  },

  appendChange: function(row, xml) {
    var change = new XML('<Change></Change>');
    change.Action = 'CREATE';
    change.ResourceRecordSet.Name = row.Name;

    var alias = (row.Type == 'A (Alias)');
    change.ResourceRecordSet.Type =  alias ? 'A' : row.Type;

    if (row.SetIdentifier) {
      change.ResourceRecordSet.SetIdentifier = row.SetIdentifier;
    }

    if (row.Weight) {
      change.ResourceRecordSet.Weight = row.Weight;
    }

    if (alias) {
      var endpoint = ELBClient.getEndpoint(row.Value[0]);

      if (!endpoint) {
        alert('Cannot get ELB endpoint.');
        return false;
      }

      var canonicalHostedZoneNameId = null;

      $ELB(endpoint, function(elbcli) {
        var xhr = elbcli.query('DescribeLoadBalancers');

        for each (var member in xhr.xml()..LoadBalancerDescriptions.member) {
          var r = new RegExp('^' + member.DNSName.toString().replace(/\./g, '\\.') + '\\.?$');

          if (r.test(row.Value[0])) {
            canonicalHostedZoneNameId = member.CanonicalHostedZoneNameID.toString();
            break;
          }
        }

        if (!canonicalHostedZoneNameId) {
          alert('Cannot get Canonical Hosted Zone Name ID.');
        }
      }.bind(this), $('main-window-loader'));

      if (!canonicalHostedZoneNameId) {
        return false;
      }

      change.ResourceRecordSet.AliasTarget.HostedZoneId = canonicalHostedZoneNameId;
      change.ResourceRecordSet.AliasTarget.DNSName = row.Value[0];
    } else {
      change.ResourceRecordSet.TTL = row.TTL;

      for (var i = 0; i < row.Value.length; i ++) {
        var rr = new XML('<ResourceRecord></ResourceRecord>');
        rr.Value = row.Value[i];
        change.ResourceRecordSet.ResourceRecords.ResourceRecord += rr;
      }
    }

    xml.ChangeBatch.Changes.Change += change;

    return true;
  },

  basehzid: function(hzid) {
    hzid = hzid.split('/');
    return hzid[hzid.length - 1];
  }
};
