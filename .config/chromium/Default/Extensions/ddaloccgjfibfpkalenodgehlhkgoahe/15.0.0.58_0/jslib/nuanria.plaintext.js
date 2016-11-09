////////////////////////////////////////////////////////////////////////////////
//
//	@file		plaintext.js
//	@details	Plain text input handling functions for Dragon RIA plugin
//
//	@author		Chris Hardy
//	@date		10-Mar-2012
//	@copyright	(C) Copyright Nuance Communications, Inc. 2012 All Rights Reserved.
//				Trade secret and confidential information of Nuance Communications, Inc.
//				Copyright protection claimed includes all forms and matters of
//				copyrightable material and information now allowed by statutory or
//				judicial law or hereinafter granted, including without limitation,
//				material generated from the software programs which are displayed
//				on the screen such as icons, screen display looks, etc.
//
////////////////////////////////////////////////////////////////////////////////

var nuanria = nuanria || {};
nuanria.plaintext = nuanria.plaintext || {};

(function(){
	"use strict";

	var browserDefaultLinefeed = "\n";
	var outputLinefeed = "\r\n";

	nuanria.plaintext.enable = function(editor) {
		outputLinefeed = nuanria.utils.isMac() ? "\n" : "\r\n";
	};

	nuanria.plaintext.getAll = function() {
		var selectors = [
				'input[type=text]',
				'input[type=email]',
				'input[type=search]',
				'input[type=password]',
				'input[type=tel]',
				'textarea',
				'input:not([type])'
			];
		var combinedSelector = selectors.join(",");

		return document.querySelectorAll(combinedSelector);
	};

	nuanria.plaintext.getActive = function() {
		var candidates = nuanria.plaintext.getAll();

		for (var i = 0; i < candidates.length; i++) {
			var candidate = candidates[i];
			if (nuanria.FrameConnector.instance.getIsFocused() &&
				document.activeElement == candidate)
			{
				return candidate;
			}
		}

		return false;
	};

	nuanria.plaintext.getChanges = function() {
		var input = nuanria.plaintext.getActive();
		if (!input) {
			nuanria.utils.logError("Can't find plaintext input", "getChanges");
			return {};
		}

		var result = {};
		var text = getText(input);
		var selectionInfo = getSelectionInfo(input);

		result.text = text;
		result.selStart = selectionInfo.start;
		result.selLength = selectionInfo.length;
		if (nuanria.utils.isIE()) {
			// Visible range calcuation isn't reliable in IE
			result.visibleStart = 0;
			result.visibleLength = -1;
		} else {
			var visibleRange = getVisibleRange(input, text.length);
			result.visibleStart = visibleRange.visibleStart;
			result.visibleLength = visibleRange.visibleLength;
		}

		nuanria.utils.log("GetChanges", JSON.stringify(result));
		return result;
	};

	nuanria.plaintext.makeChanges = function(blockStart, blockLength, text, selStart, selLength) {
		//nuanria.utils.log("MakeChanges:" + blockStart + ", " + blockLength + ", " + text + ", " + selStart + ", " + selLength);

		var input = nuanria.plaintext.getActive();
		if (!input) {
			nuanria.utils.logError("Can't find plaintext input", "makeChanges");
			return;
		}

		if (blockLength !== 0 || text.length) {
			selectText(input, blockStart, blockLength);
			sendText(input, text);
		}

		selectText(input, selStart, selLength);
	};

	nuanria.plaintext.getCharacterRectangle = function(index) {
		var input = nuanria.plaintext.getActive();
		if (!input) {
			nuanria.utils.logError("Can't find plaintext input", "getCharacterRectangle");
			return;
		}

		var result = {};
		var coords = getCharCoords(input, index);
		result.top = coords.top;
		result.left = coords.left;
		result.bottom = result.top + 1;
		result.right = result.left + 1;

		// adjust result for dpi scaling
		if (window.devicePixelRatio) {
			result.top = Math.floor(result.top * window.devicePixelRatio);
			result.left = Math.floor(result.left * window.devicePixelRatio);
			result.bottom = Math.floor(result.bottom * window.devicePixelRatio);
			result.right = Math.floor(result.right * window.devicePixelRatio);
		}

		nuanria.utils.log("GetCharacterRectangle", index, result);
		return result;
	};

	//-----------------------------------------------------------------------------
	//-----------------------------------------------------------------------------

	function getText(input) {
		var retVal = input.value;
		if (browserDefaultLinefeed != outputLinefeed) {
			var pattern = new RegExp(browserDefaultLinefeed, "g");
			retVal = retVal.replace(pattern, outputLinefeed);
		}
		return retVal;
	}

	function getSelectionInfo(input, noLinefeedAdjust) {
		if (!input) return { start: 0, length: 0, visibleStart: 0, visibleLength: 0 };

		var c = caret(input);
		var textRange = { start: c.start, end: c.end };

		if (!noLinefeedAdjust) {
			adjustTextRangeForLinefeeds(input.value, textRange, browserDefaultLinefeed, outputLinefeed);
		}

		var result = {
				start: textRange.start,
				length: textRange.end - textRange.start
			};

		return result;
	}

	function selectText(input, start, length) {
		var textRange = { start: start, end: start+length };

		adjustTextRangeForLinefeeds(getText(input), textRange, outputLinefeed, browserDefaultLinefeed);

		caret(input, textRange);

		if (nuanria.utils.isChrome()) {
			// Chrome doesn't do this automatically
			scrollToPosition(input, start);
		}
	}

	function adjustTextRangeForLinefeeds(text, range, fromLineFeed, toLineFeed) {
		// expect range has "start" and "end" values

		var linefeedLenDiff = toLineFeed.length - fromLineFeed.length;
		if (linefeedLenDiff) {
			var startOffset = 0;
			var endOffset = 0;
			for (var i = -1;;) {
				i = text.indexOf(fromLineFeed, i+1);
				if (i == -1) {
					break;
				}

				if (i < range.start) startOffset += linefeedLenDiff;
				if (i < range.end) endOffset += linefeedLenDiff;
			}
			range.start += startOffset;
			range.end += endOffset;
		}

		return range;
	}

	function getCharCoords(input, index) {
		var ieSelection;
		try {
			// try and obtain the document selection object
			// provided by the addon (IE only)
			ieSelection = nuanria.addonDelegate.getSelection();
		} catch (e) {
			ieSelection = null;
		}

		if (ieSelection) {
			try {
				// use special IE mechanisms if possible in IE
				var selInfo = getSelectionInfo(input);
				selectText(input, index, 0);
				var coords = getCursorCoords_IE(ieSelection);
				selectText(input, selInfo.start, selInfo.length);
				return coords;
			} catch (e) {
				// fall back to DOM
				return getCharCoords_DOM(input, index);
			}

		} else {
			// use normal DOM mechanisms
			return getCharCoords_DOM(input, index);
		}
	}

	function getCursorCoords_IE(selection) {
		var range = selection.createRange();
		var coords = {
			left     : range.boundingLeft
							+ range.parentElement().scrollLeft,
			top      : range.boundingTop
							+ (range.boundingHeight - 4)
							+ range.parentElement().scrollTop
		};

		return coords;
	}

	function getCharCoords_DOM(input, index) {
		var retVal;
		var mock = drawMockInput(input);
		try {
			retVal = getCharCoordsFromMock(mock, input, index);
			mock.parentNode.removeChild(mock);
		} catch (e) {
			mock.parentNode.removeChild(mock);
			throw (e);
		}
		return retVal;
	}

	function getCharCoordsFromMock(mock, input, index) {
		var coords = { left: 0, top: 0 };
		var inner = mock.childNodes[0];

		// measure mocks
		var innerRect = inner.getBoundingClientRect();

		// set base coords to the position of the textbox
		var inputRect = input.getBoundingClientRect();
		coords.left = inputRect.left;
		coords.top = inputRect.top;

		// add in cursor coords
		if (inner.childNodes.length) {
			// text field has content
			var range = { start: index, end: index };
			adjustTextRangeForLinefeeds(getText(input), range, outputLinefeed, browserDefaultLinefeed);
			var cursorPos = nuanria.utils.getCharacterCoords(inner.childNodes[0], range.start);
			coords.left += cursorPos.left;
			coords.top += cursorPos.top - input.scrollTop;
		} else {
			// text field is empty
			coords.left += innerRect.left;
			coords.top += innerRect.top;
		}

		// round down coords
		coords.left = Math.floor(coords.left);
		coords.top = Math.floor(coords.top);

		return coords;
	}

	function scrollToPosition(input, pos) {
		var cursorCoords = getCharCoords_DOM(input, pos);
		var inputRect = nuanria.utils.getBoundingClientRect(input);

		// x scrolling
		var xAdjustment = 30; // px (empirical)
		if (cursorCoords.left > inputRect.right) {
			// cursor is hidden to the right of the edit control
			input.scrollLeft += (cursorCoords.left - inputRect.right) + xAdjustment;
		} else if (cursorCoords.left < inputRect.left) {
			// cursor is hidden to the left of the edit control
			input.scrollLeft -= (inputRect.left - cursorCoords.left) + xAdjustment;
		}

		// y scrolling
		var yAdjustment = 15; // px (empirical)
		if (cursorCoords.top > inputRect.bottom) {
			// cursor is below the bottom of the edit control
			input.scrollTop += (cursorCoords.top - inputRect.bottom) + yAdjustment;
		} else if (cursorCoords.top < inputRect.top) {
			// cursor is above the top of the edit control
			input.scrollTop -= (inputRect.top - cursorCoords.top) + yAdjustment;
		}
	}

	function sendText(input, text) {
	    // In IE, Make all changes as a single unit on the undo stack. See TTP30218
	    if (document.queryCommandSupported("ms-beginUndoUnit")) {
	        document.execCommand("ms-beginUndoUnit"); // need to end Undo unit
	    }

		var selInfo = getSelectionInfo(input, true);

		// convert linefeeds in text to the type of linefeed used by the browser
		if (browserDefaultLinefeed != outputLinefeed) {
			var pattern = new RegExp(outputLinefeed, "g");
			text = text.replace(pattern, browserDefaultLinefeed);
		}

		input.value = [
			input.value.slice(0, selInfo.start),
			text,
			input.value.slice(selInfo.start + selInfo.length)
		].join('');

		// stimulate the editor with some noop events.
		nuanria.automation.keyboardEvent("keydown", input, {shift:true});
		nuanria.automation.keyboardEvent("keyup", input, {shift:true});
		nuanria.automation.mouseEvent("mousedown", input);
		nuanria.automation.mouseEvent("mouseup", input);

		// See TTP30218
		if (document.queryCommandSupported("ms-endUndoUnit")) {
		    document.execCommand("ms-endUndoUnit");
		}
	}

	function getVisibleRange(input) {
		var inputRect = nuanria.utils.getBoundingClientRect(input);
		var range = { start: 0, end: 0 };
		var min, max, mid, coords, visible;

		var mock = drawMockInput(input);
		try {
			// binary reduction looking for index of first visible char
			min = 0;
			mid = 0;
			max = input.value.length;
			while (min < max) {
				// test visiblity of character at index==mid
				mid = Math.floor((min + max) / 2);
				coords = getCharCoordsFromMock(mock, input, mid);
				visible = coords.top >= inputRect.top &&
							  coords.left >= inputRect.left;

				// reduce
				if (visible) {
					max = mid; // search lower
				} else {
					min = mid + 1;  // search higher
				}
			}
			range.start = mid;

			// binary reduction looking for index of last visible char
			min = range.start;
			mid = 0;
			max = input.value.length;
			while (min < max) {
				// test visiblity of character at index==mid
				mid = Math.ceil((min + max) / 2);
				coords = getCharCoordsFromMock(mock, input, mid);
				visible = coords.top <= inputRect.bottom &&
							  coords.left <= inputRect.right;

				// reduce
				if (visible) {
					min = mid;  // search higher
				} else {
					max = mid - 1; // search lower
				}
			}
			range.end = mid;

			mock.parentNode.removeChild(mock);
		} catch (e) {
			mock.parentNode.removeChild(mock);
			throw e;
		}

		adjustTextRangeForLinefeeds(input.value, range, browserDefaultLinefeed, outputLinefeed);

		return {
			visibleStart: range.start,
			visibleLength: range.end - range.start
		};
	}
	window.getVisible = getVisibleRange;

	/*
	 * Creates a div on the screen with the same properties as the
	 * input. This is useful for measuring character positions.
	 */
	function drawMockInput(input) {
		var doc = input.ownerDocument;
		var win = doc.defaultView;
		var inputStyles = win.getComputedStyle(input);

		var existingMock = document.getElementById("nuan_mocktbouter");
		if (existingMock) {
			existingMock.parentNode.removeChild(existingMock);
		}

		// create div with same properties as textbox
		var outer = document.createElement("div");

		// Accommodate for 1px of left/right padding inside the text input
		// (This might be only necessary for Firefox)
		var width = input.clientWidth - 2;

		outer.id = "nuan_mocktbouter";
		outer.style.setProperty("position", "fixed", "important");
		outer.style.setProperty("z-index", "1000000", "important");
		outer.style.setProperty("width", width + "px", "important");
		outer.style.setProperty("height", input.clientHeight + "px", "important");
		outer.style.setProperty("top", "0", "important");
		outer.style.setProperty("left", "0", "important");
		outer.style.setProperty("background", "green", "important");
		outer.style.setProperty("padding", inputStyles.padding, "important");
		outer.style.setProperty("padding-top", inputStyles.paddingTop, "important");
		outer.style.setProperty("padding-right", inputStyles.paddingRight, "important");
		outer.style.setProperty("padding-bottom", inputStyles.paddingBottom, "important");
		outer.style.setProperty("padding-left", inputStyles.paddingLeft, "important");
		outer.style.setProperty("margin", "0", "important");
		outer.style.setProperty("overflow", "visible", "important");
		outer.style.setProperty("text-align", inputStyles.textAlign, "important");

		// create div with same properties as textbox
		var inner = document.createElement("span");
		inner.id = "nuan_mocktbinner";
		inner.innerHTML = input.value ? input.value : "&nbsp;";
		inner.style.setProperty('display', "block", "important");
		inner.style.setProperty('font', inputStyles.font, "important");
		inner.style.setProperty('font-size', inputStyles.fontSize, "important");
		inner.style.setProperty('font-family', inputStyles.fontFamily, "important");
		inner.style.setProperty('white-space', (input.nodeName == "TEXTAREA" ?
									'pre-wrap' : // preserve whitespace, with wrap
									'pre'),      // preserve whitespace, no wrap
								"important");
		inner.style.setProperty('margin-left', '-' + input.scrollLeft + 'px', "important");
		inner.style.setProperty('line-height', inputStyles.lineHeight, "important");
		inner.style.setProperty('overflow', inputStyles.overflow, "important");
		inner.style.setProperty('overflow-x', inputStyles.overflowX, "important");
		inner.style.setProperty('overflow-y', inputStyles.overflowY, "important");

		// add mocks to DOM
		outer.appendChild(inner);
		document.body.appendChild(outer);

		return outer;
	}

	// Helper for manipulating and inspecting caret/selection in a text field
	function caret(input, options) {
		var start,
			end,
			t=input,
			msie=input.createTextRange;
		if(typeof options==="object" && typeof options.start==="number" && typeof options.end==="number") {
			start=options.start;
			end=options.end;
		} else if(typeof options==="number" && typeof opt2==="number"){
			start=options;
			end=opt2;
		} else if(typeof options==="string"){
			if((start=t.value.indexOf(options))>-1) end=start+options["length"];
			else start=null;
		} else if(Object.prototype.toString.call(options)==="[object RegExp]"){
			var re=options.exec(t.value);
			if(re !== null) {
				start=re.index;
				end=start+re[0]["length"];
			}
		}
		if(typeof start!="undefined"){
			if(msie){
				var selRange = input.createTextRange();
				// first reset selection to 0,0
				// This fixes a weird selection bug in IE
				selRange.collapse(true);
				selRange.moveStart('character', 0);
				selRange.moveEnd('character', 0);
				selRange.select();

				// Now set selection as desired
				selRange.moveStart('character', start);
				selRange.moveEnd('character', end-start);
				selRange.select();

			} else {
				input.selectionStart = 0;
				input.selectionEnd = 0;
				input.selectionStart=start;
				input.selectionEnd=end;
			}
			input.focus();
		} else {
			var s=t.selectionStart, e=t.selectionEnd;
			var te=t.value.substring(s,e);
			return {start:s,end:e,text:te,replace:function(st){
				return t.value.substring(0,s)+st+t.value.substring(e,t.value["length"]);
			}};
		}
	};

}());