Components.utils.import('resource://r53fox/preferences.jsm');
Components.utils.import('resource://r53fox/utils.jsm');

function onLoad() {
  var args = window.arguments[0];
  var hostedZoneId = args.hostedZoneId;
  var hostedZoneName = args.hostedZoneName;

  document.title = hostedZoneName;

  var tree = $('rrset-tree');
  $view = new RRSetTreeView(hostedZoneId, hostedZoneName);
  tree.view = $view;
  $view.refresh();
}
