Components.utils.import('resource://r53fox/preferences.jsm');
Components.utils.import('resource://r53fox/utils.jsm');

function onLoad() {
  $('account-dialog-access-key-id').value = Prefs.accessKeyId;
  $('account-dialog-secret-access-key').value = Prefs.secretAccessKey;
  var algorythm = $('account-dialog-algorythm');

  if (Prefs.algorythm == 'HmacSHA1') {
    algorythm.selectedIndex = 0;
  } else {
    algorythm.selectedIndex = 1;
  }
}

function onDialogAccept() {
  var args = window.arguments[0];

  var accessKeyId = $V('account-dialog-access-key-id');
  var secretAccessKey = $V('account-dialog-secret-access-key');
  var algorythm = $('account-dialog-algorythm').selectedItem.value;

  if (!accessKeyId || !secretAccessKey) {
    alert("Please input 'AWS Access Key ID' and 'AWS Secret Access Key'.");
    return false;
  }

  args.accepted = true;
  args.result = {accessKeyId:accessKeyId, secretAccessKey:secretAccessKey, algorythm:algorythm};

  return true;
}
