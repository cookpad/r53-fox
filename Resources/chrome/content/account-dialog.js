Components.utils.import('resource://r53fox/preferences.jsm');
Components.utils.import('resource://r53fox/utils.jsm');

function onLoad() {
  $('account-dialog-access-key-id').value = Prefs.accessKeyId;
  $('account-dialog-secret-access-key').value = Prefs.secretAccessKey;
}

function onDialogAccept() {
  var args = window.arguments[0];

  var accessKeyId = $V('account-dialog-access-key-id');
  var secretAccessKey = $V('account-dialog-secret-access-key');

  if (!accessKeyId || !secretAccessKey) {
    alert("Please input 'AWS Access Key ID' and 'AWS Secret Access Key'.");
    return false;
  }

  args.accepted = true;
  args.result = {accessKeyId:accessKeyId, secretAccessKey:secretAccessKey};

  return true;
}
