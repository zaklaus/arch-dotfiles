////////////////////////////////////////////////////////////////////////////////
//
//	@file		nuanria.DomParser.js
//	@details	Rule based parser for traversing DOM subtrees
//
//	@author		Chris Hardy
//	@date		9-Dec-2013
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

//-------------------------------------------------------------------------
// DomParser

nuanria.DomParser_STOP          = 1;
nuanria.DomParser_SKIP_CHILDREN = 2;

nuanria.DomParser = function(rules) {

    this.parse = function(context) {
        var i, retVal, skipChildren;

        context.rules = rules;
        context.push(context.root); // root node
        while (context.stack.length) {

            // process next node
            context.node = context.pop();
            context.phase = true;
//console.log(nuanria.utils.lpad('', context.ancestors.length*2, ' ') + "<" + context.getNodeType() + ">");
            retVal = rules.apply(context);
            if (retVal & nuanria.DomParser_STOP) {
                break;
            }

            skipChildren = retVal & nuanria.DomParser_SKIP_CHILDREN;
            context.ancestors.push(context.node);
            context.ancestorSiblingIndexes.push(context.siblingIndex);

            if (!skipChildren && context.getNodeType() == "#text" &&
                context.node.textContent.length)
            {
                // push each character as an individual node
                for (i = context.node.textContent.length-1; i >= 0; i--) {
                    context.push(context.node.textContent[i], i);
                }

            } else if (!skipChildren && context.node && context.node.childNodes && context.node.childNodes.length) {
                // push child items onto stack
                for (i = context.node.childNodes.length-1; i >= 0; i--) {
                    context.push(context.node.childNodes[i], i);
                }

            } else {
                // close processed node(s)
                do {
                    context.node = context.ancestors.pop();
                    context.siblingIndex = context.ancestorSiblingIndexes.pop();
                    context.phase = false;
                    rules.apply(context);
//console.log(nuanria.utils.lpad('', context.ancestors.length*2, ' ') + "</" + context.getNodeType() + ">");
                    var nextNode = context.getNextNode();
                    var nextNodeType = context.getNextNodeType();
                    var nextNodeParent = nextNode ? nextNode.parentNode : null;
                    var parentNode = context.getParentNode();
                } while (!(nextNodeType == "CHAR" || nextNodeParent == parentNode));
            }
        }

        return context.output;
    }
};


//-------------------------------------------------------------------------
// Parse Context

nuanria.DomParser.Context = function(root, input, output) {
    this.rules                  = null;
    this.root                   = root;
    this.input                  = input;
    this.output                 = output;
    this.stack                  = [];
    this.siblingIndexStack      = [];
    this.ancestors              = [];
    this.ancestorSiblingIndexes = [];
    this.phase                  = false;
    this.node                   = null;
    this.siblingIndex           = 0;

    this.push = function(node, siblingIndex) {
        this.siblingIndexStack.push(siblingIndex || 0);
        this.stack.push(node);
    };

    this.pop = function() {
        this.siblingIndex = this.siblingIndexStack.pop();
        return this.stack.pop();
    };

    this.getNodeType = function() {
        if (this.node == root) {
            return "ROOT";
        } else {
            return getTypeForNode(this.node);
        }
    };

    this.getParentNode = function() {
        return this.ancestors.length > 0 ?
                this.ancestors[this.ancestors.length-1] :
                null;
    };

    this.getNextNode = function() {
        if (!this.stack.length) {
            return null;
        } else {
            return this.stack[this.stack.length-1];
        }
    };

    this.getNextNodeType = function() {
        return getTypeForNode(this.getNextNode());
    };

    this.getRootNode = function() {
        if (this.ancestors.length > 0) {
            return this.ancestors[0];
        } else {
            return this.node;
        }
    }

    function getTypeForNode(node) {
        if (typeof node == "string") {
            return "CHAR";
        } else if (node) {
            return node.nodeName;
        } else {
            return "";
        }
    }
};


//-------------------------------------------------------------------------
// Rules class

nuanria.DomParser.ParseRules = function() {
    var validTypesMap = {};
    var filterGroups  = {};
    var rules         = [];

    this.addValidTypes = function(validTypes) {
        for (var i = 0; i < validTypes.length; i++) {
            validTypesMap[validTypes[i]] = true;
        }
    }

    this.addFilterGroup = function(groupName, items) {
        // items can be either a node name, or an existing filter group

        var expandedItemsMap = {};

        for (var itemsIx = 0; itemsIx < items.length; itemsIx++) {
            var item = items[itemsIx];
            if (filterGroups[item]) {
                // item is an existing filter group, include all items
                // of that group
                var filterItems = filterGroups[item];
                for (var filterItemsIx = 0; filterItemsIx < filterItems.length; filterItemsIx++) {
                    var filterItem = filterItems[filterItemsIx];
                    expandedItemsMap[filterItem] = true;
                }
            } else {
                // item is a base type
                if (!validTypesMap[item]) {
                    throw new Error("Item " + item + " is not a valid type");
                }
                expandedItemsMap[item] = true;
            }
        }
        filterGroups[groupName] = Object.keys(expandedItemsMap);
    }

    this.add = function(name, phase, filter, ruleFunction) {
        rules.push(new nuanria.DomParser.ParseRule(name, phase, filter, ruleFunction));
    }

    this.apply = function(context) {

        var nodeType = context.getNodeType();
        var validNode = validTypesMap[nodeType];
        if (!validNode) {
            nodeType = "LUMP";
        }

        var retVal = 0;
        for (var i = 0; i < rules.length; i++) {
            var rule = rules[i];

            if (rule.phase == context.phase &&
                this.typeMatches(nodeType, rule.filter))
            {
                if (rule.ruleFunction) {
                    retVal = retVal | rule.ruleFunction.call(context);
                    if (retVal & nuanria.DomParser_STOP) {
                        return nuanria.DomParser_STOP;
                    }
                }
            }
        }
        return retVal;
    }

    this.typeMatches = function(type, filter) {
        if (filter == "*") {
            return true;
        }

        if (filter == "LUMP") {
            return !validTypesMap[type];
        }

        var types = filterGroups[filter];
        if (!types) {
            types = [filter];
        }

        for (var i = 0; i < types.length; i++) {
            if (types[i].trim() == type) {
                return true;
            }
        }

        return false;
    }
};


//-------------------------------------------------------------------------
// ParseRule class

nuanria.DomParser.ParseRule = function(name, phase, filter, ruleFunction) {
    this.name          = name;
    this.phase         = phase;
    this.filter        = filter;
    this.ruleFunction  = ruleFunction;
};