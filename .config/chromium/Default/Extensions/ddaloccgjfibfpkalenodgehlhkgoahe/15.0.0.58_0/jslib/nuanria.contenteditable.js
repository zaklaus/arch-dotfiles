////////////////////////////////////////////////////////////////////////////////
//
//	@file		nuanria.contenteditable.js
//	@details	ContentEditable dictation support
//
//	@author		Chris Hardy
//	@date		23-Oct-2013
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
nuanria.contenteditable = nuanria.contenteditable || {};

;(function () {
	"use strict";

	var initialized     = false;
	var rules           = null;
	var parser          = null;
	var lastParseOutput = null;

	/*
	 * init done lazily the first time nuanria.contenteditable.enable is called
	 */
	function init() {
		if (!initialized) {
			rules = configureRules();
			parser = new nuanria.DomParser(rules);

			// configure ParseContext prototype
			nuanria.utils.extend(nuanria.DomParser.Context, ParseContext);

			initialized = true;
		}
	}

	//-------------------------------------------------------------------------
	// Editor API

	/*
	 * Returns an array of rich text editor elements on the page
	 */
	nuanria.contenteditable.getAll = function() {
		var candidates = document.querySelectorAll("iframe,*[contenteditable], body");

		var all = [];
		for (var i = 0; i < candidates.length; i++) {
			var candidate = candidates[i];

			// exclude google docs
			if (candidate.className == "docs-texteventtarget-iframe")
			{
				continue;
			}

			// exclude word web app
			if (candidate.id &&
				document.location.host.search("live.com") > -1 &&
				(candidate.id == "ContentEditableBody" ||
				 candidate.id.indexOf("WACViewPanel") > -1))
			{
				continue;
			}

			if (candidate.nodeName == "IFRAME") {
				// check if design mode hosting frame
			    if (nuanria.utils.isMinorFrame(candidate) &&
					isRichText(candidate.contentDocument.body)) {
					all.push(candidate);
				}
			} else {
				// check if actual richtext element
				if (isRichText(candidate)) {
					all.push(candidate);
				}
			}
		}

		return all;
	};

	/*
	 * Returns the active rich text editor on the page (or null)
	 */
	nuanria.contenteditable.getActive = function() {
		var candidates = nuanria.contenteditable.getAll();

		for (var i = 0; i < candidates.length; i++) {
			var candidate = candidates[i];

			if (document.activeElement != candidate) {
				continue;
			}

			var frameConnector = nuanria.FrameConnector.instance;
			if (!frameConnector) {
				continue;
			}

			if (candidate.nodeName == "IFRAME") {
			    if (!nuanria.utils.isMinorFrame(candidate)) {
					continue;
				}

				if (frameConnector.getIsActive()) {
					return candidate;
				}

			} else if (frameConnector.getIsFocused()) {
				return candidate;
			}
		}

		return null;
	};

	/*
	 * Invoked when a rich text editor becomes focused
	 */
	nuanria.contenteditable.enable = function(editor) {
		init();

		if (document.selection) {
			// IE9, 10 only - workaround for paste bug (see onPaste)
			editor.addEventListener("paste", onPaste);
		}
	};

	/*
	 * Invoked when a rich text editor loses focus
	 */
	nuanria.contenteditable.disable = function(editor) {
	 if (document.selection) {
			// IE9, 10 only
			editor.removeEventListener("paste", onPaste);
		}
	};

	/*
	 * Returns contents and information about the active rich text editor
	 */
	nuanria.contenteditable.getChanges = function() {
		//nuanria.utils.log("nuanria.contenteditable.getChanges()");

		var input = createParseInput();
		var root = getEditorRootElement();
		var context = new ParseContext(root, input, new ParseOutput());
		lastParseOutput = parser.parse(context);

		return lastParseOutput;
	};

	/*
	 * Changes text and/or selection of the active rich text editor
	 */
	nuanria.contenteditable.makeChanges = function(blockStart, blockLength, text, selStart, selLength, formatCommand) {
		if (!text) text = "";

		nuanria.utils.log("contenteditable.makeChanges(" + blockStart + ", " + blockLength + ", \"" + text + "\", " + selStart + ", " + selLength + "," + formatCommand + ")");

		var input = createParseInput();
		var root = getEditorRootElement();

		// set initial selection
		if (blockStart >= 0 && blockLength >= 0) {
			input.setSelStart = blockStart;
			input.setSelEnd = blockStart + blockLength;
			var context = new ParseContext(root, input, new ParseOutput());
			var output = parser.parse(context);
			context.updateSelection();
		}

		// change selected text
		if (!(text === -1) &&
            (text != "" || blockLength != 0)) {
		    sendText(root, text, input, output);
			output.selStart = blockStart + text.length;
			output.selLength = 0;
		}

		// set final selection
		if (!output || selStart != output.selStart || selLength != output.selLength) {
			input.setSelStart = selStart;
			input.setSelEnd = selStart + selLength;
			var context = new ParseContext(root, input, new ParseOutput());
			output = parser.parse(context);
			context.updateSelection();
		}

		// format selected text
		if (formatCommand && selLength) {
			formatText(root, formatCommand);
		}

		lastParseOutput = output;

		// Sometimes focus isn't returned properly to the edit control.
		// This can happen in IE when using the Spell Dialog for the
	    // first time. Calling focus on the editor helps with this issue.
	    // Fix for TTP32116. After applying the change to fix the calculation of the visible area for IE11, the code 
	    // below would make the viewable area scroll to the top when the correction menu was displayed. Changed this to use
        // conditional compilation in IE so it will only run in browser that are less than or equal to IE10
	    /*@cc_on
            @if (@_jscript_version <= 10)
                root.focus();
            @end
        @*/
		return output;
	};

	/*
	 * Returns screen coordinates of a character relative to the editor's document
	 */
	nuanria.contenteditable.getCharacterRectangle = function(index) {
		//nuanria.utils.log("nuanria.contenteditable.getCharacterRectangle(" + index + ") BEG");

		var editor = nuanria.contenteditable.getActive();
		var root = getEditorRootElement(editor);
		var doc = root.ownerDocument;
		var changedSelection = false;
		var sel = doc.getSelection();

		// get current selection and make a copy
		var range = sel.getRangeAt(0);
		var oldRange = range.cloneRange();

		// select position if we don't think that it is already selected
		if (!lastParseOutput || lastParseOutput.selStart != index) {
			var input = createParseInput();
			input.setSelStart = index;
			input.setSelEnd = index;
			var context = new ParseContext(root, input, new ParseOutput());
			parser.parse(context);
			context.updateSelection();
			range = sel.getRangeAt(0);
			changedSelection = true;
//nuanria.utils.log("nuanria.contenteditable.getCharacterRectangle(" + index + ") - index != to selection");
		}

		// expand range to select the character. This gives better results in Firefox
		if (range.endContainer.nodeType == Node.TEXT_NODE &&
			range.endContainer.nodeValue.length > range.endOffset)
		{
			range.setEnd(range.endContainer, range.endOffset+1);
			changedSelection = true;
		}

		// Try this first, it doesn't need to modify the DOM.
		// It doesn't work consistently in all browsers and situations though.
		var coords = range.getBoundingClientRect();
		/*var coords = {
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
			width: 0,
			height: 0
		};*/

		if (!coords.left) {
			// Coordinates could not be determined.
			// Fall back to old method. utils.getCoords modifies the DOM in order to
			// determine coordinates. Because of this it may add an empty item to the
			// undo stack.
		    coords = nuanria.utils.getCoords(range.startContainer, range.startOffset);
//nuanria.utils.log("nuanria.contenteditable.getCharacterRectangle(" + index + ") " + JSON.stringify(coords) + " - After calling nuanria.utils.getCoords");
		} else {
			// make coords a regular object
			coords = {
				left: coords.left,
				top: coords.top,
				right: coords.right,
				bottom: coords.bottom,
				width: coords.width,
				height: coords.height
			};
//nuanria.utils.log("nuanria.contenteditable.getCharacterRectangle(" + index + ") " + JSON.stringify(coords) + " - After calling range.getBoundingClientRect");
		}

		// If the element is not in the top frame of the tab, find this frame's
		// offset and adjust the coordinates.
		if (editor.nodeName == "IFRAME") {
			var parentFixedOffset = editor.getBoundingClientRect();
			coords.left += parentFixedOffset.left;
			coords.top += parentFixedOffset.top;
			coords.bottom += parentFixedOffset.top;
//nuanria.utils.log("nuanria.contenteditable.getCharacterRectangle(" + index + ") - element is not in the top frame");
        }
		
		if (changedSelection) {
			// restore initial selection
			sel = doc.getSelection();
			sel.removeAllRanges();
			sel.addRange(oldRange);
//nuanria.utils.log("nuanria.contenteditable.getCharacterRectangle(" + index + ") - selection restored");
		}

		var result = {};
		result.left = Math.floor(coords.left);
		result.top = Math.floor(coords.bottom);
		result.right = Math.floor(result.left + 1);
		result.bottom = Math.floor(result.top + 1);

		lastParseOutput = null; // invalidate last parseOutput

//nuanria.utils.log("nuanria.contenteditable.getCharacterRectangle(" + index + ") " + JSON.stringify(result));

		// adjust result for dpi scaling
		// TTP31690 - RIA + IE11 on Surface: Disambiguation markers appear at some distance from the words to be corrected
		// The dpi scaling adjustment was moved to speechclient since this adjustment must be applied after all
		// all offsets are applied. There is an additional offset applied in speechclient before the result is
		// returned to the C++ plugin.
		/*if (window.devicePixelRatio) {
			result.top = Math.floor(result.top * window.devicePixelRatio);
			result.left = Math.floor(result.left * window.devicePixelRatio);
			result.bottom = Math.floor(result.bottom * window.devicePixelRatio);
			result.right = Math.floor(result.right * window.devicePixelRatio);
			nuanria.utils.log("nuanria.contenteditable.getCharacterRectangle(" + index + ") " + JSON.stringify(result) + " after dpi scaling(" + window.devicePixelRatio + ")");
        }*/

		return result;
	};


	//-------------------------------------------------------------------------
	// ParseInput

	var ParseInput = function() {
		this.setSelStart   = -1;
		this.setSelEnd     = -1;
		this.ieBreaks      = false;
		this.lineFeed      = "\r\n";
		this.lump          = "[~]";
	};


	//-------------------------------------------------------------------------
	// ParseOutput

	var ParseOutput = function() {
		this.text            = "";
		this.selStart        = -1;
		this.selLength       = -1;
		this.visibleStart    = 0;
		this.visibleLength   = -1;
	};


	//-------------------------------------------------------------------------
	// ParseContext (extends nuanria.DomParser.Context)

	var ParseContext = function(root, input, output) {
		this.visibleRangeTopSet     = false;
		this.visibleRangeBottomSet  = false;
		this.lastLineFeed           = "START";
		this.startSelected          = false;
		this.endSelected            = false;
		this.range;
		this.visibleBounds;
		this.visibleRange;
		this.tempRange;

		// Call the parent's constructor
		nuanria.DomParser.Context.call(this, root, input, output);

		var document  = root.ownerDocument;
		var selection = document.getSelection();

		// set range
		this.range = selection.rangeCount > 0 ?
						selection.getRangeAt(0) : document.createRange();

		// init visible range to entire contents of root
		this.visibleRange = document.createRange();
		this.visibleRange.setStart(root, 0);
		this.visibleRange.setEnd(root, root.childNodes.length);

		// visible bounds of root element
		this.visibleBounds = getEditorVisibleBounds(root);

		// temp range used for measuring elements
		this.tempRange = this.visibleRange.cloneRange();

		this.updateSelection = function() {
			selection.removeAllRanges();
			selection.addRange(this.range);
		}
	};


	//-------------------------------------------------------------------------
	// Parse Rules
	// Notes:
	//   In each rule, the "this" variable points to the current ParseContext

	function configureRules() {
		var rules = new nuanria.DomParser.ParseRules();

		rules.addValidTypes(["BR", "P", "DIV", "UL", "LI", "OL", "BLOCKQUOTE",
							 "#text", "SPAN", "I", "B", "U", "A", "S", "FONT", "EM", "STRONG", "SMALL",
							 "TABLE", "TH", "TBODY", "TR", "TD",
							 "H1", "H2", "H3", "H4", "H5", "H6",
							 "ROOT", "CHAR"]);

		rules.addFilterGroup("BLOCK", ["P", "DIV", "UL", "LI", "OL", "BLOCKQUOTE", "TH", "TR", "TD",
									   "H1", "H2", "H3", "H4", "H5", "H6"]);

		rules.addFilterGroup("INLINE", ["SPAN", "I", "B", "U", "A", "S", "FONT", "EM", "STRONG",
										"SMALL"]);

		rules.addFilterGroup("CONTAINER", ["BLOCK", "INLINE", "#text", "ROOT"]);

		// Opening node rules ---------------------------------

		/*
		 * Workaround for weird IE <p><br/></p> behavior
		 */
		rules.add("ie-newline-para", true, "*", function() {
			// In IE11, when a user presses the enter key, an element will be inserted
			// that appears as <p></p> (or <div></div>). If you look at the childNodes collection of
			// this new <p> tag, you'll see that it is empty. HOWEVER, this <p>
			// tag is not treated as empty by IE. If you look at the innerHTML property
			// you see that it contains "<br/>".
			// We can "fix" this situation by re-assigning the innerHTML back to that node
			// and this will ensure that the childNodes collection reflects the actual
			// contents of the element.

			if (!this.node.childNodes) {
				return;
			}

			if (this.node.childNodes.length == 0 && this.node.innerHTML != "") {
				// ensure the childNodes collection properly reflects what IE thinks is in this node
				this.node.innerHTML = this.node.innerHTML;
			}
		});

		/*
		 * Add a newline at the start of every block element that follows
		 * some text.
		 */
		rules.add("start-block-break", true, "BLOCK", function() {
			if (this.lastLineFeed === null) {
				this.output.text       += this.input.lineFeed;
				this.lastLineFeed       = "BLOCK";
			}
		});

		/*
		 * Change the selection start to position 0 in a node
		 */
		rules.add("changeSelectionStart-startNode", true, "*", function() {
			if (this.output.text.length != this.input.setSelStart) {
				return;
			}

			var nodeType = this.getNodeType();
			if (this.rules.typeMatches(nodeType, "CONTAINER")) {
				// position 0 inside a block
				this.range.setStart(this.node, 0);
				this.startSelected = true;
//console.log("CS-S-0: " + this.input.setSelStart + " " + nodeType, this.range.startContainer, this.range.startOffset);

			} else  {
				// position n inside the parent
				this.range.setStart(this.getParentNode(), this.siblingIndex);
				this.startSelected = true;
//console.log("CS-S-N: " + this.input.setSelStart + " " + nodeType, this.range.startContainer, this.range.startOffset);
			}

		});

		/*
		 * Change the selection end to position 0 in a node
		 */
		rules.add("changeSelectionEnd-startNode", true, "*", function() {
			if (this.output.text.length != this.input.setSelEnd) {
				return;
			}

			var nodeType = this.getNodeType();
			if (this.rules.typeMatches(nodeType, "CONTAINER")) {
				// position 0 inside an empty block
				this.range.setEnd(this.node, 0);
				this.endSelected = true;
//console.log("CS-E-0: " + this.input.setSelEnd + " " + nodeType, this.range.endContainer, this.range.endOffset);

			} else {

				// position n inside the parent
				this.range.setEnd(this.getParentNode(), this.siblingIndex);
				this.endSelected = true;
//console.log("CS-E-N: " + this.input.setSelEnd + " " + nodeType, this.range.endContainer, this.range.endOffset);
			}

		});

		/*
		 * Get the selection start index when the selection point is at the
		 * beginning of a node, or before a child.
		 */
		rules.add("selectionStart-beforeNode", true, "*", function() {
			if (this.range.startOffset === 0 &&
				this.range.startContainer == this.node)
			{
				// position 0 in the container
				this.output.selStart = this.output.text.length;

			} else if (this.range.startContainer == this.getParentNode() &&
					   this.range.startOffset == this.siblingIndex)
			{
				// position n in a container
				this.output.selStart = this.output.text.length;
			}

//console.log("SS+: " + this.output.selStart);
		});

		/*
		 * Get the selection end index when the selection point is at the
		 * beginning of a node, or before a child.
		 */
		rules.add("selectionLength-beforeNode", true, "*", function() {
			if (this.range.endOffset === 0 &&
				this.range.endContainer == this.node)
			{
				// position 0 in the container
				this.output.selLength = this.output.text.length - this.output.selStart;

			} else if (this.range.endContainer == this.getParentNode() &&
					   this.range.endOffset == this.siblingIndex)
			{
				// position n in the container
				this.output.selLength = this.output.text.length - this.output.selStart;
			}
//console.log("SL+: " + this.output.selLength);
		});

		/*
		 * Determine the start position of the visible text
		 */
		rules.add("setVisibleRangeStart", true, "#text", function() {
			if (this.visibleRangeStartIsSet) {
				return;
			}

			this.tempRange.selectNodeContents(this.node);
			var rect = this.tempRange.getBoundingClientRect();

			if (!rect || !rect.height) {
				return;
			}

			var visibleTop = this.visibleBounds.top + 6; // 6px emperical offset

			if (rect.bottom >= visibleTop) {
				// this text node contains the start position of the visible text
				this.visibleRange.setStart(this.node, 0);

				// set visible start to the beginning of this text node.
				// this will get set more accurately later, if the visible start
				// is not exactly at position 0 in the text node
				this.output.visibleStart = this.output.text.length;

				// set the exact start point of the visible text
				refineRangeStart(this.visibleRange, visibleTop);

				this.visibleRangeStartIsSet = true;
			}
		});

		/*
		 * Determine the end position of the visible text
		 */
		rules.add("setVisibleRangeEnd", true, "#text", function() {
			if (!this.visibleRangeStartIsSet || this.visibleRangeEndIsSet) {
				return;
			}

			this.tempRange.selectNodeContents(this.node);
			var rect = this.tempRange.getBoundingClientRect();

			if (!rect || !rect.height) {
				return;
			}

			this.output.visibleLength = this.output.text.length - this.output.visibleStart;

			var rootNode = this.getRootNode();
			var visibleBottom = this.visibleBounds.bottom - 6; // 6px emperical offset

			if (rect.top > visibleBottom) {
				this.visibleRangeEndIsSet = true;
				return;
			}

			// set visible end to the end of this text node.
			// this will get set more accurately later, if the visible end
			// is not exactly at position 0 in the text node
			this.visibleRange.setEnd(this.node, this.node.nodeValue.length);

			if (rect.bottom >= visibleBottom) {
				// set the exact end point of the visible text
				refineRangeEnd(this.visibleRange, visibleBottom);
				this.visibleRangeEndIsSet = true;
			}
		});

		/*
		 * Insert a newline for every BR tag
		 */
		rules.add("br-break", true, "BR", function() {
			this.output.text  += this.input.lineFeed;
			this.lastLineFeed = "BR";
		});

		 /*
		  * Massage whitespace
		  */
		rules.add("whitespace", true, "CHAR", function() {
			if (this.node == "\xA0") { // non breaking space
				this.node = " ";
			} else if (this.node.match(/\s/)) { // node is whitespace
				if (this.lastLineFeed || this.output.text.match(/\s$/)) {
					this.node = ""; // collapse whitespace
				} else {
					this.node = " ";
				}
			}
		});

		/*
		 * Replace any non-processable element (lump) with a space.
		 * Signal to the parser that dont want to process any children
		 * of this element.
		 */
		rules.add("non-processable-element", true, "LUMP", function() {
			var nodeType = this.getNodeType();
			if (nodeType != "SCRIPT" && nodeType != "STYLE") {
				this.output.text  += this.input.lump;
				this.lastLineFeed  = null;
			}

			return nuanria.DomParser_SKIP_CHILDREN;
		});

		/*
		 * Add a character to the output text string
		 */
		rules.add("character", true, "CHAR", function() {
			this.output.text       += this.node;
			if (this.node.length) {
				this.lastLineFeed = null;
			}
		});

		/*
		 * Add a newline at the close of a block element.
		 * The standard behaviour is to only add a new line if there
		 * has been content in the block.
		 * The IE9/IE10 behaviour is to add it regardless.
		 */
		rules.add("end-block-break", false, "BLOCK", function() {
			if (this.input.ieBreaks || this.lastLineFeed === null) {
				this.output.text       += this.input.lineFeed;
				this.lastLineFeed       = "BLOCK";
			}
		});

		// Closing node rules ---------------------------------

		/*
		 * Change the selection start to be after a node
		 */
		rules.add("changeSelectionStart-afterNode", false, "*", function() {
			if (this.startSelected) {
				return;
			}

			var nodeType = this.getNodeType();
			if (this.output.text.length == this.input.setSelStart) {
				this.range.setStart(this.getParentNode(), this.siblingIndex + 1);
//console.log("CS-S-N1: " + this.input.setSelStart + " " + nodeType, this.range.startContainer, this.range.startOffset);
				this.startSelected = true;
			}
		});

		/*
		 * Change the selection end to be after a node
		 */
		rules.add("changeSelectionEnd-afterNode", false, "*", function() {
			if (this.endSelected) {
				return;
			}

			var nodeType = this.getNodeType();
			if (this.output.text.length == this.input.setSelEnd) {
				if (nodeType == "ROOT") {
					this.range.setEnd(this.node, this.siblingIndex);
				} else {
					this.range.setEnd(this.getParentNode(), this.siblingIndex + 1);
				}

//console.log("CS-E-N1: " + this.input.setSelEnd + " " + nodeType, this.range.endContainer, this.range.endOffset);
				this.endSelected = true;
			}
		});

		/*
		 * Get the selection start index when when the selection point
		 * is after a node.
		 */
		rules.add("selectionStart-afterNode", false, "*", function() {
			if (this.range.startContainer == this.getParentNode() &&
				this.range.startOffset == this.siblingIndex + 1)
			{
				// after position n in the container
				this.output.selStart = this.output.text.length;
//console.log("SS-: " + this.output.text.length);
			}
		});

		/*
		 * Get the selection length when the selection point
		 * is after a node.
		 */
		rules.add("selectionLength-afterNode", false, "*", function() {
			if (this.range.endContainer == this.getParentNode() &&
				this.range.endOffset == this.siblingIndex + 1)
			{
				// after position n in the container
				this.output.selLength = this.output.text.length - this.output.selStart;
//console.log("SL-: " + this.output.text.length);
			}
		});

		rules.add("visibleStart-insideNode", false, "CHAR", function() {
			if (this.visibleRange.startContainer == this.getParentNode() &&
				this.visibleRange.startOffset == this.siblingIndex + 1)
			{
				this.output.visibleStart = this.output.text.length;
			}
		});

		rules.add("visibleLength-insideNode", false, "CHAR", function() {
			if (this.visibleRange.endContainer == this.getParentNode() &&
				this.visibleRange.endOffset == this.siblingIndex + 1)
			{
				this.output.visibleLength = this.output.text.length - this.output.visibleStart;
			}
		});

		/*
		 * Standard behavoiur: Strip off one trailing line break of any sort (if present)
		 * IE9 and IE10 Behaviour: Strip off one trailing BLOCK break (if present)
		 */
		rules.add("trailing-break", false, "ROOT", function() {
			if (!this.lastLineFeed) {
				return;
			}

			if (this.input.ieBreaks && this.lastLineFeed != "BLOCK") {
				return;
			}

			var re = new RegExp(this.input.lineFeed + '[ ]*$', 'g')
			this.output.text = this.output.text.replace(re, "");
			this.output.endsWithLineFeed = true;
		});

		return rules;
	}

	//-------------------------------------------------------------------------
	// Misc helpers

	function createParseInput() {
		var input = new ParseInput();
		input.ieBreaks = navigator.appName.indexOf("Internet Explorer") != -1;
		input.lineFeed = navigator.appVersion.indexOf("Mac") != -1 ? "\r" : "\r\n";
		return input;
	};

	function refineRangeStart(range, viewportTop) {
		var textNode = range.startContainer;

		if (textNode.nodeType != Node.TEXT_NODE) {
			// textNode is not actually a textnode
			return false;
		}

		// Binary search to find the SMALLEST index of a match in the collection of characters.
		// A match is when the BOTTOM of a character is within the viewport.
		// The performance is affected by the time it takes to invoke getBoundingClientRect()
		// which is needed to get the co-ordinates of a character.
		// This is negligible in FF and Chrome but can take up to 2ms each time in IE.
		var min = 0;
		var max = textNode.nodeValue.length;

		// Optimization: we can assume that quite often this search will return min==0
		// because that is the start of the paragraph, and the start of a paragraph is a likely place
		// for the visible range to start.
		// So we can force the first midpoint to fall on the 0 index and make that the first
		// thing it checks.
		// Note: this requires that we force subsequent min assignments to a max of 0 (See **)
		min = 0 - max;

		// continually narrow search until just one element remains
		while (min < max) {
//console.log("narrow start");
			// Math.floor will ensure that mid will be less than max
			var mid = Math.floor((min + max) / 2);

			// test character at A[mid] for match
			var charRange = textNode.ownerDocument.createRange();
			charRange.setStart(textNode, mid);
			charRange.setEnd(textNode, mid+1);
			var rect = charRange.getBoundingClientRect();
			var char = textNode.nodeValue[mid];
			var match = rect.bottom >= viewportTop;

			//nuan_log("m:" + mid + " c:" + char + " b:" + rect.bottom);

			// reduce the search
			if (match) {
				max = mid;  // search lower
				min = Math.max(0, min); // required because of optimization above (**)
			} else {
				min = mid + 1;  // search higher
			}
		}

		range.setStart(textNode, min);
// console.log("detected exact visible start", min, textNode.textContent.substring(min));
		return true;
	}

	function refineRangeEnd(range, viewportBottom) {
		// this is a forward-searching version of refineRangeStart

		var textNode = range.endContainer;

		if (textNode.nodeType != Node.TEXT_NODE) {
			// textNode is not actually a textnode
			return false;
		}

		// Binary search to find the GREATEST index of a match in the collection of characters.
		// A match is when the TOP of a character is within the viewport.
		// The performance is affected by the time it takes to invoke getBoundingClientRect()
		// which is needed to get the co-ordinates of a character.
		// This is negligible in FF and Chrome but can take up to 2ms each time in IE.
		var min = 0;
		var max = textNode.nodeValue.length-1;

		// continually narrow search until just one element remains
		while (max > min) {
// console.log("narrow end");
			// Math.ceil will ensure that mid will be greater than min
			var mid = Math.ceil((min + max) / 2);

			// test character at A[mid] for match
			var charRange = textNode.ownerDocument.createRange();
			charRange.setStart(textNode, mid-1);
			charRange.setEnd(textNode, mid);
			var rect = charRange.getBoundingClientRect();
			var char = textNode.nodeValue[mid];
			var match = rect.top <= viewportBottom;

			//nuan_log("m:" + mid + " c:" + char + " b:" + rect.top);

			// reduce the search
			if (match) {
				min = mid;  // search higher
			} else {
				max = mid - 1;  // search lower
			}
		}

		range.setEnd(textNode, max + 1); // +1 to set the end /after/ the character at max.
// console.log("detected exact visible end: ", max, textNode.textContent.substring(0, max));
		return true;
	}

	function sendText(editor, text, parseInput, parseOutput) {
		var doc = editor.ownerDocument;
		if (doc.queryCommandSupported("insertText")) {
			sendText_execCommand(editor, text, parseInput, parseOutput);
		} else {
			sendText_dom(editor, text, parseInput, parseOutput);
		}
	}

	function sendText_execCommand(editor, text, parseInput, parseOutput) {
		// this method of send text uses the built in rich text editing commands
		var doc = editor.ownerDocument;
		if (text == "") {
			doc.execCommand("delete", false);
		} else {
			text = text.replace(new RegExp(parseInput.lineFeed, "g"), "\n");
			doc.execCommand("insertText", false, text);
		}

		scrollToCaret(editor);

		// stimulate the editor with some noop events.
		nuanria.automation.keyboardEvent("keydown", editor, {shift:true});
		nuanria.automation.keyboardEvent("keypress", editor, {shift:true});
		nuanria.automation.keyboardEvent("keyup", editor, {shift:true});
		nuanria.automation.mouseEvent("mousedown", editor);
		nuanria.automation.mouseEvent("mouseup", editor);
	}

	function sendText_dom(editor, text, parseInput, parseOutput) {
		// this method of send text uses dom manipulation to update the editor contents

		// In IE, Make all changes as a single unit on the undo stack
		if (document.queryCommandSupported("ms-beginUndoUnit")) {
			document.execCommand("ms-beginUndoUnit");
		}

		var doc = editor.ownerDocument;
		var sel = doc.defaultView.getSelection();
		var range = sel.getRangeAt(0);
		range.deleteContents();
		text = text.replace(/\r/g, "");
		var lines = text.split("\n");
		var newNode;
		var trailingBreak = false;
		for (var i = 0; i < lines.length; i++) {
			if (lines[i]) {
				// add regular text
				newNode = doc.createTextNode(lines[i]);
				range.insertNode(newNode);
				range.setStartAfter(newNode);
				range.setEndAfter(newNode);
				trailingBreak = false;
			}
			if (i != lines.length - 1) {
				// add a line break
				newNode = doc.createElement("br");
				//newNode.innerHTML = "<br/>";
				range.insertNode(newNode);
				range.setStartAfter(newNode);
				range.setEndAfter(newNode);
				trailingBreak = true;
			}
		}

		// Most browsers trim trailing breaks, so we may
		// need to add an extra one.
		if (trailingBreak && !parseInput.ieBreaks && !newNode.nextSibling) {
			newNode = doc.createElement("br");
			range.insertNode(newNode);
			range.setStartAfter(newNode);
			range.setEndAfter(newNode);
		}

		sel.removeAllRanges();
		sel.addRange(range);

		// stimulate the editor with some noop events
		nuanria.automation.keyboardEvent("keydown", editor, {shift:true});
		nuanria.automation.keyboardEvent("keypress", editor, {shift:true});
		nuanria.automation.keyboardEvent("keyup", editor, {shift:true});
		nuanria.automation.mouseEvent("mousedown", editor);
		nuanria.automation.mouseEvent("mouseup", editor);

		scrollToCaret(editor);

		if (document.queryCommandSupported("ms-endUndoUnit")) {
			document.execCommand("ms-endUndoUnit");
		}

		// TTP22793: Dictating a lot of text into Outlook.com has a weird effect
		// where user might lose ability to focus text field. This fix might be
		// worth applying generally, but restricted to mail.live.com for now for
		// safety.
		if (editor.nodeName == "BODY" &&
			document.location.host.search("mail.live.com") > -1)
		{
			editor.style.height = "auto";
		}
	}

	function formatText(editor, formatCommand) {
		if (formatCommand != "bold" &&
			formatCommand != "italic" &&
			formatCommand != "underline")
		{
			// unsupported format command
			return;
		}

		var doc = editor.ownerDocument;
		if (doc.queryCommandSupported(formatCommand)) {
			doc.execCommand(formatCommand);
		}
	}

	function scrollToCaret(editorRoot) {
		var doc = editorRoot.ownerDocument;
		var sel = doc.getSelection();
		var range = sel.getRangeAt(0);

		// Try this first, it doesn't need to modify the DOM.
		// It doesn't work consistently in all browsers and situations though.
		var caretCoords = range.getBoundingClientRect();
		if (!caretCoords.left) {
			// Coordinates could not be determined.
			// Fall back to old method. utils.getCoords modifies the DOM in order to
			// determine coordinates. Because of this it may add an empty item to the
			// undo stack.
			caretCoords = nuanria.utils.getCoords(range.startContainer, range.startOffset);
		}

		var editorCoords = getEditorVisibleBounds(editorRoot);

		var adjustment = 3; // emperical adjustment
		var scrollDiff = 0;
		if (caretCoords.top < editorCoords.top) {
			scrollDiff = editorCoords.top - caretCoords.top + adjustment;
		} else if (caretCoords.bottom > editorCoords.bottom) {
			scrollDiff = editorCoords.bottom - caretCoords.bottom - adjustment;
		}

		var node = editorRoot;
		for (;;) {
			if (window.getComputedStyle(node).overflowY == "auto") {
				node.scrollTop -= scrollDiff;
				break;
			}

			node = node.parentNode;
			if (!node || node.nodeType == Node.DOCUMENT_NODE) {
				window.scrollBy(0, 0-scrollDiff);
				break;
			}
		}
	}

	function getEditorRootElement(editor) {
		editor = editor || nuanria.contenteditable.getActive();
		if (editor.nodeName == "IFRAME") {
			return editor.contentDocument.body;
		} else {
			return editor;
		}
	}


	/*
	 * A rich text editor is either an element that is
	 * marked as contenteditble, or a body element that
	 * is set to designMode "on".
	 */
	function isRichText(element) {
		if (!element) {
			return false;
		}

		// check if design mode
		if (element.nodeName == "BODY") {
			if (element.ownerDocument.designMode == "on") {
				return true;
			}
		}

		// check if content editable
		return element.getAttribute('contenteditable') !== null &&
			   element.getAttribute('contenteditable').toUpperCase() != "FALSE";
	}

	function onPaste() {
		if (!document.selection) {
			// document.selection is only available IE10 and below
			return;
		}

		// this is a workaround for a bug in IE9 and below
		// where contenteditable does not update the normal DOM
		// selection (document.getSelection().getRangeAt(0))
		// after a paste has occurred.
		var ed = getEditorRootElement();
		var textRange = document.selection.createRange();
		var textRangeDup = textRange.duplicate();
		textRangeDup.moveStart("Character", -1);
		textRangeDup.select(); // this seems to update the range properly
	}

	/*
	 * Get the visible bounds of the editor. Also account for
	 * parent frame visible bounds, if this is an iframe-based editor.
	 */
	function getEditorVisibleBounds(editorRoot) {
		var bounds = nuanria.utils.getVisibleBounds(editorRoot);

		// determine if we can process the parent frame
		var processParentFrame = false;
		var win = editorRoot.ownerDocument.defaultView;
		try {
			processParentFrame = win.frameElement && win.frameElement.nodeName;
		} catch (e) { }

		if (processParentFrame) {
			var parentFrameBounds = nuanria.utils.getBoundingClientRect(win.frameElement);
			var parentFrameVis = nuanria.utils.getVisibleBounds(win.frameElement);
			var scrollTop = parentFrameVis.top - parentFrameBounds.top;
			bounds.top += scrollTop;
			bounds.height = Math.min(parentFrameVis.height, bounds.height);
			bounds.bottom = bounds.top + bounds.height;
		}

		return bounds;
	}

	window.testGetEditorVisibleBounds = getEditorVisibleBounds;
}());
