////////////////////////////////////////////////////////////////////////////////
//
//  @file       nuanria.Events.js
//  @details    This class is used as a mechanism for dispatching and receiving
//              events (i.e. observer pattern).
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

nuanria.Events = function(context) {
    "use strict";

    ///////////////////////////////////////////////////////////////////////////

    this.add            = add;
    this.remove         = remove;
    this.notify         = notify;
    this.notifyAsync    = notifyAsync;

    ///////////////////////////////////////////////////////////////////////////

    var handlers = {};

    if (context === undefined) {
        context = {};
    }

    function add(action, handler) {
        if (!handlers[action]) {
            handlers[action] = [];
        }

        handlers[action].push(handler);
    }

    function remove(action, handler) {
        var actionHandlers = handlers[action];

        if (!actionHandlers) {
            return;
        }

        for (var i = 0; i < actionHandlers.length; i++) {
            if (actionHandlers[i] === handler) {
                actionHandlers.splice(i, 1);
            }
        }
    }

    function notify(action) {
        // call all handlers for the action syncronously

        var actionHandlers = handlers[action];
        var notificationArgs = [].splice.call(arguments,1);

        if (!actionHandlers) {
            return;
        }

        for (var i = 0; i < actionHandlers.length; i++) {
            actionHandlers[i].apply(context, notificationArgs); // invoke handler
        }
    }

    function notifyAsync(action) {
        // call all handlers for the action asyncronously

        var actionHandlers = handlers[action];
        var notificationArgs = [].splice.call(arguments,1);

        if (!actionHandlers) {
            return;
        }

        for (var i = 0; i < actionHandlers.length; i++) {
            // schedule handler on timeout queue
            callHandlerAsync(actionHandlers[i], context, notificationArgs);
        }
    }

    function callHandlerAsync(handler, cotext, args) {
        setTimeout(function() {
            handler.apply(context, args);
        },0);
    }
};