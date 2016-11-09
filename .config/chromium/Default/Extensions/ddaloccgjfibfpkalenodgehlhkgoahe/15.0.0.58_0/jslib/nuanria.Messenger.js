////////////////////////////////////////////////////////////////////////////////
//
//  @file       nuanria.Messenger.js
//  @details    Bidirectional messaging with error handling and timeout support.
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

nuanria.Messenger_SUCCESS			= 0;
nuanria.Messenger_RESPONSE_TIMEOUT	= 1;
nuanria.Messenger_ACTION_ERROR		= 2;

/*
 * @desc				: 2-way messaging support.
 * @param timer			: provides setTimeout, clearTimeout functions. (Can use window for this)
 * @param messagingApi	: messaging functions
 *
 * nuanria.Messenger.GetCrossDocument(window) :
 *		(Static) factory method. Returns an instance of nuanria.Messenger that uses
 *		HTML5 cross-document messaging to allow for sending and receiving messages
 *		across document and frame boundaries.
 */
nuanria.Messenger = function(timer, messagingApi) {
	"use strict";

	var JSON = nuanria.JSON;

	///////////////////////////////////////////////////////////////////////////

	// connect(messagingApi)
	this.connect		= connect;

	// addHandler(action, handler)
	//     handler(source, action, payload, callback)
	//     callback(result)
	// suggest: handler(request:{ source, action, data}, callback);
	this.addHandler     = addHandler;

	// removeHandler(action)
	this.removeHandler  = removeHandler;

	// sendMessage(destination, action, [payload], [done(data)])
	//    done({ responseCode, payload })
	// suggest: done(result, [responseCode]);
	this.sendMessage    = sendMessage;

	// disconnect()
	this.disconnect		= disconnect;

	this.getIsConnected = function() { return connected; };

	///////////////////////////////////////////////////////////////////////////

	var connected			= false;
	var callbackTimeoutMs   = 2000;
	var maxPendingCallbacks = 10;
	var nextMessageId       = 0;
	var pendingCallbacks    = {};
	var handlers            = {};

	///
	/// Setup / Teardown
	///

	function connect() {
		messagingApi.connect();
		messagingApi.onMessageReceived = onMessageReceived;
		connected = true;
	}

	function addHandler(notificationName, handler) {
		nuanria.utils.validateString(notificationName, "notificationName");
		nuanria.utils.validateFunction(handler, "handler");

		if (handlers[notificationName]) {
			throw "Handler already exists.";
		}

		handlers[notificationName] = handler;
	}

	function removeHandler(notificationName) {
		nuanria.utils.validateString(notificationName, "notificationName");

		if (!handlers[notificationName]) {
			throw "Handler doesn't exist.";
		}

		delete handlers[notificationName];
	}

	function disconnect() {
		if (connected) {
			messagingApi.disconnect();
			messagingApi.onMessageReceived = null;
			connected = false;
		}
	}

	///
	/// Send
	///

	function sendMessage(destination, action, payload, callback) {

		if (!connected) {
			throw new Error("Not connected");
		}

		// prepare message
		var messageId = nextMessageId++;
		var message = {
			protocol         : "nuanria_messaging",
			type             : "request",
			messageId        : messageId,
			action           : action,
			responseRequired : callback !== undefined,
			payload          : payload
		};

		if (callback) {
			// set a timer so we can signal a callback error
			// if we don't receive a response in time.
			var timerId = timer.setTimeout(function() {
					timeoutExpired(messageId);
				},
				callbackTimeoutMs);

			// remember the timer and callback info
			pendingCallbacks[messageId] = {
				timerId: timerId,
				callback: callback
			};
		}

		// send message
		messagingApi.sendMessage(destination, message);
	}

	function handleResponse(messageId, result, payload) {
		var callbackInfo = pendingCallbacks[messageId];

		// we can't assume that messageId is valid.
		// The response might have arrived too late, or
		// we might have been sent a spurious id.
		if (!callbackInfo) {
			return;
		}

		// unset timer
		timer.clearTimeout(callbackInfo.timerId);

		// invoke the callback
		callbackInfo.callback({
				result  : result,
				payload : payload
			});

		// remove the callback info from the dict
		delete pendingCallbacks[messageId];
	}

	function timeoutExpired(messageId) {
		// if the timeout expires then we assume that
		// there is valid callback info in pendingCallbacks
		var callbackInfo = pendingCallbacks[messageId];

		// invoke the callback
		callbackInfo.callback({
			result  : nuanria.Messenger_RESPONSE_TIMEOUT,
			payload : null
			});

		// remove the callback info from the dict
		delete pendingCallbacks[messageId];
	}


	///
	/// Receive
	///

	function onMessageReceived(messageData, source) {
		if (messageData.protocol != "nuanria_messaging") {
			return;
		}

		if (typeof messageData.messageId != "number") {
			return;
		}

		if (messageData.type == "request") {
			if (typeof messageData.action != "string") {
				return;
			}

			if (typeof messageData.responseRequired != "boolean") {
				return;
			}

			handleRequest(source, messageData.action, messageData.messageId, messageData.responseRequired, messageData.payload);
			return;
		}

		if (messageData.type == "response") {
			if (typeof messageData.result != "number") {
				return;
			}
			handleResponse(messageData.messageId, messageData.result, messageData.payload);
			return;
		}
	}

	function handleRequest(source, action, messageId, responseRequired, requestPayload) {
		var handler, result, timeout;

		handler = handlers[action];
		// If there is no handler, ignore the message. There could be another instance of messenger
		// that will handle the message instead.  Another option here would be to make nuanria.messenger
		// a singleton module with multicast handlers. That would mean no timeout if there is no
		// handlers, however then there would be contention as to which handler would return the response.
		if (handler) {
			try {
				handler(source, action, requestPayload, function(retVal) {
					if (responseRequired) {
						postResponse(source, messageId, nuanria.Messenger_SUCCESS, retVal);
					}
				});
			} catch (e) {
				nuanria.utils.logError("Exception occurred in message handler: ", e, action, requestPayload);
				if (responseRequired) {
					postResponse(source, messageId, nuanria.Messenger_ACTION_ERROR, e);
				}
			}
		}
	}

	function postResponse(destination, messageId, result, payload) {
		// prepare message
		var message = {
			protocol  : "nuanria_messaging",
			type      : "response",
			messageId : messageId,
			result    : result,
			payload   : payload
		};

		// send response message
		messagingApi.sendMessage(destination, message);
	}
};

//-----------------------------------------------------------------------------
// MessageApi Spec (Reference only)

nuanria.Messenger.MessageApiSpec = function() {

	this.connect = function() {
		// set up any messaging handling. When a message
		// is received, invoke onMessageRecieived.
	};

	this.onMessageReceived = function(messageData, source) {
		// this function will be assigned by the main Messenger class
		// after it calls connect()
	};

	this.sendMessage = function (destination, message) {

	};

	this.disconnect = function() {
		// remove any event handlers etc so object
		// can be garbage collected if necessary
	};
};

//-----------------------------------------------------------------------------
// Messenger Factories

// CrossDocument Messenger uses HTML5 messaging API
nuanria.Messenger.CreateCrossDocument = function(window) {

	var messageApi = {};

	var windowMessageHandler = function(event) {
		var eventData;
		try {
			eventData = JSON.parse(event.data);
		} catch (e) {
			return;
		}

		if (messageApi.onMessageReceived) {
			messageApi.onMessageReceived(eventData, event.source);
		}
	};

	messageApi.onMessageReceived  = null;

	messageApi.sendMessage = function(target, message) {
		target = target || window;
		target.postMessage(JSON.stringify(message), '*');
	};

	messageApi.connect = function() {
		window.addEventListener('message', windowMessageHandler);
	};

	messageApi.disconnect = function() {
		messageApi.onMessageReceived = null;
		window.removeEventListener('message', windowMessageHandler);
	};

	// create
	return new nuanria.Messenger(window, messageApi);
};


// DOM Messenger uses a DOM element to relay messages via
// CustomEvents. This can be used to allow two scripts that
// operate in difference sandboxes to communicate if they
// both have access to the DOM & DOM events.
nuanria.Messenger.CreateDOM = function(timer, proxyElement) {
	/*global CustomEvent*/
	"use strict";

	var messageApi = {};

	var customEventHandler = function(event) {
		var eventData;
		try {
			eventData = JSON.parse(event.detail);
		} catch (e) {
			return;
		}

		if (messageApi.onMessageReceived) {
			messageApi.onMessageReceived(eventData, proxyElement);
		}
	};

	messageApi.sendMessage = function(target, message) {
		// we disregard the target here

		//var customEvent = new CustomEvent("nuan-dom-message", {
		//	detail: JSON.stringify(message)
		//});
		var customEvent = proxyElement.ownerDocument.createEvent("CustomEvent");
		customEvent.initCustomEvent("nuan-dom-message", true, true, JSON.stringify(message));

		timer.setTimeout(function() {
			proxyElement.dispatchEvent(customEvent);
		}, 0);
	};

	messageApi.connect = function() {
		proxyElement.addEventListener('nuan-dom-message', customEventHandler);
	};

	messageApi.disconnect = function() {
		messageApi.onMessageReceived = null;
		proxyElement.removeEventListener('nuan-dom-message', customEventHandler);
	};

	return new nuanria.Messenger(timer, messageApi);
};