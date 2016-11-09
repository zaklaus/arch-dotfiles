/*
 * This file is part of Adblock Plus <https://adblockplus.org/>,
 * Copyright (C) 2006-2016 Eyeo GmbH
 *
 * Adblock Plus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Adblock Plus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Adblock Plus.  If not, see <http://www.gnu.org/licenses/>.
 */

require.scopes["utils"] = (function()
{
  var exports = {};
  var Utils = exports.Utils = {
    systemPrincipal: null,
    getString: function(id)
    {
      if (typeof ext !== "undefined" && "i18n" in ext)
      {
        return ext.i18n.getMessage("global_" + id);
      }
      else
      {
        return id;
      }
    },
    runAsync: function(callback)
    {
      if (document.readyState == "loading")
      {
        var onDOMContentLoaded = function()
        {
          document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
          callback();
        };
        document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
      }
      else
      {
        setTimeout(callback, 0);
      }
    },
    get appLocale()
    {
      var locale = ext.i18n.getMessage("@@ui_locale").replace(/_/g, "-");
      Object.defineProperty(this, "appLocale",
      {
        value: locale,
        enumerable: true
      });
      return this.appLocale;
    },
    generateChecksum: function(lines)
    {
      return null;
    },
    makeURI: function(url)
    {
      return Services.io.newURI(url);
    },
    checkLocalePrefixMatch: function(prefixes)
    {
      if (!prefixes)
      {
        return null;
      }
      var list = prefixes.split(",");
      for (var i = 0; i < list.length; i++)
      {
        if ((new RegExp("^" + list[i] + "\\b")).test(this.appLocale))
        {
          return list[i];
        }
      }
      return null;
    },
    chooseFilterSubscription: function(subscriptions)
    {
      var selectedItem = null;
      var selectedPrefix = null;
      var matchCount = 0;
      for (var i = 0; i < subscriptions.length; i++)
      {
        var subscription = subscriptions[i];
        if (!selectedItem)
        {
          selectedItem = subscription;
        }
        var prefix = require("utils").Utils.checkLocalePrefixMatch(subscription.getAttribute("prefixes"));
        if (prefix)
        {
          if (!selectedPrefix || selectedPrefix.length < prefix.length)
          {
            selectedItem = subscription;
            selectedPrefix = prefix;
            matchCount = 1;
          }
          else if (selectedPrefix && selectedPrefix.length == prefix.length)
          {
            matchCount++;
            if (Math.random() * matchCount < 1)
            {
              selectedItem = subscription;
              selectedPrefix = prefix;
            }
          }
        }
      }
      return selectedItem;
    },
    getDocLink: function(linkID)
    {
      var Prefs = require("prefs").Prefs;
      var docLink = Prefs.documentation_link;
      return docLink.replace(/%LINK%/g, linkID).replace(/%LANG%/g, Utils.appLocale);
    },
    yield: function()
    {}
  };
  return exports;
})();

require.scopes["filterNotifier"] = (function()
{
  var exports = {};
  var listeners = [];
  var FilterNotifier = exports.FilterNotifier = {
    addListener: function(listener)
    {
      if (listeners.indexOf(listener) >= 0)
      {
        return;
      }
      listeners.push(listener);
    },
    removeListener: function(listener)
    {
      var index = listeners.indexOf(listener);
      if (index >= 0)
      {
        listeners.splice(index, 1);
      }
    },
    triggerListeners: function(action, item, param1, param2, param3)
    {
      var list = listeners.slice();
      for (var _loopIndex3 = 0; _loopIndex3 < list.length; ++_loopIndex3)
      {
        var listener = list[_loopIndex3];
        listener(action, item, param1, param2, param3);
      }
    }
  };
  return exports;
})();

require.scopes["filterClasses"] = (function()
{
  var exports = {};
  var FilterNotifier = require("filterNotifier").FilterNotifier;
  var Utils = require("utils").Utils;

  function Filter(text)
  {
    this.text = text;
    this.subscriptions = [];
  }
  exports.Filter = Filter;
  Filter.prototype = {
    text: null,
    subscriptions: null,
    get type()
    {
      throw new Error("Please define filter type in the subclass");
    },
    serialize: function(buffer)
    {
      buffer.push("[Filter]");
      buffer.push("text=" + this.text);
    },
    toString: function()
    {
      return this.text;
    }
  };
  Filter.knownFilters = Object.create(null);
  Filter.elemhideRegExp = /^([^\/\*\|\@"!]*?)#(\@)?(?:([\w\-]+|\*)((?:\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\))*)|#([^{}]+))$/;
  Filter.regexpRegExp = /^(@@)?\/.*\/(?:\$~?[\w\-]+(?:=[^,\s]+)?(?:,~?[\w\-]+(?:=[^,\s]+)?)*)?$/;
  Filter.optionsRegExp = /\$(~?[\w\-]+(?:=[^,\s]+)?(?:,~?[\w\-]+(?:=[^,\s]+)?)*)$/;
  Filter.csspropertyRegExp = /\[\-abp\-properties=(["'])([^"']+)\1\]/;
  Filter.fromText = function(text)
  {
    if (text in Filter.knownFilters)
    {
      return Filter.knownFilters[text];
    }
    var ret;
    var match = text.indexOf("#") >= 0 ? Filter.elemhideRegExp.exec(text) : null;
    if (match)
    {
      ret = ElemHideBase.fromText(text, match[1], !!match[2], match[3], match[4], match[5]);
    }
    else if (text[0] == "!")
    {
      ret = new CommentFilter(text);
    }
    else
    {
      ret = RegExpFilter.fromText(text);
    }
    Filter.knownFilters[ret.text] = ret;
    return ret;
  };
  Filter.fromObject = function(obj)
  {
    var ret = Filter.fromText(obj.text);
    if (ret instanceof ActiveFilter)
    {
      if ("disabled" in obj)
      {
        ret._disabled = obj.disabled == "true";
      }
      if ("hitCount" in obj)
      {
        ret._hitCount = parseInt(obj.hitCount) || 0;
      }
      if ("lastHit" in obj)
      {
        ret._lastHit = parseInt(obj.lastHit) || 0;
      }
    }
    return ret;
  };
  Filter.normalize = function(text)
  {
    if (!text)
    {
      return text;
    }
    text = text.replace(/[^\S ]/g, "");
    if (/^\s*!/.test(text))
    {
      return text.trim();
    }
    else if (Filter.elemhideRegExp.test(text))
    {
      var _tempVar4 = /^(.*?)(#\@?#?)(.*)$/.exec(text);
      var domain = _tempVar4[1];
      var separator = _tempVar4[2];
      var selector = _tempVar4[3];
      return domain.replace(/\s/g, "") + separator + selector.trim();
    }
    else
    {
      return text.replace(/\s/g, "");
    }
  };
  Filter.toRegExp = function(text)
  {
    return text.replace(/\*+/g, "*").replace(/\^\|$/, "^").replace(/\W/g, "\\$&").replace(/\\\*/g, ".*").replace(/\\\^/g, "(?:[\\x00-\\x24\\x26-\\x2C\\x2F\\x3A-\\x40\\x5B-\\x5E\\x60\\x7B-\\x7F]|$)").replace(/^\\\|\\\|/, "^[\\w\\-]+:\\/+(?!\\/)(?:[^\\/]+\\.)?").replace(/^\\\|/, "^").replace(/\\\|$/, "$").replace(/^(\.\*)/, "").replace(/(\.\*)$/, "");
  };

  function InvalidFilter(text, reason)
  {
    Filter.call(this, text);
    this.reason = reason;
  }
  exports.InvalidFilter = InvalidFilter;
  InvalidFilter.prototype = {
    __proto__: Filter.prototype,
    type: "invalid",
    reason: null,
    serialize: function(buffer)
    {}
  };

  function CommentFilter(text)
  {
    Filter.call(this, text);
  }
  exports.CommentFilter = CommentFilter;
  CommentFilter.prototype = {
    __proto__: Filter.prototype,
    type: "comment",
    serialize: function(buffer)
    {}
  };

  function ActiveFilter(text, domains)
  {
    Filter.call(this, text);
    this.domainSource = domains;
  }
  exports.ActiveFilter = ActiveFilter;
  ActiveFilter.prototype = {
    __proto__: Filter.prototype,
    _disabled: false,
    _hitCount: 0,
    _lastHit: 0,
    get disabled()
    {
      return this._disabled;
    },
    set disabled(value)
    {
      if (value != this._disabled)
      {
        var oldValue = this._disabled;
        this._disabled = value;
        FilterNotifier.triggerListeners("filter.disabled", this, value, oldValue);
      }
      return this._disabled;
    },
    get hitCount()
    {
      return this._hitCount;
    },
    set hitCount(value)
    {
      if (value != this._hitCount)
      {
        var oldValue = this._hitCount;
        this._hitCount = value;
        FilterNotifier.triggerListeners("filter.hitCount", this, value, oldValue);
      }
      return this._hitCount;
    },
    get lastHit()
    {
      return this._lastHit;
    },
    set lastHit(value)
    {
      if (value != this._lastHit)
      {
        var oldValue = this._lastHit;
        this._lastHit = value;
        FilterNotifier.triggerListeners("filter.lastHit", this, value, oldValue);
      }
      return this._lastHit;
    },
    domainSource: null,
    domainSeparator: null,
    ignoreTrailingDot: true,
    domainSourceIsUpperCase: false,
    get domains()
    {
      var prop = Object.getOwnPropertyDescriptor(this, "domains");
      if (prop)
      {
        return prop.value;
      }
      var domains = null;
      if (this.domainSource)
      {
        var source = this.domainSource;
        if (!this.domainSourceIsUpperCase)
        {
          source = source.toUpperCase();
        }
        var list = source.split(this.domainSeparator);
        if (list.length == 1 && list[0][0] != "~")
        {
          domains = {
            __proto__: null,
            "": false
          };
          if (this.ignoreTrailingDot)
          {
            list[0] = list[0].replace(/\.+$/, "");
          }
          domains[list[0]] = true;
        }
        else
        {
          var hasIncludes = false;
          for (var i = 0; i < list.length; i++)
          {
            var domain = list[i];
            if (this.ignoreTrailingDot)
            {
              domain = domain.replace(/\.+$/, "");
            }
            if (domain == "")
            {
              continue;
            }
            var include;
            if (domain[0] == "~")
            {
              include = false;
              domain = domain.substr(1);
            }
            else
            {
              include = true;
              hasIncludes = true;
            }
            if (!domains)
            {
              domains = Object.create(null);
            }
            domains[domain] = include;
          }
          domains[""] = !hasIncludes;
        }
        this.domainSource = null;
      }
      Object.defineProperty(this, "domains",
      {
        value: domains,
        enumerable: true
      });
      return this.domains;
    },
    sitekeys: null,
    isActiveOnDomain: function(docDomain, sitekey)
    {
      if (this.sitekeys && (!sitekey || this.sitekeys.indexOf(sitekey.toUpperCase()) < 0))
      {
        return false;
      }
      if (!this.domains)
      {
        return true;
      }
      if (!docDomain)
      {
        return this.domains[""];
      }
      if (this.ignoreTrailingDot)
      {
        docDomain = docDomain.replace(/\.+$/, "");
      }
      docDomain = docDomain.toUpperCase();
      while (true)
      {
        if (docDomain in this.domains)
        {
          return this.domains[docDomain];
        }
        var nextDot = docDomain.indexOf(".");
        if (nextDot < 0)
        {
          break;
        }
        docDomain = docDomain.substr(nextDot + 1);
      }
      return this.domains[""];
    },
    isActiveOnlyOnDomain: function(docDomain)
    {
      if (!docDomain || !this.domains || this.domains[""])
      {
        return false;
      }
      if (this.ignoreTrailingDot)
      {
        docDomain = docDomain.replace(/\.+$/, "");
      }
      docDomain = docDomain.toUpperCase();
      for (var domain in this.domains)
      {
        if (this.domains[domain] && domain != docDomain && (domain.length <= docDomain.length || domain.indexOf("." + docDomain) != domain.length - docDomain.length - 1))
        {
          return false;
        }
      }
      return true;
    },
    isGeneric: function()
    {
      return !(this.sitekeys && this.sitekeys.length) && (!this.domains || this.domains[""]);
    },
    serialize: function(buffer)
    {
      if (this._disabled || this._hitCount || this._lastHit)
      {
        Filter.prototype.serialize.call(this, buffer);
        if (this._disabled)
        {
          buffer.push("disabled=true");
        }
        if (this._hitCount)
        {
          buffer.push("hitCount=" + this._hitCount);
        }
        if (this._lastHit)
        {
          buffer.push("lastHit=" + this._lastHit);
        }
      }
    }
  };

  function RegExpFilter(text, regexpSource, contentType, matchCase, domains, thirdParty, sitekeys)
  {
    ActiveFilter.call(this, text, domains, sitekeys);
    if (contentType != null)
    {
      this.contentType = contentType;
    }
    if (matchCase)
    {
      this.matchCase = matchCase;
    }
    if (thirdParty != null)
    {
      this.thirdParty = thirdParty;
    }
    if (sitekeys != null)
    {
      this.sitekeySource = sitekeys;
    }
    if (regexpSource.length >= 2 && regexpSource[0] == "/" && regexpSource[regexpSource.length - 1] == "/")
    {
      var regexp = new RegExp(regexpSource.substr(1, regexpSource.length - 2), this.matchCase ? "" : "i");
      Object.defineProperty(this, "regexp",
      {
        value: regexp
      });
    }
    else
    {
      this.regexpSource = regexpSource;
    }
  }
  exports.RegExpFilter = RegExpFilter;
  RegExpFilter.prototype = {
    __proto__: ActiveFilter.prototype,
    domainSourceIsUpperCase: true,
    length: 1,
    domainSeparator: "|",
    regexpSource: null,
    get regexp()
    {
      var prop = Object.getOwnPropertyDescriptor(this, "regexp");
      if (prop)
      {
        return prop.value;
      }
      var source = Filter.toRegExp(this.regexpSource);
      var regexp = new RegExp(source, this.matchCase ? "" : "i");
      Object.defineProperty(this, "regexp",
      {
        value: regexp
      });
      return regexp;
    },
    contentType: 2147483647,
    matchCase: false,
    thirdParty: null,
    sitekeySource: null,
    get sitekeys()
    {
      var prop = Object.getOwnPropertyDescriptor(this, "sitekeys");
      if (prop)
      {
        return prop.value;
      }
      var sitekeys = null;
      if (this.sitekeySource)
      {
        sitekeys = this.sitekeySource.split("|");
        this.sitekeySource = null;
      }
      Object.defineProperty(this, "sitekeys",
      {
        value: sitekeys,
        enumerable: true
      });
      return this.sitekeys;
    },
    matches: function(location, typeMask, docDomain, thirdParty, sitekey)
    {
      if (this.contentType & typeMask && (this.thirdParty == null || this.thirdParty == thirdParty) && this.isActiveOnDomain(docDomain, sitekey) && this.regexp.test(location))
      {
        return true;
      }
      return false;
    }
  };
  Object.defineProperty(RegExpFilter.prototype, "0",
  {
    get: function()
    {
      return this;
    }
  });
  RegExpFilter.fromText = function(text)
  {
    var blocking = true;
    var origText = text;
    if (text.indexOf("@@") == 0)
    {
      blocking = false;
      text = text.substr(2);
    }
    var contentType = null;
    var matchCase = null;
    var domains = null;
    var sitekeys = null;
    var thirdParty = null;
    var collapse = null;
    var options;
    var match = text.indexOf("$") >= 0 ? Filter.optionsRegExp.exec(text) : null;
    if (match)
    {
      options = match[1].toUpperCase().split(",");
      text = match.input.substr(0, match.index);
      for (var _loopIndex5 = 0; _loopIndex5 < options.length; ++_loopIndex5)
      {
        var option = options[_loopIndex5];
        var value = null;
        var separatorIndex = option.indexOf("=");
        if (separatorIndex >= 0)
        {
          value = option.substr(separatorIndex + 1);
          option = option.substr(0, separatorIndex);
        }
        option = option.replace(/-/, "_");
        if (option in RegExpFilter.typeMap)
        {
          if (contentType == null)
          {
            contentType = 0;
          }
          contentType |= RegExpFilter.typeMap[option];
        }
        else if (option[0] == "~" && option.substr(1) in RegExpFilter.typeMap)
        {
          if (contentType == null)
          {
            contentType = RegExpFilter.prototype.contentType;
          }
          contentType &= ~RegExpFilter.typeMap[option.substr(1)];
        }
        else if (option == "MATCH_CASE")
        {
          matchCase = true;
        }
        else if (option == "~MATCH_CASE")
        {
          matchCase = false;
        }
        else if (option == "DOMAIN" && typeof value != "undefined")
        {
          domains = value;
        }
        else if (option == "THIRD_PARTY")
        {
          thirdParty = true;
        }
        else if (option == "~THIRD_PARTY")
        {
          thirdParty = false;
        }
        else if (option == "COLLAPSE")
        {
          collapse = true;
        }
        else if (option == "~COLLAPSE")
        {
          collapse = false;
        }
        else if (option == "SITEKEY" && typeof value != "undefined")
        {
          sitekeys = value;
        }
        else
        {
          return new InvalidFilter(origText, "Unknown option " + option.toLowerCase());
        }
      }
    }
    try
    {
      if (blocking)
      {
        return new BlockingFilter(origText, text, contentType, matchCase, domains, thirdParty, sitekeys, collapse);
      }
      else
      {
        return new WhitelistFilter(origText, text, contentType, matchCase, domains, thirdParty, sitekeys);
      }
    }
    catch (e)
    {
      return new InvalidFilter(origText, e);
    }
  };
  RegExpFilter.typeMap = {
    OTHER: 1,
    SCRIPT: 2,
    IMAGE: 4,
    STYLESHEET: 8,
    OBJECT: 16,
    SUBDOCUMENT: 32,
    DOCUMENT: 64,
    XBL: 1,
    PING: 1024,
    XMLHTTPREQUEST: 2048,
    OBJECT_SUBREQUEST: 4096,
    DTD: 1,
    MEDIA: 16384,
    FONT: 32768,
    BACKGROUND: 4,
    POPUP: 268435456,
    GENERICBLOCK: 536870912,
    ELEMHIDE: 1073741824,
    GENERICHIDE: 2147483648
  };
  RegExpFilter.prototype.contentType &= ~ (RegExpFilter.typeMap.DOCUMENT | RegExpFilter.typeMap.ELEMHIDE | RegExpFilter.typeMap.POPUP | RegExpFilter.typeMap.GENERICHIDE | RegExpFilter.typeMap.GENERICBLOCK);

  function BlockingFilter(text, regexpSource, contentType, matchCase, domains, thirdParty, sitekeys, collapse)
  {
    RegExpFilter.call(this, text, regexpSource, contentType, matchCase, domains, thirdParty, sitekeys);
    this.collapse = collapse;
  }
  exports.BlockingFilter = BlockingFilter;
  BlockingFilter.prototype = {
    __proto__: RegExpFilter.prototype,
    type: "blocking",
    collapse: null
  };

  function WhitelistFilter(text, regexpSource, contentType, matchCase, domains, thirdParty, sitekeys)
  {
    RegExpFilter.call(this, text, regexpSource, contentType, matchCase, domains, thirdParty, sitekeys);
  }
  exports.WhitelistFilter = WhitelistFilter;
  WhitelistFilter.prototype = {
    __proto__: RegExpFilter.prototype,
    type: "whitelist"
  };

  function ElemHideBase(text, domains, selector)
  {
    ActiveFilter.call(this, text, domains || null);
    if (domains)
    {
      this.selectorDomain = domains.replace(/,~[^,]+/g, "").replace(/^~[^,]+,?/, "").toLowerCase();
    }
    this.selector = selector;
  }
  exports.ElemHideBase = ElemHideBase;
  ElemHideBase.prototype = {
    __proto__: ActiveFilter.prototype,
    domainSeparator: ",",
    ignoreTrailingDot: false,
    selectorDomain: null,
    selector: null
  };
  ElemHideBase.fromText = function(text, domain, isException, tagName, attrRules, selector)
  {
    if (!selector)
    {
      if (tagName == "*")
      {
        tagName = "";
      }
      var id = null;
      var additional = "";
      if (attrRules)
      {
        attrRules = attrRules.match(/\([\w\-]+(?:[$^*]?=[^\(\)"]*)?\)/g);
        for (var _loopIndex6 = 0; _loopIndex6 < attrRules.length; ++_loopIndex6)
        {
          var rule = attrRules[_loopIndex6];
          rule = rule.substr(1, rule.length - 2);
          var separatorPos = rule.indexOf("=");
          if (separatorPos > 0)
          {
            rule = rule.replace(/=/, "=\"") + "\"";
            additional += "[" + rule + "]";
          }
          else
          {
            if (id)
            {
              return new InvalidFilter(text, Utils.getString("filter_elemhide_duplicate_id"));
            }
            id = rule;
          }
        }
      }
      if (id)
      {
        selector = tagName + "." + id + additional + "," + tagName + "#" + id + additional;
      }
      else if (tagName || additional)
      {
        selector = tagName + additional;
      }
      else
      {
        return new InvalidFilter(text, Utils.getString("filter_elemhide_nocriteria"));
      }
    }
    if (isException)
    {
      return new ElemHideException(text, domain, selector);
    }
    var match = Filter.csspropertyRegExp.exec(selector);
    if (match)
    {
      if (!/,[^~][^,.]*\.[^,]/.test("," + domain))
      {
        return new InvalidFilter(text, Utils.getString("filter_cssproperty_nodomain"));
      }
      return new CSSPropertyFilter(text, domain, selector, match[2], selector.substr(0, match.index), selector.substr(match.index + match[0].length));
    }
    return new ElemHideFilter(text, domain, selector);
  };

  function ElemHideFilter(text, domains, selector)
  {
    ElemHideBase.call(this, text, domains, selector);
  }
  exports.ElemHideFilter = ElemHideFilter;
  ElemHideFilter.prototype = {
    __proto__: ElemHideBase.prototype,
    type: "elemhide"
  };

  function ElemHideException(text, domains, selector)
  {
    ElemHideBase.call(this, text, domains, selector);
  }
  exports.ElemHideException = ElemHideException;
  ElemHideException.prototype = {
    __proto__: ElemHideBase.prototype,
    type: "elemhideexception"
  };

  function CSSPropertyFilter(text, domains, selector, regexpSource, selectorPrefix, selectorSuffix)
  {
    ElemHideBase.call(this, text, domains, selector);
    this.regexpSource = regexpSource;
    this.selectorPrefix = selectorPrefix;
    this.selectorSuffix = selectorSuffix;
  }
  exports.CSSPropertyFilter = CSSPropertyFilter;
  CSSPropertyFilter.prototype = {
    __proto__: ElemHideBase.prototype,
    type: "cssproperty",
    regexpSource: null,
    selectorPrefix: null,
    selectorSuffix: null,
    get regexpString()
    {
      var prop = Object.getOwnPropertyDescriptor(this, "regexpString");
      if (prop)
      {
        return prop.value;
      }
      var regexp = Filter.toRegExp(this.regexpSource);
      Object.defineProperty(this, "regexpString",
      {
        value: regexp
      });
      return regexp;
    }
  };
  return exports;
})();

require.scopes["filterValidation"] = (function()
{
  var exports = {};
  var _tempVar52 = require("filterClasses");
  var Filter = _tempVar52.Filter;
  var InvalidFilter = _tempVar52.InvalidFilter;
  var ElemHideBase = _tempVar52.ElemHideBase;

  function FilterParsingError(type, details)
  {
    this.type = type;
    if (details)
    {
      if ("reason" in details)
      {
        this.reason = details.reason;
      }
      if ("selector" in details)
      {
        this.selector = details.selector;
      }
    }
  }
  FilterParsingError.prototype = {
    lineno: null,
    toString: function()
    {
      var message = this.reason || ext.i18n.getMessage(this.type.replace(/-/g, "_"), "selector" in this ? "'" + this.selector + "'" : null);
      if (this.lineno)
      {
        message = ext.i18n.getMessage("line", this.lineno.toLocaleString()) + ": " + message;
      }
      return message;
    }
  };

  function isValidCSSSelector(selector)
  {
    var style = document.createElement("style");
    document.documentElement.appendChild(style);
    var sheet = style.sheet;
    document.documentElement.removeChild(style);
    try
    {
      document.querySelector(selector);
      sheet.insertRule(selector + "{}", 0);
    }
    catch (e)
    {
      return false;
    }
    return true;
  }
  var parseFilter = exports.parseFilter = function(text)
  {
    var filter = null;
    text = Filter.normalize(text);
    if (text)
    {
      if (text[0] == "[")
      {
        return {
          error: new FilterParsingError("unexpected-filter-list-header")
        };
      }
      filter = Filter.fromText(text);
      if (filter instanceof InvalidFilter)
      {
        return {
          error: new FilterParsingError("invalid-filter",
          {
            reason: filter.reason
          })
        };
      }
      if (filter instanceof ElemHideBase && !isValidCSSSelector(filter.selector))
      {
        return {
          error: new FilterParsingError("invalid-css-selector",
          {
            selector: filter.selector
          })
        };
      }
    }
    return {
      filter: filter
    };
  };
  exports.parseFilters = function(text)
  {
    var lines = text.split("\n");
    var filters = [];
    var errors = [];
    for (var i = 0; i < lines.length; i++)
    {
      var _tempVar53 = parseFilter(lines[i]);
      var filter = _tempVar53.filter;
      var error = _tempVar53.error;
      if (filter)
      {
        filters.push(filter);
      }
      if (error)
      {
        error.lineno = i + 1;
        errors.push(error);
      }
    }
    return {
      filters: filters,
      errors: errors
    };
  };
  return exports;
})();

require.scopes["matcher"] = (function()
{
  var exports = {};
  var _tempVar22 = require("filterClasses");
  var Filter = _tempVar22.Filter;
  var RegExpFilter = _tempVar22.RegExpFilter;
  var WhitelistFilter = _tempVar22.WhitelistFilter;

  function Matcher()
  {
    this.clear();
  }
  exports.Matcher = Matcher;
  Matcher.prototype = {
    filterByKeyword: null,
    keywordByFilter: null,
    clear: function()
    {
      this.filterByKeyword = Object.create(null);
      this.keywordByFilter = Object.create(null);
    },
    add: function(filter)
    {
      if (filter.text in this.keywordByFilter)
      {
        return;
      }
      var keyword = this.findKeyword(filter);
      var oldEntry = this.filterByKeyword[keyword];
      if (typeof oldEntry == "undefined")
      {
        this.filterByKeyword[keyword] = filter;
      }
      else if (oldEntry.length == 1)
      {
        this.filterByKeyword[keyword] = [oldEntry, filter];
      }
      else
      {
        oldEntry.push(filter);
      }
      this.keywordByFilter[filter.text] = keyword;
    },
    remove: function(filter)
    {
      if (!(filter.text in this.keywordByFilter))
      {
        return;
      }
      var keyword = this.keywordByFilter[filter.text];
      var list = this.filterByKeyword[keyword];
      if (list.length <= 1)
      {
        delete this.filterByKeyword[keyword];
      }
      else
      {
        var index = list.indexOf(filter);
        if (index >= 0)
        {
          list.splice(index, 1);
          if (list.length == 1)
          {
            this.filterByKeyword[keyword] = list[0];
          }
        }
      }
      delete this.keywordByFilter[filter.text];
    },
    findKeyword: function(filter)
    {
      var result = "";
      var text = filter.text;
      if (Filter.regexpRegExp.test(text))
      {
        return result;
      }
      var match = Filter.optionsRegExp.exec(text);
      if (match)
      {
        text = match.input.substr(0, match.index);
      }
      if (text.substr(0, 2) == "@@")
      {
        text = text.substr(2);
      }
      var candidates = text.toLowerCase().match(/[^a-z0-9%*][a-z0-9%]{3,}(?=[^a-z0-9%*])/g);
      if (!candidates)
      {
        return result;
      }
      var hash = this.filterByKeyword;
      var resultCount = 16777215;
      var resultLength = 0;
      for (var i = 0, l = candidates.length; i < l; i++)
      {
        var candidate = candidates[i].substr(1);
        var count = candidate in hash ? hash[candidate].length : 0;
        if (count < resultCount || count == resultCount && candidate.length > resultLength)
        {
          result = candidate;
          resultCount = count;
          resultLength = candidate.length;
        }
      }
      return result;
    },
    hasFilter: function(filter)
    {
      return filter.text in this.keywordByFilter;
    },
    getKeywordForFilter: function(filter)
    {
      if (filter.text in this.keywordByFilter)
      {
        return this.keywordByFilter[filter.text];
      }
      else
      {
        return null;
      }
    },
    _checkEntryMatch: function(keyword, location, typeMask, docDomain, thirdParty, sitekey, specificOnly)
    {
      var list = this.filterByKeyword[keyword];
      for (var i = 0; i < list.length; i++)
      {
        var filter = list[i];
        if (specificOnly && filter.isGeneric() && !(filter instanceof WhitelistFilter))
        {
          continue;
        }
        if (filter.matches(location, typeMask, docDomain, thirdParty, sitekey))
        {
          return filter;
        }
      }
      return null;
    },
    matchesAny: function(location, typeMask, docDomain, thirdParty, sitekey, specificOnly)
    {
      var candidates = location.toLowerCase().match(/[a-z0-9%]{3,}/g);
      if (candidates === null)
      {
        candidates = [];
      }
      candidates.push("");
      for (var i = 0, l = candidates.length; i < l; i++)
      {
        var substr = candidates[i];
        if (substr in this.filterByKeyword)
        {
          var result = this._checkEntryMatch(substr, location, typeMask, docDomain, thirdParty, sitekey, specificOnly);
          if (result)
          {
            return result;
          }
        }
      }
      return null;
    }
  };

  function CombinedMatcher()
  {
    this.blacklist = new Matcher();
    this.whitelist = new Matcher();
    this.resultCache = Object.create(null);
  }
  exports.CombinedMatcher = CombinedMatcher;
  CombinedMatcher.maxCacheEntries = 1000;
  CombinedMatcher.prototype = {
    blacklist: null,
    whitelist: null,
    resultCache: null,
    cacheEntries: 0,
    clear: function()
    {
      this.blacklist.clear();
      this.whitelist.clear();
      this.resultCache = Object.create(null);
      this.cacheEntries = 0;
    },
    add: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        this.whitelist.add(filter);
      }
      else
      {
        this.blacklist.add(filter);
      }
      if (this.cacheEntries > 0)
      {
        this.resultCache = Object.create(null);
        this.cacheEntries = 0;
      }
    },
    remove: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        this.whitelist.remove(filter);
      }
      else
      {
        this.blacklist.remove(filter);
      }
      if (this.cacheEntries > 0)
      {
        this.resultCache = Object.create(null);
        this.cacheEntries = 0;
      }
    },
    findKeyword: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        return this.whitelist.findKeyword(filter);
      }
      else
      {
        return this.blacklist.findKeyword(filter);
      }
    },
    hasFilter: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        return this.whitelist.hasFilter(filter);
      }
      else
      {
        return this.blacklist.hasFilter(filter);
      }
    },
    getKeywordForFilter: function(filter)
    {
      if (filter instanceof WhitelistFilter)
      {
        return this.whitelist.getKeywordForFilter(filter);
      }
      else
      {
        return this.blacklist.getKeywordForFilter(filter);
      }
    },
    isSlowFilter: function(filter)
    {
      var matcher = filter instanceof WhitelistFilter ? this.whitelist : this.blacklist;
      if (matcher.hasFilter(filter))
      {
        return !matcher.getKeywordForFilter(filter);
      }
      else
      {
        return !matcher.findKeyword(filter);
      }
    },
    matchesAnyInternal: function(location, typeMask, docDomain, thirdParty, sitekey, specificOnly)
    {
      var candidates = location.toLowerCase().match(/[a-z0-9%]{3,}/g);
      if (candidates === null)
      {
        candidates = [];
      }
      candidates.push("");
      var blacklistHit = null;
      for (var i = 0, l = candidates.length; i < l; i++)
      {
        var substr = candidates[i];
        if (substr in this.whitelist.filterByKeyword)
        {
          var result = this.whitelist._checkEntryMatch(substr, location, typeMask, docDomain, thirdParty, sitekey);
          if (result)
          {
            return result;
          }
        }
        if (substr in this.blacklist.filterByKeyword && blacklistHit === null)
        {
          blacklistHit = this.blacklist._checkEntryMatch(substr, location, typeMask, docDomain, thirdParty, sitekey, specificOnly);
        }
      }
      return blacklistHit;
    },
    matchesAny: function(location, typeMask, docDomain, thirdParty, sitekey, specificOnly)
    {
      var key = location + " " + typeMask + " " + docDomain + " " + thirdParty + " " + sitekey + " " + specificOnly;
      if (key in this.resultCache)
      {
        return this.resultCache[key];
      }
      var result = this.matchesAnyInternal(location, typeMask, docDomain, thirdParty, sitekey, specificOnly);
      if (this.cacheEntries >= CombinedMatcher.maxCacheEntries)
      {
        this.resultCache = Object.create(null);
        this.cacheEntries = 0;
      }
      this.resultCache[key] = result;
      this.cacheEntries++;
      return result;
    }
  };
  var defaultMatcher = exports.defaultMatcher = new CombinedMatcher();
  return exports;
})();

require.scopes["url"] = (function()
{
  var exports = {};
  var getDecodedHostname = exports.getDecodedHostname = function(url)
  {
    var hostname = url.hostname;
    if (hostname.indexOf("xn--") == -1)
    {
      return hostname;
    }
    return punycode.toUnicode(hostname);
  };
  exports.extractHostFromFrame = function(frame)
  {
    for (; frame; frame = frame.parent)
    {
      var hostname = getDecodedHostname(frame.url);
      if (hostname)
      {
        return hostname;
      }
    }
    return "";
  };
  exports.stringifyURL = function(url)
  {
    var protocol = url.protocol;
    var href = url.href;
    if (protocol == "http:" || protocol == "https:")
    {
      var hostname = url.hostname;
      if (hostname.indexOf("xn--") != -1)
      {
        href = href.replace(hostname, punycode.toUnicode(hostname));
      }
      var hash = href.indexOf("#");
      if (hash != -1)
      {
        href = href.substr(0, hash);
      }
    }
    return href;
  };

  function isDomain(hostname)
  {
    if (/^((0x[\da-f]+|\d+)(\.|$))*$/i.test(hostname))
    {
      return false;
    }
    return hostname.indexOf(":") == -1;
  }

  function getBaseDomain(hostname)
  {
    var bits = hostname.split(".");
    var cutoff = bits.length - 2;
    for (var i = 0; i < bits.length; i++)
    {
      var offset = publicSuffixes[bits.slice(i).join(".")];
      if (typeof offset != "undefined")
      {
        cutoff = i - offset;
        break;
      }
    }
    if (cutoff <= 0)
    {
      return hostname;
    }
    return bits.slice(cutoff).join(".");
  }
  exports.isThirdParty = function(url, documentHost)
  {
    var requestHost = getDecodedHostname(url).replace(/\.+$/, "");
    documentHost = documentHost.replace(/\.+$/, "");
    if (requestHost == documentHost)
    {
      return false;
    }
    if (!isDomain(requestHost) || !isDomain(documentHost))
    {
      return true;
    }
    return getBaseDomain(requestHost) != getBaseDomain(documentHost);
  };
  return exports;
})();
