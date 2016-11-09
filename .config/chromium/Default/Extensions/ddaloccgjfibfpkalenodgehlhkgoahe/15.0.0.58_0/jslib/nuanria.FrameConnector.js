////////////////////////////////////////////////////////////////////////////////
//
//  @file       nuanria.FrameConnector.js
//  @details    This class is used for handling RIA communications between frames
//              within a web page. FrameConnector also tracks which frames
//              are active or focused in the page.
//
//  @author     Chris Hardy
//  @date       4-Sep-2013
//
//  @terms      Below are the meanings of some terms as used by FrameConnector:
//
//              DOM Window (Page, Frame):
//              A DOM window is the primary container for content rendered in
//              a web page. DOM windows can contain sub windows.
//
//              Foreground:
//              A DOM Window is considered foreground if a) it is the topmost
//              window in the page, b) it contains user input focus, and
//              c) if its host browser window is the foreground window in the OS.
//
//              Focused DOM Window:
//              In FrameConnector, A DOM Window is considered focused if it
//              contains the active user selection (keyboard focus). Only one
//              window can be focused at a time for a web page (tab). This
//              property is unaffected by whether or not the host browser window
//              is in the foreground of the OS.
//
// 				Active DOM Windows(s):
//              In FrameConnector, A DOM Window is considered active if either
//              itself or one of its descendent windows is the focused DOM window.
//              Multiple windows can be active at the same time. They will all be
//              ancestors or desendants of each other. This property is unaffected
//              by whether or not the host browser window is in the foreground of
//              the OS.
//
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

nuanria.FrameConnector_DISCONNECTED = 0;
nuanria.FrameConnector_CONNECTING   = 1;
nuanria.FrameConnector_CONNECTED    = 2;

/*
 * Used to propogate information down the frame tree.
 * The approach used here is designed to work peacefully
 * with same origin restrictions that would otherwise
 * restrict sharing data between certain iframes.
 */

 // events: connectionStateChanged, activeChanged, focusChanged,

nuanria.FrameConnector = function(window) {
	"use strict";
	var debug = false;

	///////////////////////////////////////////////////////////////////////////

	this.connect           = connect;            // ()
	this.disconnect        = disconnect;         // ()
	this.isChildCrossSite  = isChildCrossSite;   // (childWindow)
	this.getChildFrames    = getChildFrames;
	this.getAllDescendants = getAllDescendants;
	this.addHandler        = function(action, handler) { events.add(action, handler);     };
	this.removeHandler     = function(action, handler) { events.remove(action, handler);  };
	this.getWindow         = function()                { return window;                   };
	this.getIsActive       = function()                { return isActiveInParent;         };
	this.getIsFocused      = function()                { return getIsFocused();           };
	this.getIsForeground   = function()                { return getIsForeground();        };
	this.getIsCrossSite    = function()                { return isParentCrossSite;        };
	this.getMessenger      = function()                { return messenger;                };

	///////////////////////////////////////////////////////////////////////////

	var messenger                = nuanria.Messenger.CreateCrossDocument(window);
	var events                   = new nuanria.Events(this);
	var connectionStatus         = nuanria.FrameConnector_DISCONNECTED;
	var isActiveInParent         = false; // true if this iframe is active (all ancestors of a focused element are active)
	var isParentCrossSite;                // true if this frame's parent is inaccessable because of same origin policy
	var childFrames              = {};
	var allDescendants           = [];
	var nextChildId              = 1;

	var FOCUS_PHASE_READY        = 0;
	var FOCUS_PHASE_FOCUSING     = 1;
	var FOCUS_PHASE_BLURRING     = 2;
	var focusBubblePhase         = FOCUS_PHASE_READY;

	var isForeground             = undefined; // true if tab is active and in the foreground. Only valid for the top frame.
	var pollForegroundIntervalMs = 500;

	//-------------------------------------------------------------------------
	// Set up / tear down
	//-------------------------------------------------------------------------

	function connect() {

	    if (window.document.readyState != "complete") {
	        window.setTimeout(function () {
	            connect();
	        }, 1000);

	        return;
	    }

		if (connectionStatus != nuanria.FrameConnector_DISCONNECTED) {
			return;
		}

		isActiveInParent = window.top == window.self;

		messenger.connect();
		messenger.addHandler("childWaiting", messenger_childWaiting);
		messenger.addHandler("childConnected", messenger_childConnected);
		messenger.addHandler("childDisconnected", messenger_childDisconnected);
		messenger.addHandler("childBlurring", messenger_childBlurring);
		messenger.addHandler("childFocusing", messenger_childFocusing);
		messenger.addHandler("parentReady", messenger_parentReady);
		messenger.addHandler("activate", messenger_activate);
		messenger.addHandler("descendantConnected", messenger_descendantConnected);
		messenger.addHandler("descendantDisconnected", messenger_descendantDisconnected);

		window.addEventListener('focus', window_focus, true);
		window.addEventListener('blur', window_blur, true);

		if (window.self !== window.top) {
			connectionStatus = nuanria.FrameConnector_CONNECTING;
			messenger.sendMessage(window.parent, "childWaiting");
		} else {
			pollForegroundIntervalMs = 500;
			pollForeground();
			connectionStatus  = nuanria.FrameConnector_CONNECTED;
			isParentCrossSite = true;
			events.notify("activeChanged");
			events.notify("focusChanged");
		}

		events.notify("connectionStateChanged", connectionStatus);
	}

	function disconnect() {
		if (connectionStatus == nuanria.FrameConnector_DISCONNECTED) {
			return;
		}

		pollForegroundIntervalMs = 0;

		// Note that if we are disconnecting because the frame is unloading,
		// then there is a good chance these messages wont be delivered.
		messenger.sendMessage(window.parent, "childDisconnected");
		messenger.sendMessage(window.top, "descendantDisconnected");

		window.removeEventListener('blur', window_focus, false);
		window.removeEventListener('focus', window_blur, false);

		messenger.removeHandler("childWaiting", messenger_childWaiting);
		messenger.removeHandler("descendantDisconnected", messenger_descendantDisconnected);
		messenger.removeHandler("descendantConnected", messenger_descendantConnected);
		messenger.removeHandler("childDisconnected", messenger_childDisconnected);
		messenger.removeHandler("childConnected", messenger_childConnected);
		messenger.removeHandler("childBlurring", messenger_childBlurring);
		messenger.removeHandler("childFocusing", messenger_childFocusing);
		messenger.removeHandler("parentReady", messenger_parentReady);
		messenger.removeHandler("activate", messenger_activate);

		connectionStatus = nuanria.FrameConnector_DISCONNECTED;
		events.notify("connectionStateChanged", connectionStatus);

		messenger.disconnect();
	}

	// message received by parent from child
	// when child is ready to connect
	function messenger_childWaiting(source, action, data) {
		// parent must be connected before it can accept child connections
		if (connectionStatus != nuanria.FrameConnector_CONNECTED) {
			// TODO: revist this
			// IE 10 and higher can finish loading a child frame before its parent :(
			return;
		}

		// notify child window of its parent's state
		var childWindow = source;
		var info = {};
		info.domain     = window.document.domain;
		info.port       = window.location.port;
		info.protocol   = window.location.protocol;
		info.active     = isActiveInParent === true &&
                          window.document.activeElement &&
						  window.document.activeElement.contentWindow == childWindow;
		messenger.sendMessage(childWindow, "parentReady", info);
	}

	// Message received by child, sent from parent
	// when parent is ready for child connections
	function messenger_parentReady(source, action, data) {
		connectionStatus = nuanria.FrameConnector_CONNECTED;

		isParentCrossSite = window.document.domain   != data.domain ||
							window.location.port     != data.port   ||
							window.location.protocol != data.protocol;
		isActiveInParent  = data.active;

		messenger.sendMessage(source, "childConnected", isParentCrossSite);
		messenger.sendMessage(window.top, "descendantConnected");
		events.notify("connectionStateChanged", connectionStatus);
		events.notify("activeChanged");
		events.notify("focusChanged");
	}

	// message received by parent, sent from child
	function messenger_childConnected(source, action, data) {
		var isChildCrossSite = data;

		// find the iframe that belongs to the child window (source)
		var iframe = null;
		var iframes = document.querySelectorAll("iframe");
		for (var i = 0; i < iframes.length; i++) {
			if (iframes[i].contentWindow == source) {
				iframe = iframes[i];
			}
		}

		for (var childId in childFrames) {
			var childFrame = childFrames[childId];
			if (childFrame.window == source) {
				childFrame.isCrossSite = isChildCrossSite;
				childFrame.iframe = iframe;
				return;
			}
		}

		var childFrameId = nextChildId++;
		childFrames[childFrameId] = {
			id: childFrameId,
			window: source,
			isCrossSite: isChildCrossSite,
			iframe: iframe
		};
	}

	// message received by top frame when a descendant frame has connected
	function messenger_descendantConnected(source, action, data) {
		allDescendants.push(source);
	}

	// message received by parent, sent from child
	// when the child frame is unloading
	function messenger_childDisconnected(source, action, data) {
		removeDisconnectedChildFrames();
	}

	// message received by top frame when a descendant frame has disconnected
	function messenger_descendantDisconnected(source, action, data) {
		removeDisconnectedDescendants();
	}

	//-------------------------------------------------------------------------
	// Cross-site
	//-------------------------------------------------------------------------

	function isChildCrossSite(childWindow) {
		var childFrameInfo = getChildFrameInfo(childWindow);
		if (!childFrameInfo) {
			return null;
		} else {
			return childFrameInfo.isCrossSite;
		}
	}

	function getChildFrameInfo(childWindow) {
		for (var childId in childFrames) {
			var win = childFrames[childId].window;

			// Housekeeping- check to see if child
			// frame has been removed from DOM
			if (win.parent != window) {
				delete childFrames[childId];
				return null;
			}

			if (win == childWindow) {
				return childFrames[childId];
			}
		}

		return null;
	}

	//-------------------------------------------------------------------------
	// Focus
	//-------------------------------------------------------------------------

	function window_blur() {
		// use setTimeout(,0) to allow document.activeElement to update
		// (In FF, document.activeElement is udpated _after_ focus events are dispatched)
		window.setTimeout(function() {
			bubbleBlur();
		},0);
	}

	function bubbleBlur() {
		var oldFocusState = getIsFocused();

		var isTopFrame = window.self == window.top;
		if (isTopFrame) {
			beginNotifyActive(FOCUS_PHASE_BLURRING);
			updateForegroundState();
		} else {
			if (isActiveInParent) {
				isActiveInParent = false;
				events.notify("activeChanged");
			}

			messenger.sendMessage(window.parent, "childBlurring");
		}

		var newFocusState = getIsFocused();
		if (newFocusState != oldFocusState) {
			events.notify("focusChanged", newFocusState);
		}
	}

	function messenger_childBlurring(source, action, data) {
		bubbleBlur();
	}

	//-------------------------------------------------------------------------

	function window_focus() {
		// use setTimeout(,0) to allow document.activeElement to update
		// (In FF, document.activeElement is udpated _after_ focus events are dispatched)
		window.setTimeout(function() {
			bubbleFocus();
		},0);
	}

	function bubbleFocus() {
		var isTopFrame = window.self == window.top;
		if (isTopFrame) {
			beginNotifyActive(FOCUS_PHASE_FOCUSING);
			updateForegroundState();
		} else {
			messenger.sendMessage(window.parent, "childFocusing");
		}
	}

	function messenger_childFocusing(source, action, data) {
		onChildWindowFocused(source);
		bubbleFocus();
	}

	function onChildWindowFocused(childWindow) {
		// This addresses an issue in Chrome where it is
		// possible that a child iframe is focused, but the
		// document.activeElement value is not that iframe.
		// This happens if the document.activeElement has a tabIndex
		// and contains the iFrame in question.

		// Example: The "Share" iframe of Gmail (2/14/14)

		// The fix:
		// If we identify the above situation, we try to focus the
		// iframe manually so that document.activeElement will
		// be correctly assigned the child's iframe.
		var childFrameInfo = getChildFrameInfo(childWindow);
		if (childFrameInfo && childFrameInfo.iframe) {
			if (document.activeElement != childFrameInfo.iframe &&
				document.activeElement &&
				typeof document.activeElement.tabIndex !== "undefined")
			{
				// make document.activeElement this child's iframe
				childFrameInfo.iframe.focus();
			}
		}
	}

	//-------------------------------------------------------------------------

	function beginNotifyActive(bubblePhase) {
		if (window.top != window) {
			throw new Error("beginNotifyActive should only be called from top frame");
		}

		setFocusBubblePhase(bubblePhase);
		if (focusBubblePhase != FOCUS_PHASE_READY) {
			// We've only received either the blur or the focus
			// bubble event, and the other one is still coming.
			// Wait for the other one before continuing.

// TODO: This is commented out for now. This whole thing needs to be revisted.
			//return;
		}

		notifyActive();
	}

	function setFocusBubblePhase(bubblePhase) {
		if (bubblePhase == FOCUS_PHASE_BLURRING && focusBubblePhase == FOCUS_PHASE_FOCUSING ||
			bubblePhase == FOCUS_PHASE_FOCUSING && focusBubblePhase == FOCUS_PHASE_BLURRING)
		{
			focusBubblePhase = FOCUS_PHASE_READY;
		} else {
			focusBubblePhase = bubblePhase;
		}
	}

	function notifyActive() {
		var newlyFocused = getIsFocused();

		if (newlyFocused) {
			events.notify("focusChanged", true);
		} else {
			for (var childId in childFrames) {
				var childFrame = childFrames[childId];
				var childWindow = childFrame.window;

				if (isChildActiveInParent(childWindow)) {
					messenger.sendMessage(childWindow, "activate");
				}
			}
			events.notify("focusChanged", false);
		}
	}

	/*
	 * Message received by child, sent by a parent that
	 * has detected that this child's iframe is active.
	 * In other words, parentWindow.document.activeElement == childWindow.frameElement
	 */
	function messenger_activate(source, action, data) {
		isActiveInParent = true;
		events.notify("activeChanged");
		notifyActive();
	}

	function isChildActiveInParent(childWindow) {
		return isActiveInParent === true &&
			   window.document.activeElement &&
			   window.document.activeElement.nodeName == "IFRAME" &&
			   window.document.activeElement.contentWindow == childWindow;
	}

	function getIsFocused() {
		return isActiveInParent &&
			   window.document.activeElement &&
			   window.document.activeElement.nodeName != "IFRAME";
	}

	function getChildFrames() {
		removeDisconnectedChildFrames();
		return childFrames;
	}

	function removeDisconnectedChildFrames() {
		for (var childId in childFrames) {
			var child = childFrames[childId];
			if (child.window.parent != window) {
				delete childFrames[childId];
			}
		}
	}

	function getAllDescendants() {
		removeDisconnectedDescendants();
		return allDescendants;
	}

	function removeDisconnectedDescendants() {
		for (var i = 0; i < allDescendants.length; i++) {
			var descendantFrame = allDescendants[i];
			if (descendantFrame.top != window) {
				allDescendants.splice(i, 1);
			}
		}
	}

	//-------------------------------------------------------------------------
	// Foreground
	//-------------------------------------------------------------------------

	/*
	 * Returns true if the window is in the foreground
	 */
	function getIsForeground() {
		if (window.self !== window.top) {
			// this function is only valid for the topmost window
			return undefined;
		}

		updateForegroundState();
		return isForeground;
	}

	/*
	 * Checks document.hasFocus and fires an event
	 * if the value has changed.
	 */
	function updateForegroundState() {
		var lastIsForeground = isForeground;
		isForeground = document.hasFocus();
		if (lastIsForeground !== isForeground) {
			events.notify("isForegroundChanged");
		}
	}

	/*
	 * This is needed by Safari because it doesn't always
	 * fire window events properly
	 */
	function pollForeground() {
		updateForegroundState();
		if (pollForegroundIntervalMs) {
		    setTimeout(function () { pollForeground(); }, pollForegroundIntervalMs);
		}
	}

	//-------------------------------------------------------------------------
	// Visual Debugging
	//-------------------------------------------------------------------------

	if (debug) {
		this.addHandler("focusChanged", debugBorders);
		this.addHandler("isForegroundChanged", debugBorders);
		this.addHandler("activeChanged", debugBorders);
	}

	/*
	 * Draws a border on the window illustrating the focus and foreground state
	 */
	function debugBorders() {
		var borderStyle = window.self != window.top || getIsForeground() ? "solid" : "dotted";
		var borderColor = getIsFocused() ? "green" : "red";
		document.body.style.setProperty("border", "3px " + borderStyle + " " + borderColor, "important");
		var outlookContainer = document.querySelector(".AppInner");
		if (outlookContainer) {
			outlookContainer.style.setProperty("border", "3px " + borderStyle + " " + borderColor, "important");
		}
	}
};