////////////////////////////////////////////////////////////////////////////////
//
//  @file       nuanria.Controller.js
//  @details    RIA main controller class.
//              This class is used to tie together all RIA script functionality in
//              the browser. It is responsible for handling the initialization
//              sequence of the various script classes used by RIA.
//
//  @author     Chris Hardy
//  @date       4-Sep-2013
//  @copyright  (C) Copyright Nuance Communications, Inc. 2012 All Rights Reserved.
//              Trade secret and confidential information of Nuance Communications, Inc.
//              Copyright protection claimed includes all forms and matters of
//              copyrightable material and information now allowed by statutory or
//              judicial law or hereinafter granted, including without limitation,
//              material generated from the software programs which are displayed
//              on the screen such as icons, screen display looks, etc.
//
////////////////////////////////////////////////////////////////////////////////

var nuanria = nuanria || {};
nuanria.ie = nuanria.ie || {};
nuanria.globals = nuanria.globals || {};
nuanria.version = self && self.version ? self.version : "12.81.000.009";

nuanria.Controller = function(window) {

    ///////////////////////////////////////////////////////////////////////////

    this.init           = init;

    ///////////////////////////////////////////////////////////////////////////

    var document = window.document;
    var frameConnector;
    var messenger;
    var speechHost; // only installed on top level frames
    var engineRunning = false;
    var domTracker;
    var speechClient;

    //-------------------------------------------------------------------------

    function init(addonDelegate, pluginApi) {
        nuanria.addonDelegate = addonDelegate;
        nuanria.pluginApi = pluginApi;
        initFrameConnector();
    }

    //-------------------------------------------------------------------------

    function initFrameConnector() {
        frameConnector = new nuanria.FrameConnector(window);
        nuanria.FrameConnector.instance = frameConnector;
        frameConnector.addHandler("connectionStateChanged", frameConnector_connectionStateChanged);
        frameConnector.addHandler("focusChanged", frameConnector_focusChanged);

        messenger = frameConnector.getMessenger();
        messenger.addHandler("speechHostReady", messenger_speechHostReady);
        messenger.addHandler("speechHostUnavailable", messenger_speechHostUnavailable);

        if (window.top === window) {
            frameConnector.addHandler("isForegroundChanged", frameConnector_isForegroundChanged);
            messenger.addHandler("requestSpeechHostStatus", messenger_requestSpeechHostStatus);
            frameConnector.connect(document.hasFocus());
        } else {
            frameConnector.connect();
        }
    }

    function frameConnector_connectionStateChanged(connectionStatus) {
        if (connectionStatus == nuanria.FrameConnector_CONNECTED) {
            frameConnected();
        } else if (connectionStatus == nuanria.FrameConnector_DISCONNECTED) {
            frameDisconnected();
        }
    }

    function frameConnected() {
        var isTopFrame = window == window.parent;
        if (isTopFrame) {
            load();
        }

        messenger.sendMessage(top, "requestSpeechHostStatus");
    }

    function frameDisconnected() {
        if (speechClient) {
            speechClient.disconnect();
        }

        if (speechHost) {
            speechHost.disconnect();
        }
    }

    //-------------------------------------------------------------------------
    // Top frame only:

    function load() {
        initSpeechHost();
    }

    function initSpeechHost() {
        speechHost = new nuanria.SpeechHost(window.document, messenger);
        speechHost.addHandler("stateChanged", speechPlugin_stateChanged);
        speechHost.install(frameConnector.getIsForeground());
    }

    function speechPlugin_stateChanged(running) {
        if (engineRunning == running) {
            return;
        }

        engineRunning = running;
        if (engineRunning) {
            broadcastMessage("speechHostReady");
        } else {
            broadcastMessage("speechHostUnavailable");
        }
    }

    function broadcastMessage(action, data) {
        data = data || null;
        var allWindows = frameConnector.getAllDescendants();
        allWindows.push(window);
        for (var i = 0; i < allWindows.length; i++) {
            messenger.sendMessage(allWindows[i], action, data);
        }
    }

    function messenger_requestSpeechHostStatus(source, action, data) {
        if (engineRunning) {
            messenger.sendMessage(source,"speechHostReady");
        }
    }

    function frameConnector_isForegroundChanged() {
        if (speechHost) {
            speechHost.setSuspended(!frameConnector.getIsForeground());
        }
    }

    //-------------------------------------------------------------------------
    // All frames:

    function messenger_speechHostReady(source, action, data) {
        if (!speechClient) {
            // init speechClient
            speechClient = new nuanria.SpeechClient(messenger, domTracker);
            speechClient.addHandler("connected", speechClient_connected);
        }

        if (!speechClient.isConnected()) {
            speechClient.connect();
        }
    }

    function messenger_speechHostUnavailable(source, action, data) {
        if (domTracker) {
            domTracker.stop();
        }

        if (speechClient.isConnected()) {
            speechClient.disconnect();
        }
    }

    function speechClient_connected() {
        if (!domTracker) {
            // init dom tracker
            domTracker = new nuanria.DomTracker(window, window.document, frameConnector);
            domTracker.addHandler("contextLoaded", domTracker_contextLoaded);
            domTracker.addHandler("contextChanged", domTracker_contextChanged);
            domTracker.addHandler("contextUnloaded", domTracker_contextUnloaded);
            domTracker.addHandler("scanComplete", domTracker_scanComplete);
        }

        domTracker.start();
    }

    function frameConnector_focusChanged() {
        nuanria.globals.isFocused = frameConnector.getIsFocused();
        nuanria.globals.isActiveInParent = frameConnector.getIsActive();

        if (domTracker && domTracker.getIsRunning()) {
            // Frame may have lost or gained focus.
            // In some cases, focus changes to a natspeak window
            // and then immediately back again. Allow a few seconds
            // before rescanning.
            //setTimeout(function() {
            //    domTracker.scan();
            //}, 50);
            nuanria.utils.debounce(domTracker.scan, 50);
        }
    }

    function domTracker_contextLoaded(context, elements) {
        nuanria.utils.log("loaded", context.id, elements);
        if (speechClient) {
            speechClient.loadContext(context, elements);
        }
    }

    function domTracker_contextChanged(context, elements) {
        nuanria.utils.log("changing", context.id, elements);
        if (speechClient) {
            speechClient.changeContext(context, elements);
        }
    }

    function domTracker_contextUnloaded(context) {
        nuanria.utils.log("unloaded", context.id);
        if (speechClient) {
            speechClient.unloadContext(context);
        }
    }

    function domTracker_scanComplete() {
        if (speechClient) {
            speechClient.update();
        }
    }
};