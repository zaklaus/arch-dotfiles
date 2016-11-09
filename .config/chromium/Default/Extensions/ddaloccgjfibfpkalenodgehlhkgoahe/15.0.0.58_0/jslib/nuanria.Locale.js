////////////////////////////////////////////////////////////////////////////////
//
//	@file		nuanria.Locale.js
//	@details	RIA localization data.
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

/*
 * Class has default localization strings
 */
nuanria.Locale = function() {
	this.reset();
};

/*
 * Reset locale with default strings
 */
nuanria.Locale.prototype.reset = function() {
	this.langId = "default";
	this.strings = {
		"cancel"       : "{cancel|hide numbers}",
		"choose %1"    : "choose %1",
		"click %1"     : "click %1",
		"show links"   : "{show links|show site commands|show site commands}",
		"text link"    : "text link",
		"button"       : "button",
		"image"        : "image",
		"edit box"     : "edit box",
		"text field"   : "text field",
		"type text"    : "type text",
		"radio button" : "radio button",
		"check box"    : "check box",
		"list box"     : "list box",
 	};
};

/*
 * Gets the translation for a certain string
 */
nuanria.Locale.prototype.getString = function(string) {
	var retVal = this.strings[string];
	if (!retVal) {
		retVal = string;
	}
	return retVal;
};

/*
 * Merge localization strings into this object
 */
nuanria.Locale.prototype.merge = function(langId, localStrings) {
	this.langId = langId;

	for (var string in localStrings) {
		if (!this.strings[string]) {
			continue;
		}
		this.strings[string] = localStrings[string];
	}
};