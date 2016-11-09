////////////////////////////////////////////////////////////////////////////////
//
//  @file       nuanria.SpeechClient.js
//  @details    An instance of SpeechClient should exist for each frame that
//              requires speech support. It communicates via cross-domain
//              messaging with the SpeechHost. SpeechClients interact with the
//              DOM and respond to DOM events with the help of DomTracker.
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

nuanria.SpeechClient = function (messenger, domTracker) {

	///////////////////////////////////////////////////////////////////////////

	this.addHandler            = function(action, handler) { events.add(action, handler); };
	this.removeHandler         = function(action, handler) { events.remove(action, handler); };
	this.isConnected           = isConnected;
	this.connect               = connect;
	this.disconnect            = disconnect;
	this.setEditorContext      = setEditorContext;
	this.loadContext           = loadContext;
	this.changeContext         = changeContext;
	this.unloadContext         = unloadContext;
	this.update                = update;

	///////////////////////////////////////////////////////////////////////////

	var kTempEditorAttribute   = "nuan_editor";
	var locale                 = new nuanria.Locale();
	var events                 = new nuanria.Events();
	var clientId               = -1;

	//-------------------------------------------------------------------------
	// Editors

	var activeEditors          = {};
	var activeEditorElements   = {};
	var recentEditors          = {};
	var editorContext          = null;
	var editorElement          = null;

	// members related to interaction handlers
	var armedDocuments         = [];
	var scrollHandlers         = [];
	var lastClickInfo          = { time: 0, x: 0, y: 0, doc: null };
	var inhibitInteractionHandlers = false;

	//-------------------------------------------------------------------------
	// Clickables

	var showYellowBox          = false;
	var domParser              = null;
	var listBoxCommands        = {};

	// A "Clickable" is an element on the page that the user can "click"
	// by using a click command.
	var Clickable = function(element) {
		this.id               = nextClickableId++;
		this.element          = element;
		this.cmdStrings       = [];
		this.defaultCmdString = "";
		this.pageLeft         = 0;
		this.pageTop          = 0;
		this.fixedLeft        = 0;
		this.fixedTop         = 0;
		this.offsetPageLeft   = 0;
		this.offsetPageTop    = 0;
		this.offsetFixedLeft  = 0;
		this.offsetFixedTop   = 0;
	}

	// cmdQueryItems are selectors used when searching for clickables
	var cmdQueryItems          = [];

	// "link"
	cmdQueryItems.push("a");
	cmdQueryItems.push("*[onclick]");
	cmdQueryItems.push("[role=link]");
	cmdQueryItems.push("[role=tab]");
	cmdQueryItems.push("[role=menuitem]");
	cmdQueryItems.push("[role=menuitemradio]");
	cmdQueryItems.push("[role=menuitemcheckbox]");

	// "image"
	cmdQueryItems.push("a img");        // image link as per web_ie
	cmdQueryItems.push("img");          // clickable images as per web_ie
	cmdQueryItems.push("area");         // image map areas as per web_ie
	cmdQueryItems.push("input[type=image]");

	// "button"
	cmdQueryItems.push("button");
	cmdQueryItems.push("input[type=button]");
	cmdQueryItems.push("input[type=submit]");
	cmdQueryItems.push("[role=button]");

	// other
	cmdQueryItems.push("input[type=checkbox]");
	cmdQueryItems.push("[role=checkbox]");
	cmdQueryItems.push("input[type=radio]");
	cmdQueryItems.push("[role=radio]");
	cmdQueryItems.push("select");
	cmdQueryItems.push("[" + kTempEditorAttribute + "]"); // editors

	var nextClickableId        = 1000;
	var activeClickablesById   = {};

	//-------------------------------------------------------------------------

	function isConnected() {
		return clientId != -1;
	}

	function connect() {
		if (isConnected()) {
			nuanria.utils.logError("SpeechClient already connected: " + clientId);
			return;
		}

		clientId = 0; // connection in progress

		messenger.sendMessage(window.top, "speechHost_connect", null,
			function (response) {
				clientId = -1; // default to not connected
				locale.reset();

				if (response.result == nuanria.Messenger_SUCCESS) {

					var data = response.payload;
					if (data.clientId > -1) {
						clientId = data.clientId;
						locale.merge(data.langId, data.langStrings);
						if (nuanria.globals.t0) {
						    var t1 = performance.now();
						    //nuanria.utils.logPerform("Connect complete for", document.location.href, "=", performance.now(), "ms");
						    nuanria.utils.logPerform("Load Time for", document.location.href, "=", (t1 - nuanria.globals.t0).toFixed(4), "ms");
						    nuanria.utils.log("t1 =", t1.toFixed(4), "ms, t0 =", nuanria.globals.t0.toFixed(4), "ms");
						    nuanria.utils.log("SpeechClient connected:", name, clientId, document.location.href);
						}
						events.notify("connected");
					} else {
						nuanria.utils.logError("SpeechClient received invalid clientId from SpeechHost.");
					}
				} else {
					nuanria.utils.logError("speechHost_connect error", response);
				}
			});

		if (!domParser) {
			domParser = createDomParser();
		}
	}

	function disconnect() {
		// clean up dictation
		activeEditors = {};
		activeEditorElements = {};
		editorContext = null;
		editorElement = null;

		// clean up commands
		clearNumbers();

		// todo: should clear element.nuan_clickableId from all elements
		activeClickablesById = {};

		updateUserInteractionHandlers();

		locale.reset();

		// disconnect from speech host
		clientId = -1;
		messenger.sendMessage(window.top, "speechHost_disconnect", null);
	}

	function setEditorContext(context, contextElement) {
		if (context && !context.editor) {
			throw new Error("InvalidContext");
		}

		context        = context;
		contextElement = contextElement;
	}

	function loadContext(context, elements) {
		if (context.editor) {
			activeEditors[context.id] = context;
			activeEditorElements[context.id] = elements;
		}
	}

	function changeContext(context, elements) {
		if (context.editor) {
			activeEditors[context.id] = context;
			activeEditorElements[context.id] = elements;
		}
	}

	function unloadContext(context) {
		if (context.editor) {
			delete activeEditors[context.id];
			delete activeEditorElements[context.id];
		}
	}

	function update() {
		var ok = true;

		var oldEditorElement = editorElement;
		var oldEditorContext = editorContext;
		var oldEditorImpl = oldEditorContext ? oldEditorContext.editor() : null;

		editorContext = activeEditors[Object.keys(activeEditors)[0]];
		editorElement = editorContext ?
							activeEditorElements[editorContext.id][0] :
							null;
		var editorImpl = editorContext ? editorContext.editor() : null;

		var usesFrames = editorElement ? false : document.querySelectorAll("frame").length > 0;

		if (editorElement && editorElement != oldEditorElement) {
			// disable old editor handler
			if (oldEditorImpl && oldEditorImpl.disable) {
				oldEditorImpl.disable(oldEditorElement);
			}

			// enable new editor handler
			if (editorImpl && editorImpl.enable) {
				editorImpl.enable(editorElement);
			}

			// it's ok to call enableDictation without calling disableDictation first
			ok = enableDictation();
			nuanria.utils.log("enableDictation");
		} else if (usesFrames) { // This is the case where there are no editors but the website uses frames
		    forceNatTextDictation();
		    nuanria.utils.log("forceNatTextDictation");
        } else if (oldEditorElement && !editorElement) {
			// disable old editor handler
			if (oldEditorImpl && oldEditorImpl.disable) {
				oldEditorImpl.disable(oldEditorElement);
			}

			ok = disableDictation();
			nuanria.utils.log("disableDictation");
        }

		updateUserInteractionHandlers();

		return ok;
	}

	//-------------------------------------------------------------------------
	// Functions serviced by SpeechHost

	function enableDictation() {
		// check whether this editor module requests NatText
		var natText = !!editorContext &&
					  !!editorContext.editor() &&
					  !!editorContext.editor().getNatText &&
					  !!editorContext.editor().getNatText();

		messenger.sendMessage(window.top, "speechHost_enableDictation", {
			activeEditorId : getActiveEditorId(),
			natText        : natText
		});
	}

	function disableDictation() {
		messenger.sendMessage(window.top, "speechHost_disableDictation");
	}

	function forceNatTextDictation() {
	    messenger.sendMessage(window.top, "speechHost_enableDictation", {
	        activeEditorId: getActiveEditorId(),
	        natText: true
	    });
	}

	//-------------------------------------------------------------------------
	// Requests from SpeechHost
	messenger.addHandler('speechClient_sync',
		function (source, action, data, callback) {
			syncClickables(callback);
		});

	messenger.addHandler('speechClient_invokeEditor',
		function(source, action, data, callback) {
			invokeEditor(data.functionId, data.args, callback);
		});

	messenger.addHandler('speechClient_showDisambiguations',
		function(source, action, data) {
			showDisambiguations(data);
		});

	messenger.addHandler('speechClient_clearNumbers',
		function(source, action, data) {
			clearNumbers();
		});

	messenger.addHandler('speechClient_invokeClickable',
		function (source, action, data, callback) {
			invokeClickable(data.cmdId, data.isDisambiguation, data.handleClick, callback);
		});

	//-------------------------------------------------------------------------
	// Requests from Child SpeechClients

	messenger.addHandler('speechClient_applyFrameOffset',
		function (source, action, data, callback) {
			if (data && data['recursing']) {
				data.childWindow = source;
			}

			applyFrameOffset(data, callback);
		});


	//-------------------------------------------------------------------------
	// Dictation

	function invokeEditor(functionId, args, callback) {
		var result = {};
		inhibitInteractionHandlers = true;

		try {
			// check that an editor context is currently active
			if (!editorContext) {
				nuanria.utils.log("SpeechClient#invokeEditor: InvalidContext");
				invokeEditorDone(callback, result);
				return;
			}

			// check that the context corresponds to the context element
			var contextDocument = editorElement.ownerDocument;
			var currentContextElement = editorContext.editor().getActive();
			if (currentContextElement != editorElement) {
				nuanria.utils.log("SpeechClient#invokeEditor: ContextElementMismatch");
				invokeEditorDone(callback, result);
				return;
			}

			// editor impl
			var editorImpl = editorContext.editor ? editorContext.editor() : null;
			if (!editorImpl) {
				throw {func: "SpeechClient::invokeEditor", desc: "NoEditorImplementation", info: functionId};
			}

			// find the function name to call
			var fn = editorImpl[functionId];
			if (!fn) {
				throw {func: "SpeechClient::invokeEditor", desc: "NoSuchFunctionOnContext", info: functionId};
			}

			// invoke function
			result.retVal = fn.apply(window, args);
			result.error = null;

		} catch (err) {
			var error = {};
			Object.getOwnPropertyNames(err).forEach(function(prop){
				error[prop] = err[prop];
			});
			result.error = JSON.stringify(error);
			nuanria.utils.logError("SpeechClient::invoke error: ", result);
		}

		if (functionId == "getCharacterRectangle" && result.retVal) {
			applyFrameOffset(null, function(offset) {
				result.retVal.left += offset.fixedLeft;
				result.retVal.top += offset.fixedTop;
				result.retVal.right += offset.fixedLeft;
				result.retVal.bottom += offset.fixedTop;
//nuanria.utils.log("nuanria.speechclient.invokeEditor() " + JSON.stringify(result.retVal) + " - After correct for offset");
//nuanria.utils.log("nuanria.speechclient.invokeEditor() window.devicePixelRatio=" + window.devicePixelRatio + ", window.screen.deviceXDPI=" + window.screen.deviceXDPI + ", window.screen.logicalXDPI=" + window.screen.logicalXDPI);
				if (window.devicePixelRatio && window.devicePixelRatio != 1) {
					result.retVal.left = Math.floor(result.retVal.left * window.devicePixelRatio);
					result.retVal.top = Math.floor(result.retVal.top * window.devicePixelRatio);
					result.retVal.bottom = Math.floor(result.retVal.bottom * window.devicePixelRatio);
					result.retVal.right = Math.floor(result.retVal.right * window.devicePixelRatio);
//nuanria.utils.log("nuanria.speechclient.invokeEditor()" + JSON.stringify(result.retVal) + " after dpi scaling(" + window.devicePixelRatio + ")");
				}
				else if (window.devicePixelRatio == undefined) {	// This is for IE9/IE10 see TTP31690
					if (window.screen &&
						window.screen.deviceXDPI &&
						window.screen.logicalXDPI &&
						(window.screen.deviceXDPI != window.screen.logicalXDPI)) {
						var pixelRatio = window.screen.deviceXDPI / window.screen.logicalXDPI;
						result.retVal.left = Math.floor(result.retVal.left * pixelRatio);
						result.retVal.top = Math.floor(result.retVal.top * pixelRatio);
						result.retVal.bottom = Math.floor(result.retVal.bottom * pixelRatio);
						result.retVal.right = Math.floor(result.retVal.right * pixelRatio);
//nuanria.utils.log("nuanria.speechclient.invokeEditor()" + JSON.stringify(result.retVal) + " after dpi scaling(" + pixelRatio + ")");
					}
				}
				invokeEditorDone(callback, result);
			});
		} else {
			invokeEditorDone(callback, result);
		}
	}

	function invokeEditorDone(callback, arg) {
		setTimeout(function() {
			// queue this so any editor handling functions
			// have a chance to finish.
			inhibitInteractionHandlers = false;
		})

		callback(arg);
	}

	function getActiveEditorId() {
		if (!editorElement) {
			return "";

		} else {
			for (var id in recentEditors) {
				var ed = recentEditors[id];
				if (editorElement == ed) {
					return id;
				} else if (!ed) {
					continue;
				} else if (!ed.ownerDocument || !ed.ownerDocument.body || !ed.ownerDocument.body.contains(ed)) {
					recentEditors[id] = null;
				}
			}

			var newId = Object.keys(recentEditors).length;
			recentEditors[newId] = editorElement;
			return newId;
		}
	}


	//-------------------------------------------------------------------------
	// Clickables

	function syncClickables(callback) {
		//var startTime = new Date().getTime();

		// Temporarily hide disambiguation numbers - they can interfere
		// with determining whether or not a link is visible.
		hideNumbers(true);

		// this data will be used with applyFrameOffset to check visibility
		var visibleRectsById = {};

		// scan all elements on the page that might have a click handler
		var lastActiveClickablesById = activeClickablesById;
		activeClickablesById = {};

		// mark editors (these must be unmarked before this function exits)
		var markedEditors = [];
		for (var contextId in nuanria.contexts) {
			var context = nuanria.contexts[contextId];
			if (!context || !context.editor) {
				continue;
			}

			var editorApi = context.editor();
			if (editorApi && editorApi.getAll) {
				var editors = editorApi.getAll();
				for (var i = 0; i < editors.length; i++) {
					editors[i].setAttribute(kTempEditorAttribute, contextId);
					markedEditors.push(editors[i]);
				}
			}
		}

		// get regular clickable elements
		var elements = document.querySelectorAll(cmdQueryItems.join(","));

		for (var i = 0; i < elements.length; i++) {
			var element = elements[i];

			// check visibility
			if (!nuanria.utils.isVisible(element)) {
				continue;
			}

			var pageCoords  = getPageCoords(element);
			var fixedRect   = nuanria.utils.getBoundingClientRect(element);

			// get/create clickable object
			var clickable = lastActiveClickablesById[element.nuan_clickableId];
			if (!clickable) {
				// create new clickable object
				clickable = new Clickable(element);
			}

			// whether or not we can use the element depends on
			// the link type and whether or not there is a commandString
			var canUse = addCommandStrings(clickable);
			if (canUse) {
				clickable.pageLeft  = pageCoords.left;
				clickable.pageTop   = pageCoords.top;
				clickable.fixedLeft = fixedRect.left;
				clickable.fixedTop  = fixedRect.top;
				clickable.visible   = true;

				activeClickablesById[clickable.id] = clickable;
				element.nuan_clickableId = clickable.id;

				visibleRectsById[clickable.id] = {
					id      : clickable.id,
					visible : true,
					bounds  : fixedRect
				};
			}
		}

		// unmark editors
		for (var i = 0; i < markedEditors.length; i++) {
			markedEditors[i].removeAttribute(kTempEditorAttribute);
		}

		// commandData will be returned to speech host and
		// loaded into the command map for aggregation
		var commandData = [];

		// add listbox commands
		processListBoxCommands(commandData);

		// apply frame offsets and visibility info to the active commands
		applyFrameOffset({ rectsById: visibleRectsById }, function(data) {

			// update clickables with offsets
			if (data) {
				for (var id  in activeClickablesById) {
					var rect = data.rectsById[id];
					if (!rect || !rect.visible) {
						delete activeClickablesById[id];
						continue;
					}

					// update offset coords
					var clickable = activeClickablesById[id];
					clickable.offsetFixedLeft = data.fixedLeft + clickable.fixedLeft;
					clickable.offsetFixedTop  = data.fixedTop  + clickable.fixedTop;

					// add item to data that we will return to speechhost
					commandData.push({
						id             : id,
						commandStrings : clickable.cmdStrings,
						isFullText     : true,
						x              : data.pageLeft + clickable.pageLeft,
						y              : data.pageTop  + clickable.pageTop,
					});
				}
			}

			// un-hide disambiguation numbers (if present)
			hideNumbers(false);

			//var endTime = new Date().getTime();
			//nuanria.utils.log("Synced " + commandData.length + " clickables in " + (endTime-startTime) + "ms");
			callback(commandData);
		});
	}

	function processListBoxCommands(commandData) {
		if (!document.activeElement ||
			document.activeElement.nodeName != "SELECT") {
			return;
		}

		listBoxCommands = {};
		var selectOptions = document.activeElement.querySelectorAll("option");
		for (var i = 0; i < selectOptions.length; i++) {
			var optionEl = selectOptions[i];
			var optionText = getSafeCommandString(optionEl.textContent);
			var commandProto = locale.getString("choose %1");
			var commandString = nuanria.utils.formatString(commandProto, optionText);
			var commandId = nextClickableId++;

			listBoxCommands[commandId] = optionEl;
			commandData.push({
				id             : commandId, // use unique clickableId for id
				commandStrings : [commandString],
				isFullText     : false,
				x              : 0,
				y              : 0,
			});
		}
	}

	function invokeClickable(id, isDisambiguation, handleClick, callback) {
		if (listBoxCommands[id]) {
			selectOption(listBoxCommands[id]);
			return;
		}

		var clickable = activeClickablesById[id];
		if (!clickable) {
			nuanria.utils.logError("Could not find clickable: " + id);
		}

		var cmdString = clickable.defaultCmdString;
		if (showYellowBox && isDisambiguation && cmdString) {
			showCaptionPane(cmdString, function(){
				processClick(clickable, handleClick, callback);
			});
		} else {
			processClick(clickable, handleClick, callback);
		}
	}

	function processClick(clickable, handleClick, callback) {
		if (handleClick) {
			click(clickable.element);
			callback(null);
		} else {
			// if not handling click, we must call back with
			// element coords relative to top left corner of
			// top window
			var coords = {
				left : clickable.offsetFixedLeft,
				top  : clickable.offsetFixedTop
			};
			callback(coords);
		}
	}

	function selectOption(optionElement) {
		if (!optionElement.parentNode) {
			nuanria.logError("invalid option element (1)");
			return;
		}

		if (!optionElement.parentNode.nodeName == "SELECT") {
			nuanria.logError("invalid option element (2)");
			return;
		}

		var selectEl = optionElement.parentNode;
		selectEl.value = optionElement.value;
		nuanria.automation.changeEvent(selectEl, optionElement);

		var doc = optionElement.ownerDocument;
		if ("createEvent" in doc) {
			var ev = doc.createEvent("HTMLEvents");
			ev.initEvent("change", false, true);
			selectEl.dispatchEvent(ev);
		}

		// stimulate the select element with some noop events
		nuanria.automation.keyboardEvent("keydown", selectEl, {shift:true});
		nuanria.automation.keyboardEvent("keyup", selectEl, {shift:true});
	}

	function showDisambiguations(items) {
		// items = [ { id: <num>, num: <num> } ]

		// put all numbers in a container to avoid unnecessary re-flows
		var numbersContainer = document.createElement("div");
		numbersContainer.className = "nuan_disambig_markers";
		numbersContainer.style.setProperty("position", "absolute", "important");

		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			var clickable = activeClickablesById[item.id];
			if (!clickable) {
				continue;
			}
			var numberEl = createNumber(clickable.element, item.num);
			numbersContainer.appendChild(numberEl);
		}

		document.body.insertBefore(numbersContainer, document.body.firstChild);

		updateUserInteractionHandlers();
	}

	function clearNumbers() {
		var numbersContainer = document.querySelector(".nuan_disambig_markers");
		if (numbersContainer) {
			numbersContainer.parentNode.removeChild(numbersContainer);
		}

		updateUserInteractionHandlers();
	}

	function hideNumbers(hide) {
		var numbers = document.querySelectorAll(".nuan_disambig_marker");
		for (var i = 0; i < numbers.length; i++) {
			var displayValue = hide ? "none" : "inline";
			numbers[i].style.setProperty("display", displayValue, "important");
		}
	}

	function createNumber(element, id) {
		var marker = createMarker(id, element.ownerDocument);

		// Got coords for marker.
		// Note, looking for a width > 1 will help identify
		// the correct part of a wrapping inline element
		// for us to use.
		var rects = nuanria.utils.getClientRects(element);
		var rect = rects[0];
		for (var i = 0; i < rects.length; i++) {
			if (rects[i].width > 1) {
				rect = rects[i];
				break;
			}
		}

		if (rect) {
			var bounds = {
				left: rect.left, top: rect.top,
				right: rect.right, bottom: rect.bottom,
				width: rect.width, height: rect.height
			}
			nuanria.utils.adjustBoundsForElementPosition(bounds, element);
			marker.style.setProperty("left", bounds.left + "px", "important");
			marker.style.setProperty("top", bounds.top + "px", "important");
		}

		return marker;
	}

	function createMarker(text, document) {
		// container for the inner elements
		var outer = document.createElement("div");
		outer.className = "nuan_disambig_marker";
		outer.style.setProperty("color", "transparent", "important");
		outer.style.setProperty("display", "inline", "important");
		outer.style.setProperty("font-size", "12px", "important");
		outer.style.setProperty("height", "0", "important");
		outer.style.setProperty("line-height", "16px", "important");
		outer.style.setProperty("margin", "1px", "important");
		outer.style.setProperty("overflow", "visible", "important");
		outer.style.setProperty("padding", "2px 0 0 2px", "important");
		outer.style.setProperty("position", "fixed", "important");
		outer.style.setProperty("text-indent", "0", "important");
		outer.style.setProperty("width", "0", "important");
		outer.style.setProperty("z-index", "2147483647", "important");

		// background color and border
		var background = document.createElement("span");
		background.style.setProperty("background", "green", "important");
		background.style.setProperty("border", "1px solid black", "important");
		background.style.setProperty("opacity", ".7", "important");
		background.style.setProperty("position", "absolute", "important");
		background.style.setProperty("margin", "-2px 0 0 -2px", "important");
		background.style.setProperty("padding", "0 3px 2px 0", "important");
		background.style.setProperty("box-shadow", "0 0 1px white", "important");
		background.style.setProperty("border-radius", "2px", "important");
		background.innerHTML = text;
		outer.appendChild(background);

		// shadow
		var shadow = document.createElement("span");
		shadow.style.setProperty("color", "black", "important");
		shadow.style.setProperty("text-shadow", "0 0 2px black", "important");
		shadow.style.setProperty("position", "absolute", "important");
		shadow.innerHTML = text;
		outer.appendChild(shadow);

		// number
		var number = document.createElement("span");
		number.style.setProperty("color", "yellow", "important");
		number.style.setProperty("position", "absolute", "important");
		number.innerHTML = text;
		outer.appendChild(number);

		return outer;
	}

	function showCaptionPane(text, callback) {
		var captionParts = text.split(' ');
		var length = captionParts.length;
		var caption = captionParts.splice(0,6).join(' ');
		if (length > 6) {
			caption += "...";
		}
		caption = '"' + caption + '"';

		var pane = document.createElement("div");
		pane.style.setProperty("position", "fixed", "important");
		pane.style.setProperty("top", "100px", "important");
		pane.style.setProperty("background", "#F0EC75", "important");
		pane.style.setProperty("border", "1px solid grey", "important");
		pane.style.setProperty("left", "40%", "important");
		pane.style.setProperty("z-index", "1000000", "important");
		pane.style.setProperty("background-color", "#FFFF66", "important");
		pane.style.setProperty("box-shadow", "0px 0px 10px #000000", "important");
		pane.style.setProperty("font-style", "italic", "important");
		pane.style.setProperty("font-size", "16px", "important");
		pane.style.setProperty("font-weight", "bold", "important");
		pane.style.setProperty("padding", "8px 16px", "important");
		pane.style.setProperty("color", "black", "important");
		pane.style.setProperty("width", "20%", "important");
		pane.style.setProperty("text-align", "center", "important");
		pane.innerHTML = caption;
		document.body.insertBefore(pane, document.body.firstChild);
		setTimeout(function() {
				pane.parentNode.removeChild(pane);
				if (callback) {
					callback();
				}
			}, 1000);
	}

	function click(element) {
	    //console.log("click called, element = " + JSON.stringify(element));
		var focusableInput = element.nodeName == "INPUT" &&
				(element.getAttribute("type") != "checkbox" &&
				element.getAttribute("type") != "radio");
		var focusableOther = element.nodeName != "INPUT" &&
							 element.nodeName != "IMG";
		var elementSelectable = !(element.getAttribute('unselectable') != null &&
                                element.getAttribute('unselectable') === 'on');
		// we want to focus <a> tags before we click on them because
		// it helps properly defocus editor frames in Firefox.
		// This issue was seen in Outlook.com and Yahoo! Mail

	    // Question, in what scenarios would we want to NOT focus an element before clicking it?
        // In the scenario where the result of the click event does NOT change the current web page

		if ((focusableInput || focusableOther) && elementSelectable)
		{
			element.focus();
		}

		if (element.nodeName == "BODY") {
			// attempt to focus parent frame
			try {
				if (window.frameElement) {
					window.frameElement.focus();
				}
			} catch (e) { }

			// calling getCharacter rectangle can help get the cursor to show up
			setTimeout(function() {
				invokeEditor("getCharacterRectangle", [0], function() {});
			}, 100);
		}

		if (element.nodeName != "SELECT") {
			nuanria.automation.mouseEvent("mouseover", element);
			nuanria.automation.mouseEvent("mousemove", element);
			nuanria.automation.mouseEvent("mousedown", element);
			nuanria.automation.mouseEvent("mouseup", element);
			//nuanria.automation.mouseEvent("click", element);
			element.click();
        }

		if (element.nodeName == "SELECT" && !nuanria.utils.isIE()) {
			configureFocusRing(element);
		}
	}

	function configureFocusRing(element) {
		// add in a stylesheet for focused element so we can be sure
		// to see a focus indicator

		if (isFocusRingActive()) {
			return;
		}

		var style = window.getComputedStyle(element);
		var sheet = document.createElement("style");
		sheet.className = "nuan_selectStyle";
		sheet.type = "text/css";

		// This trick hides the standard focus ring in Firefox:
		// The focus ring color is determined by the font color
		// setting the font color to transparent will also set the
		// focus ring color to transparent. Using text-shadow will
		// then show the text again.
		var firefoxHideFocusRingCss = nuanria.utils.isFirefox() ?
			"color: transparent; text-shadow: 0 0 0 " + style.color + "; " :
			"";

		sheet.innerHTML =
			"select:focus { " +
				"outline: 1px dotted " + style.color + ";" +
				firefoxHideFocusRingCss +
			"}";

		document.head.appendChild(sheet);
	}

	function hideFocusRing() {
		var sheet = document.head.querySelector(".nuan_selectStyle");
		if (sheet) {
			document.head.removeChild(sheet);
		}
	}

	function isFocusRingActive() {
		return !!document.head.querySelector(".nuan_selectStyle");
	}


	//-------------------------------------------------------------------------
	// UserInteraction handlers (detect when the user clicks or scrolls in the frame)

	function updateUserInteractionHandlers() {
		// first release any existing handlers
		disarmUserInteractionHandlers();

		// we must determine which documents we need to arm
		var documents = [];

		// are we disambiguating click <xyz> options?
		var disambiguatingClickables = !!document.querySelector('.nuan_disambig_marker');

		if (disambiguatingClickables || isFocusRingActive()) {
			// add the main document
			documents.push(document);
		}

		if (editorElement) {
			// Add the document if it isn't already in the list.
			if (documents.length == 0) {
				documents.push(document);
			}

			if (editorElement.nodeName == "IFRAME" &&
				editorElement.contentDocument)
			{
				// editor is in an iframe, we need to know interactions
				// inside this iframe
				documents.push(editorElement.contentDocument);
			}
		}

		// now arm the documents with event handlers:
		if (documents.length) {
			armUserInteractionHandlers(documents);
		}
	}

	function armUserInteractionHandlers(documents) {
		for (var i = 0; i < documents.length; i++) {
			var doc = documents[i];

			doc.addEventListener("click", onUserInteraction);
			doc.addEventListener("mousedown", onUserInteraction);
			doc.addEventListener("mouseup", onUserInteraction);
			doc.addEventListener("keypress", onUserInteraction);
			doc.addEventListener("scroll", onUserInteraction);

			var divs = doc.getElementsByTagName("div");
			for (var j = 0; j < divs.length; j++) {
				var div = divs[j];

				// Check if a div has content that overflows by more than 4px.
				// If it does, we'll monitor it for scroll events.
				// (We used to inspect the div with window.getComputedStyle()
				//  but it turned out to be much too slow.)
				if (div.scrollHeight > div.clientHeight + 4) {
					div.addEventListener("scroll", onUserInteraction);
					scrollHandlers.push(div);
				}
			}

			armedDocuments.push(doc);
		}
	}

	function disarmUserInteractionHandlers() {
		try {
			for (var i = 0; i < armedDocuments.length; i++) {
				var doc = armedDocuments[i];
				doc.removeEventListener("click", onUserInteraction);
				doc.removeEventListener("mousedown", onUserInteraction);
				doc.removeEventListener("mouseup", onUserInteraction);
				doc.removeEventListener("keypress", onUserInteraction);
				doc.removeEventListener("scroll", onUserInteraction);
			}

			for (var i = 0; i < scrollHandlers.length; i++) {
				scrollHandlers[i].removeEventListener("scroll", onUserInteraction);
			}
		} catch (e) { }

		armedDocuments = [];
		scrollHandlers = [];
	}

	function onUserInteraction(ev) {
		if (inhibitInteractionHandlers) {
			return;
		}

		var data = {
			type     : ev.type,
			inEditor : false
		};

		hideFocusRing();

		if (data.type == "click" && editorElement) {
			var time = new Date().getTime();
			if (time - lastClickInfo.time < 500 &&
				ev.screenX == lastClickInfo.x &&
				ev.screenY == lastClickInfo.y)
			{
				if (lastClickInfo.doc == ev.target.ownerDocument) {
					data.type = "dblclick";
					data.inEditor = true;
				} else {
					return;
				}
			}
			lastClickInfo.time = time;
			lastClickInfo.x = ev.screenX;
			lastClickInfo.y = ev.screenY;
			lastClickInfo.doc = ev.target.ownerDocument;
		}

		//nuanria.utils.logInfo(JSON.stringify(data), ev.target.ownerDocument == document);

		// Do the following only once per every 300ms:
		// messenger.sendMessage(window.top, "speechHost_userInteractionOccurred", data);
		var burstLimit = 300; //ms
		var params = [window.top, "speechHost_userInteractionOccurred", data];
		nuanria.utils.scheduleOne(window, messenger.sendMessage, burstLimit, params);

		updateUserInteractionHandlers();
	}

	//-------------------------------------------------------------------------
	// Misc

	function applyFrameOffset(params, callback) {
		// default parameters:
		params = params || {};
		params.sourceClientId = params.sourceClientId || clientId;
		params.offset = params.offset || { pageTop: 0, pageLeft: 0, fixedTop: 0, fixedLeft: 0 };
		params.rectsById = params.rectsById || {};

		if (params.childWindow) {
			// find the frame element that corresponds to the specified childWindow
			var iframes = window.document.getElementsByTagName("iframe");
			for (var ixFrame = 0; ixFrame < iframes.length; ixFrame++) {
				var iframe = iframes[ixFrame];
				var win = iframe.ownerDocument.defaultView;
				if (iframe.contentWindow == params.childWindow) {
					var style = win.getComputedStyle(iframe);
					if (!style) {
						// FF can return null in some situations, meaning that
						// the style cannot be computed. Usually because the
						// element's frame is not visible.
						continue;
					}

					// add the offsets of the child frame
					var pageRect = getPageCoords(iframe);
					var pageLeft = pageRect.left + parseInt(style.borderLeftWidth, 10);
					var pageTop = pageRect.top + parseInt(style.borderTopWidth, 10);
					var fixedRect = iframe.getBoundingClientRect();
					params.offset.pageLeft += pageLeft;
					params.offset.pageTop += pageTop;
					params.offset.fixedLeft += fixedRect.left;
					params.offset.fixedTop += fixedRect.top;

					// detect if the rects are visible in this frame
					for (var ixRect in params.rectsById) {
						var rect = params.rectsById[ixRect];
						if (rect.visible) {
							var bounds = {
								left   : rect.bounds.left + fixedRect.left,
								top    : rect.bounds.top + fixedRect.top,
								right  : rect.bounds.right + fixedRect.left,
								bottom : rect.bounds.bottom + fixedRect.top,
								width  : rect.bounds.width,
								height : rect.bounds.height
							};
							rect.visible = nuanria.utils.isElementAtBounds(bounds, iframe);
						}
					}

					break;
				}
			}
		}

		if (window.top != window) {
			// recursively get this frame's offset to its parent
			delete params['childWindow'];
			params.recursing = true;
			messenger.sendMessage(window.parent, "speechClient_applyFrameOffset", params,
				function(response) {
					if (response.result != nuanria.Messenger_SUCCESS) {
						nuanria.utils.log("applyFrameOffset did not succeed", window.parent == window.top, response, clientId);
					}
					callback(response.payload);
				});
		} else {
			var retData = {}

			// At topmost frame, round the final values
			retData.pageLeft = Math.round(params.offset.pageLeft);
			retData.pageTop = Math.round(params.offset.pageTop);
			retData.fixedLeft = Math.round(params.offset.fixedLeft);
			retData.fixedTop = Math.round(params.offset.fixedTop);
			retData.rectsById = params.rectsById;

			callback(retData);
		}
	}

	// TODO: Remove this function...
	// Currently this is only used for getting coordinates that are used
	// for determining the order of disambiguation numbers. We can use fixed
	// Coords for this.
	function getPageCoords(element) {
		var bounds = nuanria.utils.getBoundingClientRect(element);
		var coords = { left: bounds.left, top: bounds.top };
		var iterator = element;
		while (iterator) {
			if (iterator.nodeType == Node.ELEMENT_NODE &&
				iterator.nodeName != "BODY") {  // body.scrollLeft and body.scrollTop aren't valid in strict mode
				coords.left -= iterator.scrollLeft;
				coords.top -= iterator.scrollTop;
			}
			iterator = iterator.parentNode;
		}

		coords.left = Math.round(coords.left + 1);
		coords.top = Math.round(coords.top + 1);

		coords.width = 0; coords.height = 0; // needed for adjustBoundsForElementPosition()
		nuanria.utils.adjustBoundsForElementPosition(coords, element);
		return coords;
	}

	function getFixedCoords(element) {
		var coords = nuanria.utils.getBoundingClientRect(element);
		return {
			left: Math.round(coords.left + 1),
			top: Math.round(coords.top + 1)
		};
	}

	//-------------------------------------------------------------------------
	// Command Strings

	function addCommandStrings(clickable) {
		// Todo: These calculations should be based on the WAI_ARIA
		// accessible name calculation specfication:
		// http://rawgithub.com/w3c/html-api-map/master/index.html#button-element

		clickable.cmdStrings = [];

		var element = clickable.element;
		var nodeName = element.nodeName.toLowerCase();
		var role = element.getAttribute("role");
		var inputType = nodeName == "input" ? element.getAttribute("type") : "";
		role = role ? role.toLowerCase() : "";

		if (nodeName == "img" || nodeName == "area")
		{
			// image
			return add_image_commandStrings(clickable);
		}
		else if (nodeName == "a" || role == "link" ||
			     role == "tab" || role == "menuitem" ||
				 role == "menuitemradio" || role == "menuitemcheckbox")
		{
			// link
			return add_link_commandStrings(clickable);
		}
		else if (nodeName == "button" || role == "button" ||
			     inputType == "button" || inputType == "submit" || inputType == "image")
		{
			// button
			return add_button_commandStrings(clickable);
		}
		else if (element.getAttribute(kTempEditorAttribute))
		{
			// editor
			return add_editor_commandStrings(clickable);
		}
		else if (inputType == "checkbox" || role == "checkbox")
		{
			// checkbox
			return add_checkbox_commandStrings(clickable);
		}
		else if (inputType == "radio" || role == "radio")
		{
			// radio button
			return add_radioButton_commandStrings(clickable);
		}
		else if (nodeName == "select")
		{
			// listbox
			return add_select_commandStrings(clickable);
		}
		else if (element.hasAttribute("onclick")) // this check last
		{
			// link
			return add_link_commandStrings(clickable);
		}

		return add_default_commandStrings(clickable);
	}

	function add_link_commandStrings(clickable) {
		var element = clickable.element;

		clickable.cmdStrings.push(locale.getString("text link"));

		if (element.getAttribute("role") == "button") {
			clickable.cmdStrings.push(locale.getString("button"));
		}

		// get primary link text
		// try element subtree first
		var linkText = addSafeCmdString(getSubtreeText(element), clickable);
		if (!linkText) {
			// otherwise use title
			linkText = addSafeCmdString(element.getAttribute("title"), clickable);
		}
		if (!linkText) {
			// otherwise use ALT text
			// (hyperlinks aren't supposed to have alt attributes
			// but this is what web_ie does)
			linkText = addSafeCmdString(element.getAttribute("alt"), clickable);
		}

		addSafeCmdString(element.getAttribute("aria-label"), clickable);

		addLabelStrings(clickable);

		// check parent element for title (kludgy)
		var parent = clickable.element.parentNode;
		addSafeCmdString(parent.getAttribute("title"), clickable);

		// set default command string
		if (clickable.cmdStrings.length > 1) {
			clickable.defaultCmdString = clickable.cmdStrings[1];
			return true;
		} else {
			clickable.defaultCmdString = "";
			//return false; // we're not interested in links with no caption (web_ie)
			return true;
		}
	}

	function add_button_commandStrings(clickable) {
		var element = clickable.element;

		clickable.cmdStrings.push(locale.getString("button"));

		addSafeCmdString(getSubtreeText(element), clickable);

		addSafeCmdString(element.getAttribute("aria-label"), clickable);

		// use value attribute
		addSafeCmdString(element.value, clickable);

		// buttons aren't supposed to have alt attributes
		// but this is what web_ie does
		addSafeCmdString(element.getAttribute("alt"), clickable);

		// use title attribute
		addSafeCmdString(element.getAttribute("title"), clickable);

		// set default command string
		if (clickable.cmdStrings.length > 1) {
			clickable.defaultCmdString = clickable.cmdStrings[1];
		} else {
			clickable.defaultCmdString = clickable.cmdStrings[0];
		}

		return true;
	}

	function add_image_commandStrings(clickable) {
		var element = clickable.element;
		var isImageClickable = false;

		// determine if image is clickable
		if (element.nodeName == "AREA") {
			isImageClickable = true;
		} else {
			var node = element;
			while (node && node != element.ownerDocument.body) {
				if (node.nodeName == "BUTTON") {
					break;
				}

				if (node.onclick ||
					node.nodeName == "A") {
					isImageClickable = true;
					break;
				}

				node = node.parentNode;
			}
		}

		if (!isImageClickable) {
			return false;  // not clickable
		}

		clickable.cmdStrings.push(locale.getString("image"));

		addSafeCmdString(element.getAttribute("alt"), clickable);

		addSafeCmdString(element.getAttribute("title"), clickable);

		// set default command string
		if (clickable.cmdStrings.length > 1) {
			clickable.defaultCmdString = clickable.cmdStrings[1];
		} else {
			clickable.defaultCmdString = clickable.cmdStrings[0];
		}

		return true;
	}

	function add_checkbox_commandStrings(clickable) {
		var element = clickable.element;

		clickable.cmdStrings.push(locale.getString("check box"));

		// text inputs aren't supposed to have alt attributes
		// but this is what web_ie does
		addSafeCmdString(element.getAttribute("alt"), clickable);

		addSafeCmdString(element.getAttribute("title"), clickable);

		addSafeCmdString(element.getAttribute("aria-label"), clickable);

		addLabelStrings(clickable);

		addSafeCmdString(getSubtreeText(element), clickable);

		// set default command string
		if (clickable.cmdStrings.length > 1) {
			clickable.defaultCmdString = clickable.cmdStrings[1];
		} else {
			clickable.defaultCmdString = clickable.cmdStrings[0];
		}

		return true;
	}

	function add_radioButton_commandStrings(clickable) {
		var element = clickable.element;

		addSafeCmdString(locale.getString("radio button"), clickable);

		// text inputs aren't supposed to have alt attributes
		// but this is what web_ie does
		addSafeCmdString(element.getAttribute("alt"), clickable);

		addSafeCmdString(element.getAttribute("title"), clickable);

		addSafeCmdString(element.getAttribute("aria-label"), clickable);

		addLabelStrings(clickable);

		addSafeCmdString(getSubtreeText(element), clickable);

		// set default command string
		if (clickable.cmdStrings.length > 1) {
			clickable.defaultCmdString = clickable.cmdStrings[1];
		} else {
			clickable.defaultCmdString = clickable.cmdStrings[0];
		}

		return true;
	}

	function add_select_commandStrings(clickable) {
		var element = clickable.element;

		if (element.hasAttribute("disabled")) {
			return false;
		}

		addSafeCmdString(locale.getString("list box"), clickable);

		// select elements aren't supposed to have alt attributes
		// but this is what web_ie does
		addSafeCmdString(element.getAttribute("alt"), clickable);

		addSafeCmdString(element.getAttribute("title"), clickable);

		addLabelStrings(clickable);

		// set default command string
		if (clickable.cmdStrings.length > 1) {
			clickable.defaultCmdString = clickable.cmdStrings[1];
		} else {
			clickable.defaultCmdString = clickable.cmdStrings[0];
		}

		return true;
	}

	function add_editor_commandStrings(clickable) {
		var element = clickable.element;

		addSafeCmdString(locale.getString("edit box"), clickable);
		addSafeCmdString(locale.getString("text field"), clickable);
		addSafeCmdString(locale.getString("type text"), clickable);

		// element.name is not designed to be human readable
		// but this is what web_ie does
		addSafeCmdString(element.name, clickable);

		// text inputs aren't supposed to have alt attributes
		// but this is what web_ie does
		addSafeCmdString(element.getAttribute("alt"), clickable);

		addSafeCmdString(element.getAttribute("title"), clickable);

		addLabelStrings(clickable);

		clickable.defaultCmdString = clickable.cmdStrings[clickable.cmdStrings.length-1];

		return true;
	}

	function add_default_commandStrings(clickable) {
		var element = clickable.element;

		addSafeCmdString(getSubtreeText(element), clickable);

		addSafeCmdString(element.getAttribute("title"), clickable);

		clickable.defaultCmdString = clickable.cmdStrings[0];
		return true;
	}

	function addLabelStrings(clickable) {
		var element = clickable.element;
		var doc = element.ownerDocument;
		var label;

		// get label element
		var id = element.id;
		if (id) {
			label = doc.querySelector("label[for=\"" + id + "\"]");
			if (label) {
				addSafeCmdString(getSubtreeText(label), clickable);
			}
		}

		// get aria label element
		var labelledById = element.getAttribute("aria-labelledby");
		if (labelledById) {
			label = doc.getElementById(labelledById);
			if (label) {
				addSafeCmdString(getSubtreeText(label, true), clickable);
			}
		}
	}

	function addSafeCmdString(rawCmdString, clickable) {
		var safeCmdString = getSafeCommandString(rawCmdString);
		if (!safeCmdString) {
			return "";
		}

		clickable.cmdStrings.push(safeCmdString);
		return safeCmdString;
	}

	function getSafeCommandString(text) {
		if (!text) text = "";
		text = text.replace(/ & /g, " and ");
		text = text.replace(/\u00A0/g, " "); // nbsp;
		text = text.replace(/[\-\|_\[\]]/g, " ");   // - | _ [ ]
		text = text.replace(/[^\u0030-\u003A\u0041-\u005A\u0061-\u007A\u00C0-\u00D6\u00D8-\u00F6\u00F9-\u00FF \.@]|/g, ""); // Not: 0-9, A-Z, a-Z, À-Ö, Ø-ö, ù-ÿ, <space>, <period>, <atsign>
		text = text.replace(/ +/g, " "); // concat multiple spaces
		text = text.trim();

		// make sure we return a standard JS string object in case
		// a website has overridden trim() or replace() to return a
		// non-standard String object (ebay)
		text = text.toString();

		return text;
	}

	function getSubtreeText(element, includeHiddenText) {
		var context = new nuanria.DomParser.Context(element, {}, new ParseOutput());
		context.includeHiddenText = !!includeHiddenText;
		context.isLastCharBlockSpace = false;
		var output = parser.parse(context);
		return output.text.trim();
	}

	//-------------------------------------------------------------------------
	// DOM Parser used for determining subtree text of a clickable element

	var ParseOutput = function() {
		this.text = "";
	};

	function createDomParser() {
		var rules = new nuanria.DomParser.ParseRules();

		rules.addValidTypes(["P", "DIV", "UL", "LI", "OL", "BLOCKQUOTE",
					 "#text", "SPAN", "I", "B", "U", "A", "S", "FONT", "EM", "STRONG", "SMALL",
					 "TABLE", "TH", "TBODY", "TR", "TD",
					 "H1", "H2", "H3", "H4", "H5", "H6",
					 "ROOT", "CHAR"]);

		// Only process visible elements:
		rules.add("element", true, "*", function() {
			var nodeType = this.getNodeType();
			if (!this.node.nodeType || this.node.nodeType != Node.ELEMENT_NODE) {
				return;
			}

			var nodeStyle = window.getComputedStyle(this.node);
			if (!nodeStyle) {
				return;
			}

			if (!this.includeHiddenText) {
				if (nodeStyle.visibility == "hidden" || nodeStyle.display == "none") {
					// this node isn't visible
					return nuanria.DomParser_SKIP_CHILDREN;
				}
			}

			if (this.ancestors.length &&
				(nodeType == "BUTTON" || nodeType == "A")) {
				// don't process embedded command text
				return nuanria.DomParser_SKIP_CHILDREN;
			}
		});

		// Add a space before block elements (when necessary):
		rules.add("element", true, "*", function() {
			if (this.isLastCharBlockSpace ||
				this.node.nodeType != Node.ELEMENT_NODE) {
				return;
			}

			var nodeStyle = window.getComputedStyle(this.node);
			if (nodeStyle.display == "block") {
				this.output.text += " ";
				this.isLastCharBlockSpace = true;
			}
		});

		// Add a space after block elements (when necessary):
		rules.add("element", false, "*", function() {
			if (this.isLastCharBlockSpace ||
				this.node.nodeType != Node.ELEMENT_NODE) {
				return;
			}

			var nodeStyle = window.getComputedStyle(this.node);
			if (nodeStyle.display == "block") {
				this.output.text += " ";
				this.isLastCharBlockSpace = true;
			}
		});

		// Add a character to the output text string:
		rules.add("character", true, "CHAR", function() {
			if (this.node.match(/\s/)) {
				this.node = " ";
			}
			this.output.text += this.node;
			this.isLastCharBlockSpace = false;
		});

		parser = new nuanria.DomParser(rules);
	};
};
