Components.utils.import('resource://r53fox/utils.jsm');

function onAccept() {
  var args = window.arguments[0];

  var name = $V('hosted-zone-create-window-name');
  var cr = $V('hosted-zone-create-window-caller-reference');
  var comment = $V('hosted-zone-create-window-comment');

  if (!name || !cr) {
    alert("Please input 'Name' and 'Caller Reference'.");
    return;
  }

  args.accepted = true;
  args.result = {name:name, callerReference:cr, comment:comment};

  close();
}

function inputCallerReference() {
  var name = $V('hosted-zone-create-window-name');
  var cre = $('hosted-zone-create-window-caller-reference');
  if ((cre.value || '').trim() || !name) { return; }
  cre.value = ['CreateHostedZone', name, (new Date()).toString()].join(', ');
}
