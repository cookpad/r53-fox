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
