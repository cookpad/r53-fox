Components.utils.import('resource://r53fox/utils.jsm');

function onLoad() {
  var hostedZoneName = window.arguments[0].hostedZoneName;
  $('rrset-create-window-name').value = '.' + hostedZoneName;
}

function onAccept() {
  try{
  var args = window.arguments[0];

  var name = $V('rrset-create-window-name');
  var type = $('rrset-create-window-type').selectedItem.value;
  var ttl = $V('rrset-create-window-ttl');
  var value = $V('rrset-create-window-value');
  var comment = $V('rrset-create-window-comment');

  if (!name || !ttl || !value) {
    alert("Please input 'Name', 'TTL' and 'Value'.");
    return;
  }

  args.accepted = true;
  args.result = {name:name, type:type, ttl:ttl, value:value, comment:comment};

  close();
  }catch(e){alert(e);}
}
