var EXPORTED_SYMBOLS = [
  '$', '$V',
  'openModalDialog'
  ];


function $(element) {
  return this.document.getElementById(element);
}

function $V(element) {
  return (this.document.getElementById(element).value || '').trim();
}

function openModalDialog(window, name, features) {
  if (!features) {
    features = 'chrome,modal,centerscreen';
  }

  var retval = {accepted:false, result:null};

  window.openDialog('chrome://r53fox/content/' + name + '.xul', name, features, retval);

  return retval;
}
