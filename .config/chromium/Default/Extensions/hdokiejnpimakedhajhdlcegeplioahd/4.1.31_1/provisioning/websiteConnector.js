document.addEventListener( "DOMContentLoaded", function(){
            document.removeEventListener( "DOMContentLoaded", arguments.callee, false );
			document.body.setAttribute('lastpass-extension-id', '1');
			document.body.setAttribute('lastpass-extension-version', '1');
        }, false );
		
var sendBackground = LPPlatform.requestFrameworkInitializer(function(message) {
  window.postMessage(message, window.location.origin);
});

window.addEventListener('message', function(ev) {
  if (ev.origin === window.location.origin) {
	sendBackground(ev.data);
  }
});
