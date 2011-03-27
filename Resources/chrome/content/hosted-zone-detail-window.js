Components.utils.import('resource://r53fox/utils.jsm');

function onLoad() {
  var xml = window.arguments[0].xml;
  var hostedZone = xml..HostedZone;
  var nss = [];

  for each (var member in xml..NameServers.NameServer) {
    nss.push(member.toString());
  }

  $('hosted-zone-detail-window-id').value = hostedZone.Id.toString();
  $('hosted-zone-detail-window-name').value = hostedZone.Name.toString();
  $('hosted-zone-detail-window-caller-reference').value = hostedZone.CallerReference.toString();
  $('hosted-zone-detail-window-comment').value = hostedZone.Config.Comment.toString();
  $('hosted-zone-detail-window-name-server').value = nss.join('\n');
}
