var nuanria = nuanria || {};
nuanria.Chrome = nuanria.Chrome || {};
nuanria.globals = nuanria.globals || {};

;(function(){
    var _initialized = false;

    /*
     * Kicks off initialization of RIA. This happens
     * for every frame / window in the page.
     */
    nuanria.Chrome.init = function () {
        // Store the start time of the load
        nuanria.globals.t0 = performance.now();
        //nuanria.utils.logPerform("Start init for", document.location.href, "=", this.t0, "ms");
        beginInit();
    };

    /*
     * Waits for background script to become ready and
     * then proceeds with finishInit()
     */
    function beginInit() {
        if (_initialized) {
            // init has already finished
            return;
        }

        // ping background script until it becomes ready
        chrome.runtime.sendMessage(
            {type: "ria-ping"},
            function(response) {
                finishInit();
            }
        );

        // keep pinging until we get a response
        setTimeout(beginInit, 50);
    }

    /*
     * Performs init tasks including creating a pluginApi
     * object that is compatible with RIA NativeMessaging Host,
     * and initializing the RIA controller.
     */
    function finishInit() {
        if (_initialized) {
            // init has already finished
            return;
        }

        var pluginApi = null;

        if (window.top === self) {
            // pluginApi is only needed for main window
            pluginApi =  new nuanria.Chrome.dgnRiaApi();

            window.addEventListener("unload", function(ev) {
                if (pluginApi.isConnected()) {
                    pluginApi.disconnect();
                }
            });
        }

        new nuanria.Controller(window).init(null, pluginApi);
        _initialized = true;
        nuanria.utils.logPerform("Finish Init for", document.location.href, "=", performance.now(), "ms");
    }

    /*
     * Implements the plugin API. Relays messages to and from
     * the Native Messaging Host.
     */
    nuanria.Chrome.dgnRiaApi = function() {
        var _connected = false;
        var _jsDelegate = null;

        this.Status_Stopped   = 1;
        this.Status_NoProfile = 2;
        this.Status_Ready     = 3;
        this.Status_Error     = 4;

        this.Log_Perform      = 6;
        this.Log_Error        = 5;
        this.Log_Warn         = 4;
        this.Log_Info         = 3;
        this.Log_Debug        = 2;
        this.Log_Trace        = 1;

        this.isConnected = function() {
            return _connected;
        }

        this.version = function() {
            return "TEST";
        };

        this.engineState = function() {
            // get the value last provided to delegate
            return 3;
        };

        this.connect = function(jsDelegate) {
            _jsDelegate = jsDelegate;
            chrome.runtime.onMessage.addListener(handleDelegateRequest);
            chrome.runtime.sendMessage({
                type : "ria-remote-message",
                name : "connect",
                data : JSON.stringify({
                        devicePixelRatio: devicePixelRatio
                    })
            });
            _connected = true;
        };

        this.disconnect = function() {
            chrome.runtime.onMessage.removeListener(handleDelegateRequest);
            chrome.runtime.sendMessage({type: "ria-remote-message", name: "disconnect"});
            _connected = false;
        };

        this.setDictationActive = function(active, useNatText) {
            chrome.runtime.sendMessage({
                type : "ria-remote-message",
                name : "setDictationActive",
                data : {
                    active     : active,
                    useNatText : useNatText
                }
            });
        };

        this.setActiveURL = function (url) {
            chrome.runtime.sendMessage({
                type: "ria-remote-message",
                name: "setActiveURL",
                data: {
                    url : url
                }
            });
        };

        this.setSuspendState = function (suspended) {
            chrome.runtime.sendMessage({
                type : "ria-remote-message",
                name : "setSuspendState",
                data : {
                    suspended : suspended
                }
            });
        };

        this.onUserInteraction = function(jsonData) {
            chrome.runtime.sendMessage({
                type : "ria-remote-message",
                name : "onUserInteraction",
                data : {
                    jsonData : jsonData
                }
            });
        };

        this.log = function(logLevel, message) {
            chrome.runtime.sendMessage({
                type : "ria-remote-message",
                name : "log",
                data : {
                    logLevel : logLevel,
                    message  : message
                }
            });
        };

        function handleDelegateRequest(request, sender) {
            if (request.type == "jsDelegate") {
                var fn = _jsDelegate[request.fnName];
                if (fn) {
                    fn(request.jsonData, function(success, jsonData) {
                        chrome.runtime.sendMessage({
                            type      : "jsDelegate-response",
                            pageId    : request.pageId,
                            msgId     : request.msgId,
                            success   : success,
                            jsonData  : jsonData
                        });
                    });
                }
            }
        }
    };

}());
