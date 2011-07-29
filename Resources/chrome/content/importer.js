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

function Importer() {
}

Importer.prototype = {
  importData: function() {
    var fp = createFilePicker();
    fp.init(window, 'Import Data from JSON', Components.interfaces.nsIFilePicker.modeOpen);
    fp.defaultString = 'zones.json';
    fp.appendFilter('JSON (*.json)', '*.json');

    var result = fp.show();

    switch (result) {
    case Components.interfaces.nsIFilePicker.returnOK:
    case Components.interfaces.nsIFilePicker.returnReplace:
      this.readDataFromFile(fp.file);
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

    var data = this.getCurrentData();

    try {
      for (var name in new_data) {
        var row = data[name];
        var new_row = new_data[name];
        var hzid = null;

        if (row) {
          hzid = row.HostedZoneId;
        } else {
          hzid = this.createHostedZone(name, new_row.CallerReference, new_row.Comment);
        }

        var rrsets = ((row || {}).ResourceRecordSets || []);
        var new_rrsets = (new_row.ResourceRecordSets || []);

        this.createRRSets(hzid, rrsets, new_rrsets);
      }

      $view.refresh();
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

          var row = {
            Name: member.Name.toString(),
            SetIdentifier: member.SetIdentifier.toString(),
            Weight: member.Weight.toString(),
            TTL: member.TTL.toString(),
            Value: values
          };

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

  createHostedZone: function(name, caller_ref, comment) {
    var xml = <CreateHostedZoneRequest xmlns="https://route53.amazonaws.com/doc/2011-05-05/"></CreateHostedZoneRequest>;
    xml.Name = name;
    xml.CallerReference = (caller_ref || ['CreateHostedZone', name, (new Date()).toString()].join(', '));

    if (comment) {
      xml.HostedZoneConfig.Comment = comment;
    }

    var hzid = null;

    $R53(function(r53cli) {
      var xhr = r53cli.createHostedZone('<?xml version="1.0" encoding="UTF-8"?>' + xml);
      hzid = this.basehzid(xhr.xml().HostedZone.Id.toString());
    }.bind(this), $('main-window-loader'));

    return hzid;
  },

  createRRSets: function(hzid, rrsets, new_rrsets) {
  },

  basehzid: function(hzid) {
    hzid = hzid.split('/');
    return hzid[hzid.length - 1];
  }
};
