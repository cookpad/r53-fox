Components.utils.import('resource://r53fox/utils.jsm');

function onLoad() {
  var changeIds = window.arguments[0].changeIds;
  changeIds.reverse();

  var menulist = $('change-info-window-change-id');

  for (var i = 0; i < changeIds.length; i++) {
    var chid = changeIds[i];
    menulist.appendItem(chid, chid);
  }

  menulist.selectedIndex = 0;
}

function onAccept() {
  var args = window.arguments[0];

  var chid = $('change-info-window-change-id').selectedItem.value;

  args.accepted = true;
  args.result = {changeId:chid};

  close();
}
