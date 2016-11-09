;(function(){
	"use strict";

	var port = null;

	var preRenderTabs = {};

	/*
	 * Handles incoming messages from content scripts
	 */
	chrome.extension.onMessage.addListener(
		function(request, sender, callback) {
			if (request.type == "ria-ping") {
				if (isAlive()) {
					callback("ok");
				} else {
					callback("notConnected");
				}

			} else if (request.type == "ria-remote-message") {
				var tabId = sender.tab.id;

				// lazy load connection to our native messaging host
				if (!port) {
					port = chrome.runtime.connectNative("com.nuance.dgnria");
					port.onMessage.addListener(onDelegateMessage);
				}

				// repackage the message that we will forward to the nmhost
				var message = {
					pageId : tabId,
					type   : "request",
					fnName : request.name,
					data   : request.data
				};

				// check if the destination tab is visible in Chrome
				chrome.tabs.get(tabId, function(tab) {
					// Make sure there was not an error
				    if (chrome.runtime.lastError) {
						//console.log(chrome.runtime.lastError.message);
						//console.log(message);
						// The original implementation of this function handled a
						// hidden tab issue. The Chrome browser now sends a temporary 
						// tab id that is not available to the "tab.get" function yet.
						// Eventually Chrome gets around to making the tab's id available
						// to the "tab.get" function and everything works as designed.
						
						// So for now, just queue the messages intended for
						// this pre-rendered tab, so that if it Chrome makes
						// it active and visible, we can send the pending
						// RIA messages, which will initialize RIA at that point.
						if (!preRenderTabs[tabId]) {
							preRenderTabs[tabId] = [];
						}
						preRenderTabs[tabId].push(message);
					} else if (tab) {
						// it's a normal tab, forward the message
						port.postMessage(message);

					} else {
						// This message is from a hidden tab that is being
						// pre-rendered. It has a tab ID, but it is not shown
						// in Chrome yet. At some point, Chrome might
						// do a fast switchout between an existing tab
						// and this pre-rendered tab, at which point we will want
						// RIA to load. When that happens, we will get a
						// tabs.onReplaced event. (see below). However, if
						// Chrome discards this tab without using it, then we
						// will not get any notification.

						// So for now, just queue the messages intended for
						// this pre-rendered tab, so that if it Chrome makes
						// it active and visible, we can send the pending
						// RIA messages, which will initialize RIA at that point.
						if (!preRenderTabs[tabId]) {
							preRenderTabs[tabId] = [];
						}
						preRenderTabs[tabId].push(message);
					}
				});


			} else if (request.type == "jsDelegate-response") {
				sendDelegateResponse(request.pageId, request.msgId, request.success, request.jsonData);
			}
		});

	/*
	 * Handles tab getting closed
	 */
	chrome.tabs.onRemoved.addListener(
		function(tabId, removeInfo) {
			//console.log("Removed tab " + tabId + " removeInfo " + JSON.stringify(removeInfo));
			if (port) {
				// we don't always get notifications from the page when it is unloaded,
				// so we'll send an extra disconnect request to be safe
				port.postMessage({
						pageId : tabId,
						type   : "request",
						fnName : "disconnect"
					});
			}
			else {
				//console.log("Cannot disconnect tab " + tabId);
			}
		});

	/*
	 * Handles a pre-rendered tab getting switched with an existing tab
	 */
	chrome.tabs.onReplaced.addListener(
		function(addedTabId, removedTabId) {
			//console.log(">> " + removedTabId + " Replaced with " + addedTabId);

			// ensure the removed tab is shut down
			port.postMessage({
					pageId : removedTabId,
					type   : "request",
					fnName : "disconnect"
				});

			// send any queued messages for the added (prerendered) tab
			var preRenderMessages = preRenderTabs[addedTabId];
			if (preRenderMessages) {
				for (var i = 0; i < preRenderMessages.length; i++) {
					//console.log("sending prerender message: ", preRenderMessages[i]);
					port.postMessage(preRenderMessages[i]);
				}
				delete preRenderTabs[addedTabId];
			}
		});

// These listeners are only useful for debugging. During normal use they just cause noise.
//	chrome.tabs.onCreated.addListener(
//		function(tab) {
//			console.log(">> " + tab.id + " Created");
//		});
//
//	chrome.tabs.onUpdated.addListener(
//		function(tabId, changeInfo, tab) {
//			console.log(">> " + tabId + " URL " + tab.url + " Updated - changeInfo " + JSON.stringify(changeInfo));
//		});

	/*
	 * Invoked when we receive a message from the NMHost, intended for JsDelegate
	 */
	function onDelegateMessage(msg) {
		if (msg.pageId) {
			//console.log("Got message: ", msg.fnName, msg);
			chrome.tabs.sendMessage(
				msg.pageId,
				{
					pageId: msg.pageId,
					msgId: msg.id,
					type: "jsDelegate",
					fnName: msg.fnName,
					jsonData: msg.jsonData
				}
			);
		}
	}

	/*
	 * Invoked when we receive a response from JsDelegate, intended for NMHost
	 */
	function sendDelegateResponse(pageId, msgId, success, jsonData) {
		// repackage the message that we will forwarded to the nmhost
		var message = {
			pageId : pageId,
			msgId  : msgId,
			type   : "jsDelegate-response",
			success   : success,
			jsonData  : jsonData
		};
		//console.log("Send message: ", message);
		port.postMessage(message);
	}

	/*
	 * Returns true if the port object is connected
	 */
	function isAlive() {
		try {
			port.postMessage(null);
			return true;
		} catch (e) {
			return false;
		}
	}
}());