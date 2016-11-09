////////////////////////////////////////////////////////////////////////////////
//
//  @file       nuanria.DomTracker.js
//  @details    Class used to monitor the Document Object Model for RIA.
//              This is used in order to detect when certain editor contexts
//              activate and/or deactivate. These events are signalled to handlers
//              set using addHandler/removeHandler.
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

nuanria.DomTracker = function(timer, document, frameConnector) {
	"use strict";

	///////////////////////////////////////////////////////////////////////////

	this.start					= start;
	this.stop					= stop;
	this.scan					= scan;
	this.addHandler				= function(action, handler) { events.add(action, handler); };
	this.removeHandler			= function(action, handler) { events.remove(action, handler); };
	this.getIsRunning			= function() { return isRunning; };
	this.getActiveContexts		= function() { return activeContexts; };
	this.getActiveContextIds	= function() { return Object.keys(activeContexts); };

	///////////////////////////////////////////////////////////////////////////

	var events				= new nuanria.Events();
	var isRunning			= false;
	var activeContexts		= {};
	var sizCache			= null;  // used in handleDOMSubtreeModified()
	var additionalEventWindows = {};

	function start() {
		if (isRunning) {
			stop();
		}

	    // respond to internal focus events in the page so that we can determine
        // if the editor context has changed.
		document.addEventListener('focusin', handleDOMChange, false);
		document.addEventListener('focusout', handleDOMChange, false);
		document.addEventListener('DOMFocusIn', handleDOMChange, false);
		document.addEventListener('DOMFocusOut', handleDOMChange, false);
		document.addEventListener('focus', handleDOMChange, true);
		document.addEventListener('blur', handleDOMChange, true);

		this.addHandler("contextLoaded", updateAdditionalEventHandlers);
		this.addHandler("contextChanged", updateAdditionalEventHandlers);
		this.addHandler("contextUnloaded", updateAdditionalEventHandlers);

		isRunning = true;
        timer.setTimeout(scan, 0);
	}

	function stop() {
	    if (isRunning) {
	        document.removeEventListener('DOMFocusOut', handleDOMChange, false);
	        document.removeEventListener('DOMFocusIn', handleDOMChange, false);
	        document.removeEventListener('focusout', handleDOMChange, false);
	        document.removeEventListener('focusin', handleDOMChange, false);
	        document.removeEventListener('focus', handleDOMChange, true);
	        document.removeEventListener('blur', handleDOMChange, true);
	        cleanAdditionalEventWindows();
	        this.removeHandler("contextLoaded", updateAdditionalEventHandlers);
			this.removeHandler("contextChanged", updateAdditionalEventHandlers);
			this.removeHandler("contextUnloaded", updateAdditionalEventHandlers);

			activeContexts = {};
			isRunning = false;
		}
	}

	function cleanAdditionalEventWindows() {
	    for (var contextId in additionalEventWindows)
	    {
	        var windowToUnload = additionalEventWindows[contextId];
	        windowToUnload.removeEventListener('blur', handleDOMChange, false);
        }
	    additionalEventWindows = {};
	}


	function updateAdditionalEventHandlers(context, newEditors) {
	    var windowToUnload = additionalEventWindows[context.id];
	    if (windowToUnload) {
	        // handle unloaded or changed case
	        windowToUnload.removeEventListener('blur', handleDOMChange, false);
	        delete additionalEventWindows[context.id];
	    }

	    if (newEditors && newEditors[0]) {
	        // handle loaded or changed case
	        var editor = newEditors[0];
	        if (!nuanria.utils.isMinorFrame(editor))
	            return; // The current editor is not a minor frame. Do nothing.

	        editor.contentWindow.addEventListener('blur', handleDOMChange, false);
	        additionalEventWindows[context.id] = editor.contentWindow; // Store the content window of the editor frame
	    }
	}

	function handleDOMChange(ev) {
		// Sizzle will sometimes modify an element when querying. Ignore this.
		if (ev.target.id && ev.target.id.substring(0,8) == "sizcache") {
			// Sizzle is adding an id attribute to help with querying
			sizCache = ev.target;
			return;
		}
		if (sizCache == ev.target) {
			// Sizzle is removing the id attribute
			sizCache = null;
			return;
		}

		nuanria.utils.scheduleOne(timer, scan, 200);
	}

	function scan(sync) {
		if (!isRunning) {
			return;
		}

		var start = new Date().getTime();

		var notifyFn = sync ? events.notify : events.notifyAsync;

		var contexts		= nuanria.contexts;
		var oldContexts		= activeContexts;
		var contextsChanged = false;
		activeContexts		= {};

		var contextIds = Object.keys(contexts);
		for (var i = 0; i < contextIds.length; i++) {
			var contextId = contextIds[i];
			var context   = contexts[contextId];
			var editor    = context.editor();
			if (!editor) {
				continue;
			}

			var activeEditor = editor.getActive();
			if (activeEditor) {
				activeContexts[contextId] = [activeEditor];
				var oldElements = oldContexts[contextId];

				if (!oldElements) {
					// marker is new
					contextsChanged = true;
					notifyFn("contextLoaded", context, [activeEditor]);
				} else {
					// marker was active before, but the marked elements have changed
					if (!compareContextElements([activeEditor], oldElements)) {
						notifyFn("contextChanged", context, [activeEditor]);
					}
				}
			} else {
			    if (oldContexts[contextId]) {
			        // marker is removed
					contextsChanged = true;
					notifyFn("contextUnloaded", context);
				}
			}
		};

		if (contextsChanged) {
			notifyFn("contextsChanged");
		}

		notifyFn("scanComplete");
	}

	function compareContextElements(elementsA, elementsB) {
		if (elementsA.length != elementsB.length) {
			return false;
		}

		// assume elements will be in the same order
		for (var i = 0; i < elementsA.length; ++i) {
			if (elementsA[i] != elementsB[i]) {
				return false;
			}
		}

		return true;
	}
};