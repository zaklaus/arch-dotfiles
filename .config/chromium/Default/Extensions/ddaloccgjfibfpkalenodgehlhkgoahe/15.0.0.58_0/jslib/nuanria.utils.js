///////////////////////////////////////////////////////////////////////////////
//
//  @file       nuanria.utils.js
//  @details    Utility/helper functions for RIA.
//
//  @author     Chris Hardy, Jack Gallagher
//  @date       4-Sep-2013
//  @copyright  (C) Copyright Nuance Communications, Inc. 2016 All Rights Reserved.
//              Trade secret and confidential information of Nuance Communications, Inc.
//              Copyright protection claimed includes all forms and matters of
//              copyrightable material and information now allowed by statutory or
//              judicial law or hereinafter granted, including without limitation,
//              material generated from the software programs which are displayed
//              on the screen such as icons, screen display looks, etc.
//
////////////////////////////////////////////////////////////////////////////////

var nuanria = nuanria || {};
nuanria.utils = nuanria.utils || {};
nuanria.globals = nuanria.globals || {};

(function() {
	"use strict";

	var allowConsoleLogging = false;  // Do NOT check this in as true

	/*
	 * Logs an error to the JS error console and also RIA Plugin if it is set
	 * @param1, @param2, ...   : data to log
	 */
	nuanria.utils.logError = function() {
		var d = new Date();
		var ts = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "." + d.getMilliseconds();

		var args = Array.prototype.slice.call(arguments, 0);
		if (args[1] && args[1].stack) {
			args.push(args[1].stack);
		}
		args.splice(0, 0, ts); // make timestamp first argument

		if (allowConsoleLogging) {
			if (console.error) {
			    console.error.apply(console, args);
			}
			else {
			    console.log.apply(console, args);
			}
		}

		if (nuanria.globals.plugin && nuanria.globals.plugin.log) {
			var dragonLogMsg = "";
			for (var i = 1; i < args.length; i++) {
				dragonLogMsg += args.toString() + " ";
			}
			nuanria.globals.plugin.log(nuanria.globals.plugin.Log_Error, dragonLogMsg);
		}

		nuanria.globals.lastError = args;
	};

	/*
	 * Logs a message to the JS console
	 * @param1, @param2, ...   : data to log
	 */
	nuanria.utils.log = function() {
		var d = new Date();
		var ts = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "." + d.getMilliseconds();

		var args = Array.prototype.slice.call(arguments, 0);
		args.splice(0, 0, ts); // make timestamp first argument

		if (allowConsoleLogging) {
			console.log.apply(console, args);
		}

		if (nuanria.globals.plugin && nuanria.globals.plugin.log) {
			var dragonLogMsg = "";
			for (var i = 1; i < args.length; i++) {
				dragonLogMsg += args[i].toString() + " ";
			}
			nuanria.globals.plugin.log(nuanria.globals.plugin.Log_Trace, dragonLogMsg);
		}
	};

	/*
	 * Logs a message to the JS console
	 * @param1, @param2, ...   : data to log
	 */
	nuanria.utils.logInfo = function() {
		var d = new Date();
		var ts = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "." + d.getMilliseconds();

		var args = Array.prototype.slice.call(arguments, 0);
		args.splice(0, 0, ts); // make timestamp first argument

		if (allowConsoleLogging) {
		    console.log.apply(console, args);
		}

		if (nuanria.globals.plugin && nuanria.globals.plugin.log) {
			var dragonLogMsg = "";
			for (var i = 1; i < args.length; i++) {
				dragonLogMsg += args[i].toString() + " ";
			}
			nuanria.globals.plugin.log(nuanria.globals.plugin.Log_Info, dragonLogMsg);
		}
	};

    /*
	 * Logs a performance message to the JS console
	 * @param1, @param2, ...   : data to log
	 */
	nuanria.utils.logPerform = function () {
	    var d = new Date();
	    var ts = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "." + d.getMilliseconds();

	    var args = Array.prototype.slice.call(arguments, 0);
	    args.splice(0, 0, ts); // make timestamp first argument

	    if (allowConsoleLogging) {
	        console.log.apply(console, args);
	    }

	    if (nuanria.globals.plugin && nuanria.globals.plugin.log) {
	        var dragonLogMsg = "";
	        for (var i = 1; i < args.length; i++) {
	            dragonLogMsg += args[i].toString() + " ";
	        }
	        nuanria.globals.plugin.log(nuanria.globals.plugin.Log_Perform, dragonLogMsg);
	    }
	};

    /*
	 * Prototypicially extends an object, preserving constructor chaining.
	 * http://stackoverflow.com/questions/4152931/javascript-inheritance-call-super-constructor-or-use-prototype-chain
	 */
	nuanria.utils.extend = function(base, sub) {
	  // Avoid instantiating the base class just to setup inheritance
	  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
	  // for a polyfill
	  sub.prototype = Object.create(base.prototype);
	  // Remember the constructor property was set wrong, let's fix it
	  sub.prototype.constructor = sub;

	  // In ECMAScript5+ (all modern browsers), you can make the constructor property
	  // non-enumerable if you define it like this instead
	  Object.defineProperty(sub.prototype, 'constructor', {
	    enumerable: false,
	    value: sub
	  });
	};

	/*
	 * Left pads a string.
	 * @param input   : string to pad
	 * @param length  : total length of string after padding
	 * @param padChar : character to use for padding (default space)
	 */
	nuanria.utils.lpad = function(input, length, padChar) {
		if (!padChar) padChar = ' ';

		if (typeof input != "string") {
			throw new Error("input must be a string");
		}

		if (typeof length != "number") {
			throw new Error("length must be a number");
		}

		if (typeof padChar != "string" || padChar.length != 1) {
			throw new Error("padChar must be single character string");
		}

		while (input.length < length) {
			input = padChar + input;
		}

		return input;
	};

	/*
	 * Right pads a string.
	 * @param input   : string to pad
	 * @param length  : total length of string after padding
	 * @param padChar : character to use for padding (default space)
	 */
	nuanria.utils.rpad = function(input, length, padChar) {
		if (!padChar) padChar = ' ';

		if (typeof input != "string") {
			throw new Error("input must be a string");
		}

		if (typeof length != "number") {
			throw new Error("length must be a number");
		}

		if (typeof padChar != "string" || padChar.length != 1) {
			throw new Error("padChar must be single character string");
		}

		while (input.length < length) {
			input = input + padChar;
		}

		return input;
	};

	nuanria.utils.validateObject = function(value, description) {
		if (!value || typeof value != "object") {
			throw new Error("Invalid object: " + description);
		}
	};

	nuanria.utils.validateFunction = function(value, description) {
		if (typeof value != "function") {
			throw new Error("Invalid function: " + description);
		}
	};

	nuanria.utils.validateString = function(value, description) {
		if (typeof value != "string") {
			throw new Error("Invalid string: " + description);
		}
	};

	nuanria.utils.validateNumber = function(value, description, min, max) {
		var num = parseInt(value, 10);
		if (typeof value != "number") {
			throw new Error("Invalid number: " + description);
		}
	};

	/*
	 * Schedules a function to be called after a delay. Function will not be invoked
	 * if scheduleOne is recalled for the same function before the delay elapses.
	 * @param window  : Object containing setTimeout function
	 * @param fn      : Function to call
	 * @param timeout : delay before invoking fn
	 * @param params  : array of params to be passed to fn
	 */
	nuanria.utils.scheduleOne = function(window, fn, timeout, params) {
		// we store all pending timeout/fn pairs in an object of this function called pending:
		nuanria.utils.scheduleOne.pending = nuanria.utils.scheduleOne.pending || [];
		var pending = nuanria.utils.scheduleOne.pending;
		function findPending(fn) {
			for (var i = 0; i < pending.length; i++) {
				if (pending[i].fn == fn) {
					return i;
				}
			}
			return -1;
		}

		var i, key, keys, value, timeoutId;

		if (!timeout) timeout = 1;  // minimum 1ms timeout

		// set a new timeout for fn.
		timeoutId = window.setTimeout(function() {
			keys = Object.keys(nuanria.utils.scheduleOne.pending);

			// check if this is the last pending call for this function
			var pendingItemIndex = findPending(fn);
			var pendingItem = pending[pendingItemIndex];
			if (pendingItem.count > 1) {
				pendingItem.count--;
			} else {
				// when/if the timeout expires, invoke fn and remove it from the pending collection
				pending.splice(pendingItemIndex,1);
				fn.apply(this, params);
			}

		}, timeout);

		var pendingItemIndex = findPending(fn);
		if (pendingItemIndex == -1) {
			pending.push({fn:fn, count:1});
		} else {
			pending[pendingItemIndex].count++;
		}
	};

	/*
	 * Invokes a function and then logs total elapsed milliseconds to console
	 */
	nuanria.utils.profileFn = function(fn) {
		var start = new Date().getTime();
		var args = [];
		for (var i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
		fn.apply(fn, args);
		return new Date().getTime() - start;
	};

	/*
	 * Returns coordinates of an element relative to top-left of its document
	 */
	nuanria.utils.getCoords = function(node, index) {
		var result = { top: 0, left: 0, bottom: 0, right: 0, height: 0, width: 0 };

		var range = node.ownerDocument.createRange();
		var rect;

		if (node.nodeType == Node.TEXT_NODE)
		{
			var nodeValueLength = node.nodeValue.length;
			var measureEdge = "left";
			if (nodeValueLength < index)
			{
				// we can't get coordinates for an index outside the range
				return result; // error
			}
			else
			{
				if (nodeValueLength === 0)
				{
					// this is an empty text node, select the whole thing
					range.selectNode(node);
				}
				else if (node.nodeValue.length > index &&
						  (index === 0 ||                           // start of textnode
						   node.nodeValue[index-1].match(/\s/g)))   // start of word
				{
					// Select the character and report on the left edge
					// (Note, the left edge of a wrapped word might be reported to be at the end of the previous line (chrome))
					while(node.nodeValue[index] == '\n') index++;
					range.setStart(node, index);
					range.setEnd(node, index+1);
				}
				else // 0 < index >= node.nodeValue.length
				{
					// select the previous character and report on the right edge
					// This is useful when the index is at the end of the text range (like the cursor can be after a dictation)
					range.setStart(node, index-1);
					range.setEnd(node, index);
					measureEdge = "right";
				}
			}

			// Chrome will not return a valid rect for an empty selection
			// via range.getBoundingClientRect, however range.getClientRects()
			// works OK. In the case there are multiple rects, use the last one.
			var rects = range.getClientRects();
			if (rects.length) {
				rect = rects[rects.length - 1];
			} else {
				// If we didn't get a range, try getting a range for the node itself
				// (This happens in IE when selecting whitespace in a node)
				range.setStart(node, 0);
				range.setEnd(node, 0);
				rects = range.getClientRects();
				rect = rects[0];
			}

			result.left = measureEdge == "right" ? rect.right : rect.right - rect.width;
			result.top = rect.top;
			result.bottom = rect.bottom;
			result.height = rect.height;
		}
		else
		{
			// In Chrome, BR does not give any coordinates with getClientRects()
			// So we're using the old technique here of inserting a dummy element to measure instead.
			range.setStart(node, index);
			range.setEnd(node, index);
			rect = range.getBoundingClientRect();
			var dummyEl = node.ownerDocument.createElement("span");
			dummyEl.style.fontsize = "0px";
			dummyEl.textContent = "_";
			range.insertNode(dummyEl);
			var dummyRect = dummyEl.getBoundingClientRect();
			dummyEl.parentNode.removeChild(dummyEl);
			result.left = dummyRect.left;
			result.top = dummyRect.top;
			result.bottom = dummyRect.bottom;
			result.height = dummyRect.height;
		}

		//nuan_log(node.nodeType + ": " + JSON.stringify(result));
		return result;
	};

	/*
	 * Returns coordinates of a character in a text range, relative to
	 * the top left of its document
	 */
	nuanria.utils.getCharacterCoords = function(node, index, useRightEdge) {
		var doc = node.ownerDocument;
		var win = doc.defaultView;

		if (useRightEdge === undefined) {
			useRightEdge = false;
		}

		// the useRightEdge parameter will cause this function to return the right edge of
		// the node element if the index is the last position in the node.
		var applyWidth = false;
		if (useRightEdge &&
			((node.nodeType == Node.TEXT_NODE && node.nodeValue.length == index) ||
			 (node.nodeType == Node.ELEMENT_NODE && node.childNodes.length == index)))
		{
			if (node.nextSibling) {
				node = node.nextSibling;
			} else {
				node = node.parentNode;
				applyWidth = true;
			}
			index = 0;
		}

		var range = doc.createRange();
		range.setStart(node, index);
		var dummyEl = doc.createElement("span");
		dummyEl.style.setProperty("font-size", "0px");
		dummyEl.textContent = "_"; // we need some text in here so the span sticks to the adjacent word when things are wrapping
		range.insertNode(dummyEl); // this insert can split a text node into two adjacent text nodes
		var parentNode = dummyEl.parentNode;
		var offset = dummyEl.getBoundingClientRect();
		offset = { left: offset.left, top: offset.top }; // get xy position
		var parentStyle = win.getComputedStyle(parentNode);
		offset.fontSize = parseInt(parentStyle.fontSize, 10);
		dummyEl.parentNode.removeChild(dummyEl); // delete temp node
		if (parentNode.normalize) {
			parentNode.normalize(); //  merge adjacent text nodes back together
								    //  IE doesn't have this, but it seems to normalize by default
		}

		if (applyWidth) {
			var nodeRect = node.getBoundingClientRect();
			offset.left += nodeRect.width;
		}

		return offset;
	};

	/*
	 * Returns the visible rectangle of an element, adjusted for
	 * parts that are scrolled out of view, or outside of the viewport.
	 */
	nuanria.utils.getVisibleBounds = function(element) {
		// Note: currently this function only adjusts for Y dimensions.

		// Todo: X dimensions
		//       z-index

		var window = element.ownerDocument.defaultView;

		var bounds = element.getBoundingClientRect();

	    // make bounds an editable copy because getBoundingClientRect() returns a read only copy
	    // Fix for TTP32116. IE11 returns a floating point value for bounds.top so convert all math to int.
		bounds = {
			left : Math.round(bounds.left),
			top : Math.round(bounds.top),
			right : Math.round(bounds.right),
			bottom : Math.round(bounds.top + element.scrollHeight),
			width : Math.round(bounds.width),
			height : element.scrollHeight
		};

		//nuanria.utils.log("utils.getVisibleBounds(443)(" + element.className + ") " + JSON.stringify(bounds));
		
	    // adjust for any content that overflows our ancestors
		var node = element;
		var parentBounds;
		for (;;) {
		    // Fix for TTP32116. IE11 does not have a computed style of "float" so it would always fail the if statement below
		    // when there was a check for computedStyle["float"] == "none". Since the bounds object above has been converted to
		    // all integers the math below will work. This implementation may need revision on high DPI screens or when a > 100%
            // zoom level is used
			var computedStyle = window.getComputedStyle(node);
			if (computedStyle["position"] == "absolute" ||
				computedStyle["position"] == "fixed")
			{
				break;
			}

			node = node.parentNode;

			if (!node || node.nodeType == Node.DOCUMENT_NODE) {
				break;
			}

			parentBounds = node.getBoundingClientRect();
			parentBounds = {
				left: parentBounds.left,
				top : parentBounds.top,
				right : parentBounds.right,
				bottom : parentBounds.top + node.scrollHeight,
				width : parentBounds.width,
				height : node.scrollHeight
			};

			// adjust for any content that has been scrolled out of parent
			var adjustedTop = Math.max(parentBounds.top, 0);
			if (bounds.top < adjustedTop) {
				var dY = adjustedTop - bounds.top;
				bounds.top += dY;
				bounds.height -= dY;
				//nuanria.utils.log("utils.getVisibleBounds - adjust for scrolled out of parent");
            }

			// adjust for any content that is taller than parent
			if (bounds.bottom > parentBounds.bottom) {
				var dHeight = bounds.bottom - parentBounds.bottom;
				bounds.height -= dHeight;
				bounds.bottom = bounds.top + bounds.height;
				//nuanria.utils.log("utils.getVisibleBounds - adjust for taller than parent");
            }
		}

		// adjust for any content that has been scrolled off the beginning of the window
		if (bounds.top < 0) {
			// adjust top so that none if it is scrolled
			//  off the screen by the window
			var dY = 0 - bounds.top;
			bounds.top += dY;
			bounds.height -= dY;
			//nuanria.utils.log("utils.getVisibleBounds - adjust for scrolled off the beginning of window");
        }

		// adjust for available height in the window
		if (bounds.bottom > window.innerHeight) {
			bounds.bottom = window.innerHeight;
			bounds.height = bounds.bottom - bounds.top;
			//nuanria.utils.log("utils.getVisibleBounds - adjust for available height in window");
        }

		//nuanria.utils.log("utils.getVisibleBounds(511)(" + element.className + ") " + JSON.stringify(bounds));
		//nuanria.utils.shadeBounds(document, bounds);
		return bounds;
	};

	/*
	 * Shades in a bounds object, this is helpful for
	 * debugging nuanria.utils.getVisibleBounds.
	 */
	nuanria.utils.shadeBounds = function(doc, bounds) {
		var id = "nuan_shaded";
		var existing = doc.getElementById(id);
		if (existing) {
			existing.parentNode.removeChild(existing);
		}

		var div = doc.createElement("div");
		div.id = id;
		div.style.position = "fixed";
		div.style.height = (bounds.height-2) + "px";
		div.style.width = (bounds.width-2) + "px";
		div.style.left = bounds.left + "px";
		div.style.top = bounds.top + "px";
		div.style.border = "1px solid red";
		div.style.background = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAGklEQVQIW2NkYGD4D8SMQAwGcAY2AbBKDBUAVuYCBQPd34sAAAAASUVORK5CYII=) repeat';
		div.style.zIndex = 1000000;
		doc.body.appendChild(div);
	}

	/*
	 * Returns an element on the document at a specific point.
	 */
	nuanria.utils.elementFromPoint = function(document, x, y) {
		var check=false, isRelative=true;

		if(!document.elementFromPoint) return null;

		if(!check) {
			var sl;
			if((sl = document.scrollTop) >0) {
				isRelative = (document.elementFromPoint(0, sl + window.clientHeight -1) === null);
			} else if((sl = document.scrollLeft) >0) {
				isRelative = (document.elementFromPoint(sl + window.clientWidth -1, 0) === null);
			}
			check = (sl>0);
		}

		if(!isRelative) {
			x += document.scrollLeft;
			y += document.scrollTop;
		}

		return document.elementFromPoint(x, y);
	};

	/*
	 * Returns true if a element is at the position of the corner
	 * or middle of the bounds rectangle
	 */
	nuanria.utils.isElementAtBounds = function(bounds, element) {
		if (!bounds) {
			return false;
		}

		// test center
		var testX = bounds.left + bounds.width/2;
		var testY = bounds.top + bounds.height/2;
		var topElement = nuanria.utils.elementFromPoint(element.ownerDocument, testX, testY);
		while (topElement) {
			if (topElement == element) {
				return true;
			} else {
				topElement = topElement.parentNode;
			}
		}

		// test top-left
		testX = bounds.left+1;
		testY = bounds.top+1;
		topElement = nuanria.utils.elementFromPoint(element.ownerDocument, testX, testY);
		while (topElement) {
			if (topElement == element) {
				return true;
			} else {
				topElement = topElement.parentNode;
			}
		}

		// test top-right
		testX = bounds.right-1;
		testY = bounds.top+1;
		topElement = nuanria.utils.elementFromPoint(element.ownerDocument, testX, testY);
		while (topElement) {
			if (topElement == element) {
				return true;
			} else {
				topElement = topElement.parentNode;
			}
		}

		// test bottom right
		testX = bounds.right-1;
		testY = bounds.bottom-1;
		topElement = nuanria.utils.elementFromPoint(element.ownerDocument, testX, testY);
		while (topElement) {
			if (topElement == element) {
				return true;
			} else {
				topElement = topElement.parentNode;
			}
		}

		return false;
	}

	/*
	 * Returns an element on the document at a specific point.
	 */
	nuanria.utils.isVisible = function(element, minArea) {
		if (minArea === undefined) minArea = 4;

		// return false if the element is completely transparent
		var win = element.ownerDocument.defaultView;
		var style = win.getComputedStyle(element);
		if (!style) {
			// FF can return null in some situations, meaning that
			// the style cannot be computed. Usually because the
			// element's frame is not visible.
			return false;
		}

		if (style.opacity === 0) {
			return false;
		}

		// Find a visible portion of the element and check if
		// it is on screen.  Note that even if a parent has
		// 0x0 dimensions, child elements might be visible if
		// they are floated or positioned absolutely.
		var nodes = element.querySelectorAll("*");
		for (var i = -1; i < nodes.length; i++) {
			var node = i == -1 ? element : nodes[i];
			var bounds = nuanria.utils.getBoundingClientRect(node);
			nuanria.utils.adjustBoundsForElementPosition(bounds, node);

			var area = bounds.width * bounds.width;
			if (area < minArea) {
				continue;
			}

			if (nuanria.utils.isElementAtBounds(bounds, node)) {
				return true;
			}
		}

		return false;
	}

	/*
	 * Adjusts the bounds of an element to exclude the region
	 * that overlaps it's parent due to the it being positioned
	 * relatively to the top or the left.
	 * TODO: Fix up nuanria.utils.getVisibleBounds() to work with
	 * horizonatal offsets, and use that instead of this function.
	 */
	nuanria.utils.adjustBoundsForElementPosition = function(bounds, element) {
		var win = element.ownerDocument.defaultView;
		var elementStyle = win.getComputedStyle(element);
		var parentStyle = win.getComputedStyle(element.parentNode);
		if (parentStyle.position == "relative" ||
			parentStyle.position == "absolute")
		{
			var left = parseInt(elementStyle.left, 10);
			if (left && left < 0) {
				bounds.left -= left;
				bounds.width += left;
			}

			var top = parseInt(elementStyle.top, 10);
			if (top && top < 0) {
				bounds.top -= top;
				bounds.height -= top;
			}
		}
	}

	/*
	 * Returns true if the browser is running in Mac OS
	 */
	nuanria.utils.isMac = function() {
		return navigator.platform.toUpperCase().indexOf('MAC') > -1;
	};

	/*
	 * Returns true if the browser is Firefox
	 */
	nuanria.utils.isFirefox = function() {
		return typeof InstallTrigger !== "undefined";
	}

	/*
	 * Returns true if the browser is Chrome
	 */
	nuanria.utils.isChrome = function() {
		return !!window.chrome;
	}

	/*
	 * Returns true if the browser is IE
	 */
	nuanria.utils.isIE = function() {
		return !!document.documentMode;
	}

	/*
	 * Replaces indexed tokens with their respective replacement argument
	 * Example:
	 *    nuanria.utils.formatString("%2 blind %3, see how they %1", "run", 3, "mice")
	 */
	nuanria.utils.formatString = function() {
		// Not the most efficient implementation, but simple.
		var args = Array.prototype.slice.call(arguments);
		var input = args[0];
		if (!input) {
			return "";
		}
		for (var i = 1; i < args.length; i++) {
			var repl = args[i];
			var regexp = new RegExp("\%" + i, "g");
			input = input.replace(regexp, repl);
		}
		return input;
	};

	/*
	 * Returns false if a window is no longer valid on
	 * the page. This can happen when an iFrame is removed.
	 */
	nuanria.utils.isWindowAlive = function(win) {
		var winTop;
		var winParent;

		try {
			winTop = win.top;
			winParent = win.parent;
		} catch (e) {
			// This can happen in IE when a cross-site frame has been removed
			// Sometimes it does, sometimes it doesn't, not sure why
			return false;
		}

		// in FF and Chrome, win.parent will become falsy if a frame has been removed
		// in IE, winTop will no longer match the actual top window
		return winParent && winTop == self.top;
	};

	/*
	 * Returns true if the iframe's window is inaccessible
	 * due to cross origin policy.
	 */
	nuanria.utils.isFrameCrossSite = function(iframe) {
		var doc = null;
		try {
			doc = iframe.contentDocument || iframe.contentWindow.document;
			// doc may be undefined in Safari or Chrome<32 if document is cross site
		} catch (e) {
			// do nothing
		}

		return !doc; // undefined or null
	};

	/*
	 * Returns the corresponding image element for an area element
	 */
	nuanria.utils.getImgForArea = function(areaElement) {
		if (areaElement.nodeName != "AREA") {
			return null;
		}

		var mapName = areaElement.parentNode.name;
		return document.querySelector("img[usemap='#" + mapName + "']");
	}

	/*
	 * Returns bounds, works on <area> elements too
	 */
	nuanria.utils.getBoundingClientRect = function(element) {
		if (element.nodeName == "AREA") {
			return nuanria.utils.getAreaRect(element);
		} else {
			var bounds = element.getBoundingClientRect();
			// return bounds as a regular js object (that can be serialized)
			return {
				left   : bounds.left,
				top    : bounds.top,
				right  : bounds.right,
				bottom : bounds.bottom,
				width  : bounds.width,
				height : bounds.height
			};
		}
	}

	/*
	 * Returns all bounds rects, works on <area> elements too
	 */
	nuanria.utils.getClientRects = function(element) {
		if (element.nodeName == "AREA") {
			return [nuanria.utils.getAreaRect(element)];
		} else {
			return element.getClientRects();
		}
	}

	/*
	 * Returns the rectangle encompassing an <area> element
	 */
	nuanria.utils.getAreaRect = function(areaElement) {
		// Note that in IE we get offset positions, but we Chrome
		// doesn't give use these, so we need to work it out ourselves

		var rect = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };

		// get img associated with this area
		var img = nuanria.utils.getImgForArea(areaElement);
		if (!img) {
			return rect;
		}
		var imgBounds = img.getBoundingClientRect();

		// get coords as an array of ints
		var coords = areaElement.getAttribute("coords").split(",");
		for (var i = 0; i < coords.length; i++) {
			coords[i] = parseInt(coords[i], 10);
		}

		// set bounds of area according to coords:
		if (areaElement.getAttribute("shape") == "circle") {
			// circle: coords are x, y, radius
			if (coords.length != 3) {
				return rect;
			}

			rect.width  = coords[2];
			rect.height = coords[2];
			rect.left   = coords[0] - coords[2];
			rect.top    = coords[1] - coords[2];
			rect.right  = coords[0] + coords[2];
			rect.bottom = coords[1] + coords[2];

		} else if (areaElement.getAttribute("shape") == "poly") {
			// polygon: cords are x1, y1, x2, y2, ...
			if (coords.length % 2 != 0) {
				return rect;
			}

			// find outer extremes of the polygon
			for (var i = 0; i < coords.length; i+=2) {
				var x = coords[i];
				var y = coords[i+1];
				rect.left   = (rect.left == 0 || x < rect.left) ? x : rect.left;
				rect.top    =  (rect.top == 0  || y < rect.top)  ? y : rect.top;
				rect.right  = x > rect.right  ? x : rect.right;
				rect.bottom = y > rect.bottom ? y : rect.bottom;
			}

		} else if (areaElement.getAttribute("shape") == "rect") {
			// rectangle: coords are left, top, right, bottom
			if (coords.length != 4) {
				return rect;
			}

			rect.left   = coords[0];
			rect.top    = coords[1];
			rect.right  = coords[2];
			rect.bottom = coords[3];

		} else {
			// default (specifies the entire region)
			rect.right  = imgBounds.width;
			rect.bottom = imgBounds.height;
		}

		// calculate width and height
		rect.width = rect.right - rect.left;
		rect.height = rect.bottom - rect.top;

		// adjust for <img> offset
		rect.left    += imgBounds.left;
		rect.top     += imgBounds.top;
		rect.right   += imgBounds.left;
		rect.bottom  += imgBounds.top;

		return rect;
	}

    /*
    * A minor frame is a same-site iframe that
    * has not loaded nuanria yet. We are interested
    * in these because they can be rich text editors.
    */
	nuanria.utils.isMinorFrame = function(iframe) {
	    if (iframe.nodeName != "IFRAME") {
	        return false;
	    }

	    if (nuanria.utils.isFrameCrossSite(iframe)) {
	        return false;
	    }

	    return !iframe.contentWindow.nuanria;
	};

	/*
	 * Returns true if the element matches the selector
	 */
	nuanria.utils.matchesSelector = function(element, selector) {
		if (element.matches) {
			return element.matches(selector);

		} else if (element.matchesSelector) {
			return element.matchesSelector(selector);

		} else if (element.mozMatchesSelector) {
			return element.mozMatchesSelector(selector);

		} else if (element.webkitMatchesSelector) {
			return element.webkitMatchesSelector(selector);

		} else if (element.msMatchesSelector) {
			return element.msMatchesSelector(selector);

		} else {
			nuanria.utils.logError("Can't find matchesSelector implementation");
			return false;
		}
	};

	/*
	 * Return the first element that matches the selector by testing the
	 * element itself and traversing up through its ancestors
	 * in the DOM tree.
	 */
	nuanria.utils.findClosestAncestor = function(element, selector) {
		var node = element;
		while (node && node.nodeType != Node.DOCUMENT_NODE) {
			if (nuanria.utils.matchesSelector(node, selector)) {
				return node;
			}
			node = node.parentNode;
		}

		return null;
	};

	/*
	 * Returns:
	 *  Less than zero if versionA is less than versionB
	 *  0 if versionA is equal to versionB
	 *  Greater than zero if version A is greater than versionB
	 */
	nuanria.utils.compareVersions = function(versionA, versionB) {
		var versionAParts = versionA.split(".");
		var versionBParts = versionB.split(".");

		var versionAInt = (parseInt(versionAParts[0], 10) || 0) * Math.pow(1000, 3) +
					  (parseInt(versionAParts[1], 10) || 0) * Math.pow(1000, 2) +
					  (parseInt(versionAParts[2], 10) || 0) * Math.pow(1000, 1) +
					  (parseInt(versionAParts[3], 10) || 0) * Math.pow(1000, 0);

		var versionBInt = (parseInt(versionBParts[0], 10) || 0) * Math.pow(1000, 3) +
					  (parseInt(versionBParts[1], 10) || 0) * Math.pow(1000, 2) +
					  (parseInt(versionBParts[2], 10) || 0) * Math.pow(1000, 1) +
					  (parseInt(versionBParts[3], 10) || 0) * Math.pow(1000, 0);

		return versionAInt - versionBInt;
	}

    // This function is used to introduce a debounce delay for an event that is continually firing but is
    // not needed to process until it stops firing for "delay" time
	nuanria.utils.debounce = function (fn, delay) {
	    var timer = null;
	    return function () {
	        var context = this, args = arguments;
	        clearTimeout(timer);
	        timer = setTimeout(function () {
	            fn.apply(context, args);
	        }, delay);
	    };
	}

}());
