Components.utils.import('resource://r53fox/preferences.jsm');
Components.utils.import('resource://r53fox/utils.jsm');

function onLoad() {
  var tree = $('hosted-zone-tree');
  $view = new HostedZoneTreeView();
  tree.view = $view;
  $view.refresh();
}

function editAccount() {
  var result = openModalDialog('account-dialog');

  if (result) {
    Prefs.accessKeyId = result.accessKeyId;
    Prefs.secretAccessKey = result.secretAccessKey;
    $view.refresh();
  }
}

function about() {
  openModalDialog('about-dialog');
}
