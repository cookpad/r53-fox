Components.utils.import('resource://r53fox/utils.jsm');

function onLoad() {
  var name = window.arguments[0].name;
  document.title = "Delete '" + name + "'";
}

function onDialogAccept() {
  var args = window.arguments[0];
  var comment = $V('rrset-delete-dialog-comment');

  args.accepted = true;
  args.result = {comment:comment};

  return true;
}
