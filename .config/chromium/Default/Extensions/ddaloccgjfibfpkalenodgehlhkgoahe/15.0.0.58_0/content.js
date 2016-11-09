// Main Content Script:
// This script runs in the protected extension environment and does not have
// full access to the underlying page.

;(function(){
    // content scripts *might* get loaded multiple times for one frame
    if (window.nuanriaInitialized) {
		//console.log("window.nuanriaInitialized already initialized");
        return;
    }
    window.nuanriaInitialized = true;

    nuanria.Chrome.init();

    // ------------------------------------------------------------------------
    // Marking of "local" frames:

    var iframes = document.querySelectorAll("iframe");
    for (var i = 0; i < iframes.length; i++) {
        initLocalFrame(iframes[i]);
    }

    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            for (var i = 0; i < mutation.addedNodes.length; i++) {
                var node = mutation.addedNodes[i];
                if (node.nodeName == "IFRAME") {
                    initLocalFrame(node);
                }
            }
        });
    });
    observer.observe(document, {childList: true, subtree: true});

    function initLocalFrame(iframe) {
        if (!iframe.contentWindow) {
            return;
        }

        iframe.setAttribute("nuan_newframe", true);
    }

    // ------------------------------------------------------------------------
    // Ping

    document.addEventListener('nuan-ria-ping', function() {
        chrome.runtime.sendMessage({type:"ria-ping"}, function(isAlive) {
            var aliveEvent = document.createEvent("CustomEvent");
            aliveEvent.initCustomEvent("nuan-ria-alive", true, true, isAlive);
            document.dispatchEvent(aliveEvent);
        });
    });
}());