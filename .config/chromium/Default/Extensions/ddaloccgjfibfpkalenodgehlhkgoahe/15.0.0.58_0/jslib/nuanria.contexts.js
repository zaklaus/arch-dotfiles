////////////////////////////////////////////////////////////////////////////////
//
//	@file		nuanria.contexts.js
//	@details	RIA context definitions.
//              This file defines the types of edit controls that RIA supports
//              and how RIA should handle them.
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

nuanria.contexts = {
	"rich-text-input" : {
		"id"                : "rich-text-input",
		"description"       : "Rich Text Input",
		"editor"            : function(){ return nuanria.contenteditable; }
	},

	"plain-text-input" : {
		"id"                : "plain-text-input",
		"description"       : "Plain Text Input",
		"editor"            : function(){ return nuanria.plaintext; }
	},

	/*"google-docs" : {
		"id"                : "google-docs",
		"description"       : "Google Docs Editor",
		"editor"            : function(){ return nuanria.googledocs; },
	},*/

	"nat-text" : {
		"id"                : "nat-text",
		"description"       : "Nat Text",
		"editor"            : function(){ return nuanria.nattext; },
	}
};