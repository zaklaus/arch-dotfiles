///////////////////////////////////////////////////////////////////////////////
//
//  @file       nuanria.SpeechHost.js
//  @details    SpeechHost acts as an intermediary between the speech plugin and
//              instances of SpeechClient. There should be (at most) one
//              SpeechClient per frame in a page.
//
//  @notes      SpeechHost cannot invoke commands or editor functions directly,
//              instead it dispatches them to the appropriate SpeechClient.
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
nuanria.globals = nuanria.globals || {};

nuanria.SpeechHost = function(document, messenger) {
	nuanria.globals.dictationActive = false;

	///////////////////////////////////////////////////////////////////////////

	this.install      = install;
	this.uninstall    = uninstall;
	this.setSuspended = setSuspended;
	this.addHandler   = function(action, handler) { events.add(action, handler ); };
	this.isConnected  = function() { return plugin !== null; };

	///////////////////////////////////////////////////////////////////////////

	var window       = document.defaultView;
	var events       = new nuanria.Events();
	var locale       = new nuanria.Locale();
	var plugin       = null;
	var isReady      = false; // turns true when plugin.engineState == Status_Ready
	var nextClientId = 1;
	var clientsById  = {};
	var isSuspended  = true;  // plugin default

	//-------------------------------------------------------------------------
	// Dictation vars

	var dictationClient           = null;
	var activeEditorId            = "";
	var inhibitSyncWhileDictating = false;

	//-------------------------------------------------------------------------
	// Commands vars

	// if jsFullText is set to true, the commandMap will handle splitting
	// commands into tokens and subphrases for the recognizer.
	var jsFullText           = nuanria.utils.isMac();
	var enableShowLinks      = true;

	var commandMap           = null;
	var cmdClusterSize       = 100000;
	var chooseCommandsById   = {};
	var disambiguationsByNum = {};

	var cmd_showLinksProto   = { id: 100, commandStrings: ["show links"] };
	var cmd_cancelProto      = { id: 101, commandStrings: ["cancel"] };
	var cmd_chooseProto      = { id: 200, commandStrings: ["choose %1"] };

	//-------------------------------------------------------------------------

	function install(isPageActive) {
		isSuspended = !isPageActive;

		messenger.addHandler('speechHost_connect', messenger_connect);
		messenger.addHandler('speechHost_disconnect', messenger_disconnect);
		messenger.addHandler('speechHost_userInteractionOccurred', messenger_userInteractionOccurred);
		messenger.addHandler('speechHost_enableDictation', messenger_enableDictation);
		messenger.addHandler('speechHost_disableDictation', messenger_disableDictation);

		if (nuanria.pluginApi) {
			plugin = nuanria.pluginApi;
			nuanria.globals.pluginReady(plugin);
		} else if (document.riaplugin) {
			// use preloaded plugin
			setTimeout(function() {
				nuanria.utils.log("using preloaded...");
				nuanria.globals.pluginReady(document.riaplugin);
			}, 0);
		} else if (!document.getElementById("nuanria_plugin_outer")) {
			// inject plugin
			var mimeType = nuanria.utils.isMac() ?
								"application/x-ddria" :
								"application/x-dgnria2";
			var plugindiv = document.createElement('span');
			plugindiv.id = "nuanria_plugin_outer";
			plugindiv.innerHTML =
				'<object id="nuanria_plugin" type="' + mimeType + '" ' +
						'style="position: fixed; top: 0; left: 0; ' +
						'width: 1px; height: 1px;">' +
					'<param name="ready" value="nuanria.globals.pluginReady();" />' +
				'</object>';

			// redirect all plugindiv.style get/set operations to a dummy style object
			// so that web pages can't inadvertantly hide our plugin container
			if (plugindiv.__defineGetter__) {
				// IE doesn't implement __defineGetter__ but that's OK, we don't
				// need this to work in IE.
				var dummy = document.createElement('span');
				plugindiv.__defineGetter__("style", function() {
			        return dummy.style;
			    });
			}

			if( document.documentElement != null ) {
				document.documentElement.appendChild(plugindiv);
			}
			plugin = plugindiv.querySelector("object");

			// This should be done by the plugin automatically
			// as well, because a browser might not destroy a plugin
			// immediately after page unloads.
			document.defaultView.addEventListener("unload", function() {
				uninstall();
			});
		}
	}

	function uninstall() {
		if (plugin) {
			try {
				plugin.disconnect();
				plugin.parentNode.removeChild(plugin);

				messenger.removeHandler('speechHost_disableDictation', messenger_disableDictation);
				messenger.removeHandler('speechHost_enableDictation', messenger_enableDictation);
				messenger.removeHandler('speechHost_userInteractionOccurred', messenger_userInteractionOccurred);
				messenger.removeHandler('speechHost_disconnect', messenger_disconnect);
				messenger.removeHandler('speechHost_connect', messenger_connect);
			} catch (e) {

			}
		}
	}

	function setSuspended(value) {
		if (isSuspended != value) {
			isSuspended = value;
			if (plugin) {
				nuanria.utils.log("setting suspend state: " + isSuspended);
				plugin.setSuspendState(isSuspended);
				if (value) {
					cancelDisambiguation();
				}
			}
		}
	}

	function setDictationActive(active, useNatText) {
	    try {
	        plugin.setDictationActive(active, useNatText);
	        if (active && plugin.setActiveURL) {
	            plugin.setActiveURL(document.location.href);
	            console.log("Called plugin.setActiveURL");
	        }
	    }
	    catch (e) {
            plugin.setDictationActive(active);
	    }
	    // This old way allows RIA to work with DNS versions < 12.8. This however does not work with
        // DMNE where the version is < 12.8 but DMNE includes the updated plugin
		//if (nuanria.utils.compareVersions(nuanria.globals.appVersion, "12.80.200.249") > 0) {
		//	plugin.setDictationActive(active, useNatText);
		//} else {
		//	plugin.setDictationActive(active);
		//}
	}

	//-------------------------------------------------------------------------
	// Plugin events:

	nuanria.globals.pluginReady = function(pluginObject) {
		// In FF, the plugin object is not fully ready at this point so
		// we need to schedule the plugin setup
		setTimeout(function(){
			nuanria.utils.log("plugin ready");

			nuanria.globals.plugin = plugin;
			nuanria.globals.jsDelegate = speechDelegate;

			var ok = plugin.connect(speechDelegate);

			nuanria.utils.log("plugin connected: " + ok);
			nuanria.utils.logInfo("UA: " + window.navigator.userAgent);

			plugin.setSuspendState(isSuspended);
		});
	};

	function onEngineStateChanged(engineState, langId, strings) {
		var isReady = engineState == plugin.Status_Ready;

		// reset commands and dictation
		cancelDisambiguation();
		commandMap = null;
		dictationClient = null;
		activeEditorId = "";
		nuanria.globals.dictationActive = false;

		// prepare speechHost for use
		if (isReady) {

			// update locale
			locale.reset();
			if (langId) {
				strings = strings || {};
				locale.merge(langId, strings);
			}

			// create new command map
			var clickFormat = locale.getString("click %1");
			commandMap = new nuanria.CommandMap(jsFullText, jsFullText, clickFormat);

			// add default commands
			if (enableShowLinks) {
				var slCmd = getTranslatedCmd(cmd_showLinksProto, locale);
				commandMap.addCommands(0, [slCmd]);
			}
		}

		nuanria.utils.log("stateChanged", engineState);
		events.notify("stateChanged", isReady);
	}

	//-------------------------------------------------------------------------
	// Requests originating from SpeechClients:

	function messenger_connect(source, action, data, callback) {
		var client = getClient(source);

		if (!client) {
			client = { id: nextClientId++, window: source };
			clientsById[client.id] = client;
		} else {
			// A child frame might have been and have a new SpeechClient
			// without us having noticed. In that case, reuse the client id.
		}

		var retData = {
			clientId    : client.id,
			langId      : locale.langId,
			langStrings : locale.strings
		};
		return callback(retData);
	}

	function messenger_disconnect(source, action, data) {
		cleanUpDisconnectedClients();

		for (var clientId in clientsById) {
			var client = clientsById[clientId];
			if (client.window == source) {
				removeClient(client.id);
			}
		}

		//  cancel any pending disambig if this was the last client to disconnect
		if (!Object.keys(clientsById).length) {
			cancelDisambiguation();
		}
	}

	function cleanUpDisconnectedClients() {
		for (var clientId in clientsById) {
			var client = clientsById[clientId];
			if (!nuanria.utils.isWindowAlive(client.window)) {
				removeClient(client.id);
			}
		}
	}

	function removeClient(clientId) {
		// remove pending disambiguations for this client
		for (var num in disambiguationsByNum) {
			var disambiguation = disambiguationsByNum[num];
			if (disambiguation.clientId == clientId) {
				delete disambiguationsByNum[num];
			}
		}

		if (commandMap) {
			commandMap.clearCommands(clientId);
		}

		delete clientsById[clientId];
	}

	function messenger_enableDictation(source, action, data) {
		var client = getClient(source);
		if (!client) {
			return false;
		}

		nuanria.globals.dictationActive = true;

		var oldDictationClient = dictationClient;
		dictationClient = client;
		activeEditorId = dictationClient.id + "_" + data.activeEditorId;
		nuanria.utils.log("activeEditorID: " + activeEditorId);
		inhibitSyncWhileDictating = false;

		// update dictation state in plugin
		setDictationActive(true, data.natText);

		// entering an editor counts as a user interaction
		if (plugin.onUserInteraction) {
			plugin.onUserInteraction(JSON.stringify({type:"activateEditor"}));
		}

		return true;
	}

	function messenger_disableDictation(source, action, data) {
		var client = getClient(source);
		if (!client) {
			return false;
		}

		nuanria.globals.dictationActive = false;

		var oldDictationClient = dictationClient;
		dictationClient = null;
		activeEditorId = "";
		inhibitSyncWhileDictating = false;

		if (oldDictationClient && oldDictationClient.id == client.id) {
		    return setDictationActive(false, false);
		}

		// leaving an editor counts as a user interaction
		if (plugin.onUserInteraction) {
			plugin.onUserInteraction(JSON.stringify({type:"deactivateEditor"}));
		}

		return true;
	}

	function messenger_userInteractionOccurred(source, action, data) {
		var disambiguatingClickables = Object.keys(disambiguationsByNum).length;
		if (disambiguatingClickables) {
			cancelDisambiguation();
		}

		if (dictationClient) {
			if (plugin.onUserInteraction) {
				plugin.onUserInteraction(JSON.stringify(data));
			}
		}
	}

	//-------------------------------------------------------------------------
	// General functions called by delegate

	function sync(callback) {
		callback = callback || function() { };

		// only sync the first time when in a dictation field
		// (inhibitSyncWhileDictating will be set to false when
		//  the dictation target changes)
		if (inhibitSyncWhileDictating && !Object.keys(disambiguationsByNum).length) {
			callback();
			return;
		} else if (dictationClient) {
			inhibitSyncWhileDictating = true;
		}

		nuanria.utils.log("sync");

		cleanUpDisconnectedClients();

		var pending = Object.keys(clientsById).length;

		for (var clientId in clientsById) {
			if (clientId != 0) {
				commandMap.clearCommands(clientId);
				sendSyncMessage(clientsById[clientId]);
			}
		}

		function sendSyncMessage(client) {
			messenger.sendMessage(client.window, "speechClient_sync", null, function(response) {
				if (response.result == nuanria.Messenger_SUCCESS) {
					var commandsData = response.payload;
					if (commandsData.length) {
						commandMap.addCommands(client.id, commandsData);
					}

				} else if (response.result == nuanria.Messenger_RESPONSE_TIMEOUT) {
					nuanria.utils.logError("speechClient_sync timeout: " + client.id);
				}

				pending--;

				if (!pending) {
					commandMap.purge();
					if (callback) {
						callback();
						return;
					}
				}
			});
		}
	}

	//-------------------------------------------------------------------------
	// Dictation functions called by delegate

	function invokeEditor() {
		if (!arguments || arguments.length < 2) {
			throw new Error("Invalid arguments provided to SpeechHost.");
		}

		var args = [].splice.call(arguments,0);
		var data = {
			functionId : args.splice(0, 1)[0],
			args       : args.splice(0, args.length-1)
		};
		var callback = args[0];

		if (!dictationClient) {
			callback(callback, {
				error: "response error: Dictation is not enabled on this page."
			});
			return;
		}

		messenger.sendMessage(dictationClient.window, "speechClient_invokeEditor", data,
			function(response) {
				if (response.result == nuanria.Messenger_SUCCESS) {
					callback(response.payload);
				} else {
					nuanria.utils.logError("SpeechHost: Error sending message to speechClient_invokeEditor", data);
					callback({
						error: "response error: " + response.result,
					});
				}
			});
	}

	//-------------------------------------------------------------------------
	// Commands functions called by delegate

	function getCommands() {
		var triggers = commandMap.getAllTriggers();
/*
		for (var i = 0; i < triggers.length; i++) {
			console.log(triggers[i].id, triggers[i].trigger, commandMap.getCommandsForTrigger(triggers[i].id));
		}
*/
		return commandMap.getAllTriggers();
	}

	function invokeCommand(triggerIds, recognizedText, handleClick, callback) {
		inhibitSyncWhileDictating = false; // reset this

		var matchingCommands = [];
		var matchingCommandsById = {};

		// get the set of commands that match the trigger Ids
		for (var i = 0; i < triggerIds.length; i++) {
			var commands = commandMap.getCommandsForTrigger(triggerIds[i]);
			for (var j = 0; j < commands.length; j++) {
				var cmd = commands[j];

				// give precidence to the first source 0 (built-in) command
				if (cmd.sourceId == 0) {
					invokeCommandOption(cmd, recognizedText, handleClick, callback);
					return;
				}

				// otherwise add the command to our list
				if (!matchingCommandsById[cmd.id]) {
					matchingCommandsById[cmd.id[j]] = cmd;
					matchingCommands.push(cmd);
				}
			}
		}

		// at this point we know that matchingCommands all correspond to clickable elements
		if (!matchingCommands.length) {
			nuanria.utils.logError("command not found for '" + recognizedText + " " + JSON.stringify(triggerIds));
			callback(null);
		} else if (matchingCommands.length > 1) {
			cancelDisambiguation();
			disambiguateOptions(matchingCommands, recognizedText);
			callback(null);
		} else {
			invokeCommandOption(matchingCommands[0], recognizedText, handleClick, callback);
		}
	}

	function invokeCommandOption(option, recognizedText, handleClick, callback) {
		var cmdId = option.id;

		if (option.sourceId === 0) {  // built-in command
			var chooseCommand = chooseCommandsById[cmdId];
			if (chooseCommand) {
				invokeChooseCommand(chooseCommand, handleClick, callback);
				cancelDisambiguation();
				return;

			} else if (cmdId == cmd_showLinksProto.id) { // show links
				cancelDisambiguation();
				disambiguateAll();
				callback(null);
				return;

			} else if (cmdId == cmd_cancelProto.id) {
				cancelDisambiguation();
				callback(null);
				return;
			}

		} else {
			cancelDisambiguation();
			invokeClickCommand(option, handleClick, callback);
			return;
		}
	}

	// Allows user to choose <n> from any of the available links:
	function disambiguateAll() {
		var sourcesById = commandMap.getSources();
		var disambiguationsByClientId = {};
		var disambiguations = [];

		cleanUpDisconnectedClients();

		// collect all commands, grouped by client
		for (var sourceId in sourcesById) {
			var client = clientsById[sourceId];
			if (!client) {
				continue;
			}

			if (!disambiguationsByClientId[sourceId]) {
				disambiguationsByClientId[sourceId] = [];
			}

			var source = sourcesById[sourceId];
			var clientDisambiguations = [];
			for (var cmdId in source.commandsByLocalId) {
				var disambiguation = {
					id             : cmdId,
					clientId       : client.id,
					num            : -1, // set later
					recognizedText : "" // TODO: need this?
				};

				disambiguations.push(disambiguation);
				disambiguationsByClientId[sourceId].push(disambiguation);
			}
		}

		showDisambiguations(disambiguations, disambiguationsByClientId);
	}

	// Allows user to choose <n> where there are multiple links that match the command:
	function disambiguateOptions(options, recognizedText) {
		var disambiguations = [];
		var disambiguationsByClientId = {};

		for (var i = 0; i < options.length; i++) {
			var option = options[i];

			if (!disambiguationsByClientId[option.sourceId]) {
				disambiguationsByClientId[option.sourceId] = [];
			}

			var disambiguation = {
				id             : option.id,
				clientId       : option.sourceId,
				num            : -1, // set later
				recognizedText : recognizedText
			};
			disambiguations.push(disambiguation);
			disambiguationsByClientId[option.sourceId].push(disambiguation);
		}

		showDisambiguations(disambiguations, disambiguationsByClientId);
	}

	function showDisambiguations(disambiguations, disambiguationsByClientId) {
		var sourcesById = commandMap.getSources();
		var clientIds = Object.keys(disambiguationsByClientId);

		// sort disambiguations items according to position on screen
		disambiguations.sort(function(d1, d2){
			// get link coords relative to top frame
			var source1 = sourcesById[d1.clientId];
			var command1 = source1.commandsByLocalId[d1.id];
			var source2 = sourcesById[d2.clientId];
			var command2 = source2.commandsByLocalId[d2.id];

			// return sorting based on coords
			if (command1.y + 8 < command2.y) {
				return -1;
			} else if (command1.y > command2.y + 8) {
				return 1;
			} else {
				return command1.x - command2.x;
			}
		});

		// track active disambiguaitons
		disambiguationsByNum = {};
		for (var i = 0; i < disambiguations.length; i++) {
			var num = i+1;
			disambiguations[i].num = num;
			disambiguationsByNum[num] = disambiguations[i];
		}

		// notify each client to show numbers
		for (var clientId in disambiguationsByClientId) {
			var client = clientsById[clientId];
			if (!client) {
				continue;
			}

			var clientDisambiguations = disambiguationsByClientId[clientId];
			messenger.sendMessage(client.window, "speechClient_showDisambiguations", clientDisambiguations);
		}

		// add commands to the map for "choose <n>"
		addChooseNCommands(disambiguations);
	}

	function addChooseNCommands() {
		// add a command for each disambiguation choice
		var cmd_chooseBase = getTranslatedCmd(cmd_chooseProto, locale);
		for (var num in disambiguationsByNum) {
			var command = {
				id             : cmd_chooseBase.id + parseInt(num, 10),
				commandStrings : [
					nuanria.utils.formatString(cmd_chooseBase.commandStrings[0], num)
				]
			};
			commandMap.addCommands(0, [command]);
			chooseCommandsById[command.id] = command;
		}

		// add cancel command
		var cmdCancel = getTranslatedCmd(cmd_cancelProto, locale);
		commandMap.addCommands(0, [cmdCancel]);
	}

	function cancelDisambiguation() {
		cleanUpDisconnectedClients();
		for (var clientId in clientsById) {
			var client = clientsById[clientId];
			messenger.sendMessage(client.window, "speechClient_clearNumbers");
		}

		// remove commands
		if (commandMap) {
			commandMap.removeCommands(0, [cmd_cancelProto.id]);
			commandMap.removeCommands(0, Object.keys(chooseCommandsById));
		}

		chooseCommandsById = {};
		disambiguationsByNum = {};
	}

	function invokeClickCommand(commandOption, handleClick, callback) {
		var client = clientsById[commandOption.sourceId];
		if (client && nuanria.utils.isWindowAlive(client.window)) {
			var msgArgs = {
				isDisambiguation: false,
				cmdId: commandOption.id,
				handleClick: handleClick
			};

			messenger.sendMessage(client.window, "speechClient_invokeClickable", msgArgs,
				function(response) {
					callback(response.payload);
				});
			return;
		}

		callback(null);
	}

	function invokeChooseCommand(chooseCommand, handleClick, callback) {
		var num = chooseCommand.id - cmd_chooseProto.id;

		var disambiguation = disambiguationsByNum[num];
		if (disambiguation) {
			var client = clientsById[disambiguation.clientId];
			if (client && nuanria.utils.isWindowAlive(client.window)) {
				var msgArgs = {
					isDisambiguation : true,
					cmdId            : disambiguation.id,
					handleClick      : handleClick
				};

				messenger.sendMessage(client.window, "speechClient_invokeClickable", msgArgs,
					function(response) {
						callback(response.payload);
					});
				return;
			}
		}

		callback(null);
	}

	//-------------------------------------------------------------------------
	// Helpers:

	function addPluginListener(plugin, eventName, handler) {
		if (plugin.attachEvent) {
			if (!document.attachEvent) {
				// attachEvent() is obsolete as of IE11 - yay!
				plugin.addEventListener(eventName, handler);
			} else {
				plugin.attachEvent("on" + eventName, handler);
			}
		} else {
			plugin.addEventListener(eventName, handler);
		}
	}

	function getClient(clientWindow) {
		cleanUpDisconnectedClients();
		for (var clientId in clientsById) {
			if (clientsById[clientId] && clientsById[clientId].window == clientWindow) {
				return clientsById[clientId];
			}
		}
		return null;
	}

	function invokePluginCallback(callback, success, result) {
		// can't pass back undefined
		if (result === undefined) {
			result = null;
		}

		var jsonResult;

		// extract error message from error data
		if (success) {
			jsonResult = JSON.stringify(result);
		} else {
			nuanria.utils.logError("Plugin callback error", result);
			if (result.message) {
				jsonResult = JSON.stringify(result.message);
			} else {
				JSON.stringify(result);
			}
		}

		if (callback[""]) {
			// firebreath doesn't implement DISP0 functions properly for IE
			callback[""](success, jsonResult);
		} else {
			callback(success, jsonResult);
		}
	}

	function getDebugInfo() {
		return {
			version    : nuanria.version,
			windowName : window.name,
			windowUrl  : document.location.href
		};
	}

	function getTranslatedCmd(protoCmd, locale) {
		var cmd = {
			id             : protoCmd.id,
			commandStrings : []
		};

		for (var i = 0; i < protoCmd.commandStrings.length; i++) {
			var protoString = protoCmd.commandStrings[i];
			var commandString = locale.getString(protoString);
			if (commandString) {
				cmd.commandStrings.push(commandString);
			} else {
				nuanria.utils.logError("ProtoCmd " + protoCmd.id + " is missing a translation for " + commandString);
			}
		}

		return cmd;
	}

	window.nuan_webie_get_shouldSuspendDictation = function () {
		// web_ie will check this function to determine if it
		// should relinquish dictation control to another
		// provider (in this case, us.)
		return !!dictationClient;
	};

	//-------------------------------------------------------------------------

	/*
	 * This delegate object is given to the plugin so that the plugin can invoke
	 * functions on SpeechHost.
	 */
	var speechDelegate = {

		engineStateChanged : function(jsonData) {
			try {
				var data = JSON.parse(jsonData);
				onEngineStateChanged(data["engineState"], data["langId"], data["strings"]);
				nuanria.globals.appVersion = data["appVersion"] || "12.80.000.000"; // TODO: we should set this earlier
			} catch (e) {
			    nuanria.utils.logError("speechDelegate - ", e);
			}
		},

		getSuspendState : function(jsonData, callback) {
			invokePluginCallback(callback, true, !document.hasFocus());
		},

		sync : function(jsonData, callback) {
			try {
				sync(function() {
					invokePluginCallback(callback, true);
				});
			} catch (e) {
				invokePluginCallback(callback, false, e);
			}
		},

		getCommands: function(jsonData, callback) {
			try {
				commandMap.purge();
				invokePluginCallback(callback, true, getCommands());
			} catch (e) {
				invokePluginCallback(callback, false, e);
			}
		},

		invokeCommand: function(jsonData, callback) {
			try {
				var data = JSON.parse(jsonData);

				if (data.id) { // Mac uses this
					data.ids = [data.id];
				}

				invokeCommand(data["ids"], data["recognizedText"], data["handleClick"],
					function(clickCoords) {
						invokePluginCallback(callback, true, clickCoords);
					});
			} catch (e) {
				invokePluginCallback(callback, false, e);
			}
		},

		cancelDisambiguation: function(jsonData, callback) {
			try {
				if (Object.keys(disambiguationsByNum).length) {
					cancelDisambiguation();
				}
			} catch (e) {

			}
		},

		getActiveEditorId: function(jsonData, callback) {
			invokePluginCallback(callback, true, activeEditorId);
		},

		getChanges: function(jsonData, callback) {
			invokeEditor("getChanges", function(result){
					if (!result.error) {
						invokePluginCallback(callback, true, result.retVal);
					} else {
						invokePluginCallback(callback, false, result.error);
					}
				});
		},

		makeChanges: function(jsonData, callback) {
			try {
				var data = JSON.parse(jsonData);
				invokeEditor(
					"makeChanges",
					data["blockStart"], data["blockLength"], data["text"], data["selStart"], data["selLength"],
					data["formatCommand"],
					function(result) {
						if (!result.error) {
							invokePluginCallback(callback, true, result.retVal);
						} else {
							invokePluginCallback(callback, false, result.error);
						}
					});
			} catch (e) {
				invokePluginCallback(callback, false, e);
			}
		},

		getCharacterRectangle: function(jsonData, callback) {
			try {
				var data = JSON.parse(jsonData);
				invokeEditor("getCharacterRectangle", data["position"], function(rectResponse) {
					if (!rectResponse.error) {
						invokePluginCallback(callback, true, rectResponse.retVal); // success
					} else {
						invokePluginCallback(callback, false, rectResponse.error); // response error
					}
				});
			} catch (e) {
				invokePluginCallback(callback, false, e); // exception
			}
		},

		getDebugInfo : function(jsonData, callback) {
			invokePluginCallback(callback, true, getDebugInfo());
		}
	};
};