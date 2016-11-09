////////////////////////////////////////////////////////////////////////////////
//
//	@file		nuanria.Automation.js
//	@details	RIA automation helpers
//
//	@author		Chris Hardy
//	@date		4-Sep-2013
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
nuanria.automation = nuanria.automation || {};

(function() {
	"use strict";

	nuanria.automation.mouseEvent = function(type, el, options) {
		if (!options) { options = {}; }

		var bounds = el.getBoundingClientRect();

		var evObj = document.createEvent('MouseEvents');
		evObj.initMouseEvent(
			type,
			options['canBubble']        !== undefined ? options['canBubble']        : true,
			options['cancelable']       !== undefined ? options['cancelable']       : true,
			el.ownerDocument.defaultView,
			options['detail']           !== undefined ? options['detail']           : 1,
			options['screenX']          !== undefined ? options['screenX']          : 0,
			options['screenY']          !== undefined ? options['screenY']          : 0,
			options['clientX']          !== undefined ? options['clientX']          : bounds.left,
			options['clientY']          !== undefined ? options['clientY']          : bounds.top,
			options['ctrlKey']          !== undefined ? options['ctrlKey']          : false,
			options['altKey']           !== undefined ? options['altKey']           : false,
			options['shiftKey']         !== undefined ? options['shiftKey']         : false,
			options['metaKey']          !== undefined ? options['metaKey']          : false,
			options['button']           !== undefined ? options['button']           : 0,
			options['relatedTarget']    !== undefined ? options['relatedTarget']    : null
		);

		if (navigator.userAgent.indexOf("Safari") == -1) { // Not Safari
			var layerPropName = 'layer'; // TODO: fix this
			//var layerPropName = myjQuery.browser.msie ? 'offset' : 'layer';

			// add layerX/offsetX
			Object.defineProperty(evObj, layerPropName + "X", {
				get : function() {
					var retVal = options['layerX'];
					if (retVal === undefined) retVal = options['offsetX'];
					return retVal;
				}
			});

			// add layerY/offsetY
			Object.defineProperty(evObj, layerPropName + "Y", {
				get : function() {
					var retVal = options['layerY'];
					if (retVal === undefined) retVal = options['offsetY'];
					return retVal;
				}
			});
		}

		el.dispatchEvent(evObj);
	};

	nuanria.automation.keyboardEvent = function(type, el, options) {
		var ev = nuanria.automation.crossBrowser_initKeyboardEvent.call(
					el.ownerDocument.defaultView,
					type,
					options);

		el.dispatchEvent(ev);
	};

	nuanria.automation.changeEvent = function(el, option) {
		var evObj = document.createEvent('HTMLEvents');
		evObj.initEvent("change", true, false);

		if (navigator.userAgent.indexOf("Safari") == -1) { // Not Safari
			Object.defineProperty(evObj, "target", {
				get : function() {
					return option;
				}
			});

			Object.defineProperty(evObj, "srcElement", {
				get : function() {
					return option;
				}
			});
		}
		//console.log(evObj);

		el.dispatchEvent(evObj);
	};

	// https://gist.github.com/termi/4654819/
	void function() {//closure

	var global = this
	  , _initKeyboardEvent_type = (function( e ) {
			try {
				e.initKeyboardEvent(
					"keyup" // in DOMString typeArg
					, false // in boolean canBubbleArg
					, false // in boolean cancelableArg
					, global // in views::AbstractView viewArg
					, "+" // [test]in DOMString keyIdentifierArg | webkit event.keyIdentifier | IE9 event.key
					, 3 // [test]in unsigned long keyLocationArg | webkit event.keyIdentifier | IE9 event.location
					, true // [test]in boolean ctrlKeyArg | webkit event.shiftKey | old webkit event.ctrlKey | IE9 event.modifiersList
					, false // [test]shift | alt
					, true // [test]shift | alt
					, false // meta
					, false // altGraphKey
				);



				/*
				// Safari and IE9 throw Error here due keyCode, charCode and which is readonly
				// Uncomment this code block if you need legacy properties
				delete e.keyCode;
				_Object_defineProperty(e, {writable: true, configurable: true, value: 9})
				delete e.charCode;
				_Object_defineProperty(e, {writable: true, configurable: true, value: 9})
				delete e.which;
				_Object_defineProperty(e, {writable: true, configurable: true, value: 9})
				*/

				return ((e["keyIdentifier"] || e["key"]) == "+" && (e["location"] || e["keyLocation"]) == 3) && (
					e.ctrlKey ?
						e.altKey ? // webkit
							1
							:
							3
						:
						e.shiftKey ?
							2 // webkit
							:
							4 // IE9
					) || 9 // FireFox|w3c
					;
			}
			catch ( __e__ ) { _initKeyboardEvent_type = 0 }
		})( document.createEvent( "KeyboardEvent" ) )

		, _keyboardEvent_properties_dictionary = {
			"char": "",
			"key": "",
			"location": 0,
			"ctrlKey": false,
			"shiftKey": false,
			"altKey": false,
			"metaKey": false,
			"repeat": false,
			"locale": "",

			"detail": 0,
			"bubbles": false,
			"cancelable": false,

			//legacy properties
			"keyCode": 0,
			"charCode": 0,
			"which": 0
		}

		, own = function (arg1, arg2) { Object.prototype.hasOwnProperty.call(arg1, arg2); } // Function.prototype.call.bind(Object.prototype.hasOwnProperty)

		, _Object_defineProperty = Object.defineProperty || function(obj, prop, val) {
			if( "value" in val ) {
				obj[prop] = val["value"];
			}
		}
	;

	function crossBrowser_initKeyboardEvent(type, dict) {
		var e;
		if( _initKeyboardEvent_type ) {
			e = document.createEvent( "KeyboardEvent" );
		}
		else {
			e = document.createEvent( "Event" );
		}
		var _prop_name
			, localDict = {};

		for( _prop_name in _keyboardEvent_properties_dictionary ) if(own(_keyboardEvent_properties_dictionary, _prop_name) ) {
			localDict[_prop_name] = (own(dict, _prop_name) && dict || _keyboardEvent_properties_dictionary)[_prop_name];
		}

		var _ctrlKey = localDict["ctrlKey"]
			, _shiftKey = localDict["shiftKey"]
			, _altKey = localDict["altKey"]
			, _metaKey = localDict["metaKey"]
			, _altGraphKey = localDict["altGraphKey"]

			, _modifiersListArg = _initKeyboardEvent_type > 3 ? (
				(_ctrlKey ? "Control" : "")
					+ (_shiftKey ? " Shift" : "")
					+ (_altKey ? " Alt" : "")
					+ (_metaKey ? " Meta" : "")
					+ (_altGraphKey ? " AltGraph" : "")
				).trim() : null

			, _key = localDict["key"] + ""
			, _char = localDict["char"] + ""
			, _location = localDict["location"]
			, _keyCode = localDict["keyCode"] || (localDict["keyCode"] = _key && _key.charCodeAt( 0 ) || 0)
			, _charCode = localDict["charCode"] || (localDict["charCode"] = _char && _char.charCodeAt( 0 ) || 0)

			, _bubbles = localDict["bubbles"]
			, _cancelable = localDict["cancelable"]

			, _repeat = localDict["repeat"]
			, _locale = localDict["locale"]
			, _view = global
		;

		localDict["which"] || (localDict["which"] = localDict["keyCode"]);

		if( "initKeyEvent" in e ) {//FF
			//https://developer.mozilla.org/en/DOM/event.initKeyEvent
			e.initKeyEvent( type, _bubbles, _cancelable, _view, _ctrlKey, _altKey, _shiftKey, _metaKey, _keyCode, _charCode );
		}
		else if(  _initKeyboardEvent_type && "initKeyboardEvent" in e ) {//https://developer.mozilla.org/en/DOM/KeyboardEvent#initKeyboardEvent()
			if( _initKeyboardEvent_type == 1 ) { // webkit
				//http://stackoverflow.com/a/8490774/1437207
				//https://bugs.webkit.org/show_bug.cgi?id=13368
				e.initKeyboardEvent( type, _bubbles, _cancelable, _view, _key, _location, _ctrlKey, _shiftKey, _altKey, _metaKey, _altGraphKey );
			}
			else if( _initKeyboardEvent_type == 2 ) { // old webkit
				//http://code.google.com/p/chromium/issues/detail?id=52408
				e.initKeyboardEvent( type, _bubbles, _cancelable, _view, _ctrlKey, _altKey, _shiftKey, _metaKey, _keyCode, _charCode );
			}
			else if( _initKeyboardEvent_type == 3 ) { // webkit
				e.initKeyboardEvent( type, _bubbles, _cancelable, _view, _key, _location, _ctrlKey, _altKey, _shiftKey, _metaKey, _altGraphKey );
			}
			else if( _initKeyboardEvent_type == 4 ) { // IE9
				//http://msdn.microsoft.com/en-us/library/ie/ff975297(v=vs.85).aspx
				e.initKeyboardEvent( type, _bubbles, _cancelable, _view, _key, _location, _modifiersListArg, _repeat, _locale );
			}
			else { // FireFox|w3c
				//http://www.w3.org/TR/DOM-Level-3-Events/#events-KeyboardEvent-initKeyboardEvent
				//https://developer.mozilla.org/en/DOM/KeyboardEvent#initKeyboardEvent()
				e.initKeyboardEvent( type, _bubbles, _cancelable, _view, _char, _key, _location, _modifiersListArg, _repeat, _locale );
			}
		}
		else {
			e.initEvent(type, _bubbles, _cancelable)
		}

		for( _prop_name in _keyboardEvent_properties_dictionary )if( own( _keyboardEvent_properties_dictionary, _prop_name ) ) {
			if( e[_prop_name] != localDict[_prop_name] ) {
				try {
					delete e[_prop_name];
					_Object_defineProperty( e, _prop_name, { writable: true, "value": localDict[_prop_name] } );
				}
				catch(e) {
					//Some properties is read-only
				}

			}
		}

		return e;
	}

	//export
	global.crossBrowser_initKeyboardEvent = crossBrowser_initKeyboardEvent;

	}.call(nuanria.automation);
}());