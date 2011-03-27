Components.utils.import('resource://r53fox/utils.jsm');

function onLoad() {
  beep();

  var error = window.arguments[0].error;
  $('errpr-dialog-type').value = error.Type;
  $('errpr-dialog-code').value = error.Code;
  $('errpr-dialog-message').value = error.Message;
}
