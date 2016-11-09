////////////////////////////////////////////////////////////////////////////////
//
//	@file		nuanria.CommandMap.js
//	@details	Aggregation for RIA commands
//
//	@author		Chris Hardy
//	@date		23-Sep-2013
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

nuanria.CommandMap = function(useFragments, chunkifyFullText, fullTextFormat) {

	///////////////////////////////////////////////////////////////////////////

	this.addCommands            = addCommands;
	this.removeCommands         = removeCommands;
	this.clearCommands          = clearCommands;
	this.getAllTriggers         = getAllTriggers;
	this.getCommandsForTrigger  = getCommandsForTrigger;
	this.getSources             = getSources;
	this.purge                  = purge;

	///////////////////////////////////////////////////////////////////////////

	// Default parameters
	useFragments     = !!useFragments;
	chunkifyFullText = !!chunkifyFullText;
	fullTextFormat   = fullTextFormat || "%1";

	var sourcesById         = {};
	var commandsById        = {};
	var nextUniqueCommandId = 0;
	var fragmentsById       = {};
	var fragmentsByPhrase   = {};
	var unusedFragmentsById = [];
	var nextFragmentId      = 100000;
	var maxWordLen          = 27;
	var maxChunkifyLen      = 5;

	/*
	 * Adds multiple commands to the map.
	 * @param sourceId: Id of the frame that the commands belong to.
	 * @param commandsData: an array of commandParams
	 *        (see addCommand for description)
	 */
	function addCommands(sourceId, commandsData) {
		var newFragmentIds = [];
		var fragments;

		if (!commandsData.length) {
			return [];
		}

		for (var i = 0; i < commandsData.length; i++) {
			fragments = addCommand(sourceId, commandsData[i]);

			for (var j = 0; j < fragments.length; j++) {
				var fragment = fragments[j];
				newFragmentIds.push(fragment.id);
			}
		}

		return newFragmentIds;
	}

	/*
	 * Adds a command to the map
	 * @param sourceId: Id of the frame that the commands belong to.
	 * @param commandParams: {
	 *                         id,
	 *                         commandStrings,
	 *                         isFullText,
	 *						   x,
	 *                         y
	 *                     }
	 */
	function addCommand(sourceId, commandParams) {
		var command = new nuanria.CommandMap.Command(
								nextUniqueCommandId++,
								sourceId,
								commandParams);

		if (!sourcesById[sourceId]) {
			sourcesById[sourceId] = new nuanria.CommandMap.Source(sourceId);
		}
		sourcesById[sourceId].commandsByLocalId[command.localId] = command;
		commandsById[command.id] = command;


		var newFragments = [];

		if (!useFragments) {
			return newFragments;
		}

		var chunkify = chunkifyFullText && command.isFullText;
		for (var i = 0; i < commandParams.commandStrings.length; i++) {
			var commandString = commandParams.commandStrings[i];
			if (chunkify) {
				// don't allow { | } symbols in chunkify commands
				commandString = commandString.replace(/[\{\|\}]/g, " ");
				chunkifyCommand(command, commandString, newFragments);
			} else {
				addFragment(commandString, command, newFragments);
			}
		}

		return newFragments;
	}

	/*
	 * Chunkify the command into fragments. This is a poor-man's version
	 * of SelectGrammar, allowing a user to invoke a command by a portion
	 * of the commandString. Note that only the first few words
	 * (up to maxChunkifyLen) will be processed.
	 */
	function chunkifyCommand(command, commandString, newFragments_out) {
		var parts = commandString.split(" ");
		var length = Math.min(maxChunkifyLen, parts.length);
		for (var chunkStart = 0; chunkStart < length; chunkStart++) {
			var chunk = "";
			for (var chunkEnd = chunkStart; chunkEnd < length; chunkEnd++) {

				// If a word is longer than the set length, nobody can pronounce it.
				// Don't add such a word in XYZ grammar.
				if(parts[chunkEnd].length > maxWordLen)
				{
					break;
				}

				chunk += parts[chunkEnd];
				if (chunk) {
					addFragment(chunk, command, newFragments_out);
					chunk += " ";
				}
			}
		}
	}

	/*
	 * A fragment represents a unique phrase that can be used to invoke a
	 * command. A phrase is one or more words of the original commandString.
	 * A fragment is linked to multiple commands that have matching phrases.
	 */
	function addFragment(phrase, command, newFragments_out) {
		var formattedPhrase = command.isFullText ?
				nuanria.utils.formatString(fullTextFormat, phrase) :
				phrase;
		var lowerCasePhrase = formattedPhrase.toLocaleLowerCase();

		var fragment = fragmentsByPhrase[lowerCasePhrase];
		if (!fragment) {
			// fragment doesn't exist:
			fragment = new nuanria.CommandMap.Fragment(nextFragmentId++, lowerCasePhrase);
			fragmentsByPhrase[lowerCasePhrase] = fragment;
			fragmentsById[fragment.id]          = fragment;
			newFragments_out.push(fragment);

		} else if (!Object.keys(fragment.commandsById).length) {
			// fragment already exists, but isn't being used:
			delete unusedFragmentsById[fragment.id]; // remove from purge list
			newFragments_out.push(fragment);
		}

		fragment.linkCommand(formattedPhrase, command);
		command.fragments.push(fragment);

		return fragment;
	}

	/*
	 * Removes commands from the map.
	 */
	function removeCommands(sourceId, commandIds) {
		if (!sourcesById[sourceId]) {
			return [];
		}

		for (var i = 0; i < commandIds.length; i++) {
			removeCommand(sourceId, commandIds[i]);
		}
	}

	/*
	 * Removes a command from the map.
	 * @param sourceId: The source id that the command belongs to
	 * @param commandId: The original (local) id of the command
	 */
	function removeCommand(sourceId, commandId) {
		if (!sourcesById[sourceId]) {
			return [];
		}
		var source = sourcesById[sourceId];
		var command = source.commandsByLocalId[commandId];
		if (!command) {
			return [];
		}

		var sourceCommands = sourcesById[sourceId].commandsByLocalId;
		delete sourceCommands[command.localId];
		if (!Object.keys(sourceCommands).length) {
			delete sourcesById[sourceId];
		}

		delete commandsById[command.id];

		if (useFragments) {
			// remove command from all fragments that reference it
			for (var i = 0; i < command.fragments.length; i++) {
				var fragment = command.fragments[i];
				delete fragment.commandsById[command.id];

				// remove command from casings map
				fragment.unlinkCommand(command.id);

				// Mark fragment as unused instead of deleting it.
				// This will allow the fragment to be resued with
				// the same ID if a matching command is re-added
				// before purge() is called.
				if (!Object.keys(fragment.commandsById).length) {
					unusedFragmentsById[fragment.id] = fragment;
				}
			}
		}
	}

	/*
	 * Removes any empty fragments from the map. Empty fragments
	 * are not immediately deleted to allow for reuse of IDs.
	 */
	function purge() {
		var removedFragmentIds = [];

		for (var id in unusedFragmentsById) {
			var unusedFragment = unusedFragmentsById[id];
			delete unusedFragmentsById[unusedFragment.id];
			delete fragmentsById[unusedFragment.id];
			delete fragmentsByPhrase[unusedFragment.phrase];
			removedFragmentIds.push(id);
		}

		return removedFragmentIds;
	}

	/*
	 * Removes all commands for a particular sourceId
	 */
	function clearCommands(sourceId) {
		if (!sourcesById[sourceId]) {
			return [];
		}

		var commandIds = [];
		var sourceCommands = sourcesById[sourceId].commandsByLocalId;
		for (var cmdId in sourceCommands) {
			commandIds.push(sourceCommands[cmdId].localId);
		}

		var removedCommands = removeCommands(sourceId, commandIds);

		delete sourcesById[sourceId];
		return removeCommands;
	}

	/*
	 * Returns the sources map
	 */
	function getSources() {
		return sourcesById;
	}

	/*
	 * Returns an array of nuanria.CommandMap.Trigger objects.
	 * Triggers are the aggregated results of the map.
	 * Use getCommandsForTrigger() to get associated command(s)
	 * for a trigger ID.
	 */
	function getAllTriggers() {
		if (useFragments) {
			return getAllFragmentTriggers();
		} else {
			return getAllCommandTriggers();
		}
	}

	/*
	 * Returns an array of triggers based on the fragments
	 * in the map. These triggers will not have duplicate
	 * text.
	 */
	function getAllFragmentTriggers() {
		var triggers = [];

		for (var id in fragmentsById) {
			var fragment = fragmentsById[id];

			if (unusedFragmentsById[id]) {
				continue;
			}

			var casings = Object.keys(fragment.casings);
			var triggerText = casings.join("|");
			if (casings.length > 1) {
				triggerText = "{" + triggerText + "}";
			}

			if (triggerText == "") {
				nuanria.utils.logError(
					"Empty fragment text: " + fragment.id + ", " +
					fragment.phrase + ", " +
					JSON.stringify(casings));
				continue;
			}

			triggers.push(
				new nuanria.CommandMap.Trigger(
					fragment.id,
					triggerText,
					false
				));
		}

		return triggers;
	}

	/*
	 * Returns an array of triggers based on all the commands
	 * in the map. Note that there may be multiple triggers
	 * returned for the same command id. Also, multiple
	 * triggers can be returned with the same text.
	 */
	function getAllCommandTriggers() {
		var triggers = [];

		for (var sourceId in sourcesById) {
			var source = sourcesById[sourceId];

			for (var cmdId in source.commandsByLocalId) {
				var command = source.commandsByLocalId[cmdId];
				var commandStrings = command.commandStrings;

				// add a new
				for (var i = 0; i < commandStrings.length; i++) {
					var commandString = commandStrings[i];

					triggers.push(
						new nuanria.CommandMap.Trigger(
							command.id, // unique command id
							commandString,
							command.isFullText
						));
				}
			}
		}

		return triggers;
	}

	/*
	 * Returns ids for all commands that are associated to with particular trigger id.
	 * Return data is: [
	 *                     {
	 *                         id: original command id,
	 *                         sourceId: source id of command
	 *                     },
	 *                     ...
	 *                 ]
	 */
	function getCommandsForTrigger(triggerId) {
		if (useFragments) {
			return getCommandsForFragment(triggerId);
		} else {
			return getCommandsForId(triggerId);
		}
	}

	function getCommandsForFragment(fragmentId) {
		var fragment = fragmentsById[fragmentId];
		if (!fragment) {
			nuanria.utils.logError("Fragment not found: " + fragmentId);
			return [];
		}

		var items = [];
		for (var cmdId in fragment.commandsById) {
			var command = fragment.commandsById[cmdId];
			items.push({
				id       : command.localId,
				sourceId : command.sourceId
			});
		}
		return items;
	}

	function getCommandsForId(uniqueId) {
		var commands = [];
		var command = commandsById[uniqueId];
		if (command) {
			commands.push({
				id       : command.localId,
				sourceId : command.sourceId
			});
		}
		return commands;
	}
};

/*
 * Represents the source frame of the command. Used as a grouping mechanism.
 */
nuanria.CommandMap.Source = function(id) {
	this.sourceId          = id;
	this.commandsByLocalId = {};
};

/*
 * A command as added with AddCommand.
 * There may be multiple commands with the same trigger.
 */
nuanria.CommandMap.Command = function(id, sourceId, commandData) {
	this.id              = id;
	this.sourceId        = sourceId;
	this.localId         = commandData.id;
	this.isFullText      = !!commandData.isFullText;
	this.commandStrings  = commandData.commandStrings || [];
	this.x               = commandData.x || 0;
	this.y               = commandData.y || 0;
	this.fragments       = [];
};

/*
 * A fragment is a unique phrase that used by a command.
 * There may be multiple commands that use the same fragment.
 * There may be multiple fragments for one command.
 * If CommandMap is configured to chunkify full text commands, then
 * each command string will be permutated into a set of triggers
 * based on the first n words.
 */
nuanria.CommandMap.Fragment = function(id, phrase) {
	this.id            = id;
	this.phrase        = phrase;
	this.casings       = {};  // [casing][sourceCommandId] = true
	this.commandsById  = {};
};
nuanria.CommandMap.Fragment.prototype.linkCommand = function(casing, command) {
	if (!this.commandsById[command.id]) {
		this.commandsById[command.id] = command;
	}

	if (!this.casings[casing]) {
		this.casings[casing] = {};
	}
	this.casings[casing][command.id] = true;
};
nuanria.CommandMap.Fragment.prototype.unlinkCommand = function(commandId) {
	for (var casing in this.casings) {
		var casingsCommands = this.casings[casing];

		if (casingsCommands[commandId]) {
			delete casingsCommands[commandId];
			if (!Object.keys(casingsCommands).length) {
				delete this.casings[casing];
				break;
			}
		}
	}

	delete this.commandsById[commandId];
};

/*
 * Triggers are the aggregated results of the command map,
 * obtained by calling getAllCommandTriggers().
 */
 nuanria.CommandMap.Trigger = function(id, text, isFullText) {
 	this.id         = id;
 	this.trigger    = text;
 	this.isFullText = isFullText;
 }