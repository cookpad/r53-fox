Components.utils.import('resource://r53fox/utils.jsm');

function onAccept() {
  var args = window.arguments[0];

  var hzid = $V('hosted-zone-create-window-id');
  var name = $V('hosted-zone-create-window-name');
  var cr = $V('hosted-zone-create-window-caller-reference');
  var comment = $V('hosted-zone-create-window-comment');

  if (!hzid || !name || !cr) {
    alert("Please input 'ID', 'Name' and 'Caller Reference'.");
    return;
  }

  args.accepted = true;
  args.result = {hostedZoneId:hzid, name:name, callerReference:cr, comment:comment};

  close();
}
