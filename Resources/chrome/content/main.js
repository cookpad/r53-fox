Components.utils.import('resource://r53fox/preferences.jsm');
Components.utils.import('resource://r53fox/utils.jsm');

function onLoad() {
  try {
  var tree = $('hosted-zone-tree');
  $view = new HostedZoneTreeView();
  tree.view = $view;
  } catch (e) {
    alert(e);
  }
}

function example() {
  try {
    $R53(function(r53cli) {
      var xhr = r53cli.listHostedZones();
      alert(xhr.xml());
    }, $('main-window-loader'));
  } catch (e) {
    alert(e);
  }
}

function editAccount() {
  openModalDialog('account-dialog', function(result) {
    Prefs.accessKeyId = result.accessKeyId;
    Prefs.secretAccessKey = result.secretAccessKey;
  });
}
