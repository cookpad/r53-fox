Components.utils.import('resource://r53fox/utils.jsm');

function onLoad() {
  var changeInfo = window.arguments[0].changeInfo;

  $('change-info-detail-window-id').value = changeInfo.Id.toString();
  $('change-info-detail-window-status').value = changeInfo.Status.toString();
  $('change-info-detail-window-submitted-at').value = changeInfo.SubmittedAt.toString();
}
