////////////////////////////////////////////////////////////////////////////////
//
//	@file		nuanria.nattext.js
//	@details	NatText overrides for web dictation
//
//	@author		Chris Hardy
//	@date		Apr-8-2014
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
nuanria.nattext = nuanria.nattext || {};

/*
 * Indicates that NatText should be active for this editor
 */
nuanria.nattext.getNatText = function() {
	return true;
}

/*
 * Returns an array of nattext editors on the page
 */
nuanria.nattext.getAll = function() {
	var selectors = [
		".kix-appview-editor",      		// Google Docs
		"#WACViewPanel"						// Word Web App
	];

	return document.querySelectorAll(selectors);
};

/*
 * Returns an active nattext editor
 */
nuanria.nattext.getActive = function() {
	var editor = document.querySelector(".kix-appview-editor");
	if (editor &&
		document.activeElement == document.querySelector(".docs-texteventtarget-iframe"))
	{
		return editor;
	}

	editor = document.querySelector("#WACViewPanel");
    // Fix for TTP32433 - Word Online: Impossible to dictate in a document (Microsoft changed the editable div name)
	if (editor &&
		//document.activeElement.id == "WACViewPanel_EditingFrame")  // This was the old name of the editable div
	    document.activeElement.id == "WACViewPanel_EditingElement")
	{
		return editor;
	}

	return null;
};

/*
 * Returns contents and information about the active editor
 */
nuanria.nattext.getChanges = function() {
	// handled by NatText

	throw new Error("Not implemented");
}

/*
 * Changes text and/or selection of the active rich text editor
 */
nuanria.nattext.makeChanges = function(blockStart, blockLength, text, selStart, selLength) {
	// handled by NatText

	throw new Error("Not implemented");
}

/*
 * Returns screen coordinates of a character relative to the editor's document
 */
nuanria.nattext.getCharacterRectangle = function(index) {
	// handled by NatText

	throw new Error("Not implemented");
};