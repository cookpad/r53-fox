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

function Exporter() {
}

Exporter.prototype = {
  exportData: function() {
    var fp = createFilePicker('impexp', function(picker) {
      picker.defaultString = 'zones.json';
      picker.appendFilter('*.json', '*.json');
    });

    fp.init(window, 'Export Data to JSON', Components.interfaces.nsIFilePicker.modeSave);

    var result = fp.show();

    switch (result) {
    case Components.interfaces.nsIFilePicker.returnOK:
    case Components.interfaces.nsIFilePicker.returnReplace:
      this.writeDataToFile(fp.file);
      break;
    }
  },

  writeDataToFile: function(fout) {
    var data = this.getCurrentData();
    var rv = FileIO.write(fout, JSON.stringify(data, null, "  "));
    alert('Export was completed.');
    return rv;
  },

  getCurrentData: function() {
    var data = {};

    function basehzid(hzid) {
      hzid = hzid.split('/');
      return hzid[hzid.length - 1];
    }

    $R53(function(r53cli) {
      function walkRows(marker) {
        var params = [];

        if (marker) {
          params.push(['marker', marker])
        }

        var xhr = r53cli.listHostedZones(params);
        var xml = xhr.xml();

        for each (var member in xml..HostedZones.HostedZone) {
          var name = member.Name.toString();

          try {
            member.Name = eval('"' + name + '"');
          } catch (e) {
            member.Name = name;
          }

          data[member.Name.toString()] = {
            HostedZoneId: basehzid(member.Id.toString()),
            CallerReference: member.CallerReference.toString(),
            Comment: member.Config.Comment.toString(),
            ResourceRecordSets: []
          };
        }

        var isTruncated = ((xml.IsTruncated || '').toString().trim().toLowerCase() == 'true');

        return isTruncated ? (xml.NextMarker || '').toString().trim() : null;
      }

      var marker = walkRows();

      while (marker) {
        marker = walkRows(marker);
      }
    }.bind(this), $('main-window-loader'));

    for (var name in data) {
      var rrsets = data[name].ResourceRecordSets;
      var hzid = data[name].HostedZoneId;

      $R53(function(r53cli) {
        function walkRows(nextRecord) {
          var params = [];
          nextRecord = (nextRecord || {});

          nextRecord.name && params.push(['name', nextRecord.name]);
          nextRecord.type && params.push(['type', nextRecord.type]);
          nextRecord.identifier && params.push(['identifier', nextRecord.identifier]);

          var xhr = r53cli.listResourceRecordSets(hzid, params);
          var xml = xhr.xml();

          for each (var member in xml..ResourceRecordSets.ResourceRecordSet) {
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
          nextRecord = walkRows(nextRecord);
        }
      }.bind(this), $('main-window-loader'));
    }

    return data;
  }
};
