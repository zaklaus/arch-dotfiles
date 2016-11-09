(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* The following list is defined in React's core */
var IS_UNITLESS = {
  animationIterationCount: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridRow: true,
  gridColumn: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,

  // SVG-related properties
  fillOpacity: true,
  stopOpacity: true,
  strokeDashoffset: true,
  strokeOpacity: true,
  strokeWidth: true
};

module.exports = function(name, value) {
  if(typeof value === 'number' && !IS_UNITLESS[ name ]) {
    return value + 'px';
  } else {
    return value;
  }
};
},{}],2:[function(require,module,exports){
/*!
 * Bowser - a browser detector
 * https://github.com/ded/bowser
 * MIT License | (c) Dustin Diaz 2015
 */

!function (name, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else if (typeof define == 'function' && define.amd) define(definition)
  else this[name] = definition()
}('bowser', function () {
  /**
    * See useragents.js for examples of navigator.userAgent
    */

  var t = true

  function detect(ua) {

    function getFirstMatch(regex) {
      var match = ua.match(regex);
      return (match && match.length > 1 && match[1]) || '';
    }

    function getSecondMatch(regex) {
      var match = ua.match(regex);
      return (match && match.length > 1 && match[2]) || '';
    }

    var iosdevice = getFirstMatch(/(ipod|iphone|ipad)/i).toLowerCase()
      , likeAndroid = /like android/i.test(ua)
      , android = !likeAndroid && /android/i.test(ua)
      , nexusMobile = /nexus\s*[0-6]\s*/i.test(ua)
      , nexusTablet = !nexusMobile && /nexus\s*[0-9]+/i.test(ua)
      , chromeos = /CrOS/.test(ua)
      , silk = /silk/i.test(ua)
      , sailfish = /sailfish/i.test(ua)
      , tizen = /tizen/i.test(ua)
      , webos = /(web|hpw)os/i.test(ua)
      , windowsphone = /windows phone/i.test(ua)
      , windows = !windowsphone && /windows/i.test(ua)
      , mac = !iosdevice && !silk && /macintosh/i.test(ua)
      , linux = !android && !sailfish && !tizen && !webos && /linux/i.test(ua)
      , edgeVersion = getFirstMatch(/edge\/(\d+(\.\d+)?)/i)
      , versionIdentifier = getFirstMatch(/version\/(\d+(\.\d+)?)/i)
      , tablet = /tablet/i.test(ua)
      , mobile = !tablet && /[^-]mobi/i.test(ua)
      , xbox = /xbox/i.test(ua)
      , result

    if (/opera|opr|opios/i.test(ua)) {
      result = {
        name: 'Opera'
      , opera: t
      , version: versionIdentifier || getFirstMatch(/(?:opera|opr|opios)[\s\/](\d+(\.\d+)?)/i)
      }
    }
    else if (/coast/i.test(ua)) {
      result = {
        name: 'Opera Coast'
        , coast: t
        , version: versionIdentifier || getFirstMatch(/(?:coast)[\s\/](\d+(\.\d+)?)/i)
      }
    }
    else if (/yabrowser/i.test(ua)) {
      result = {
        name: 'Yandex Browser'
      , yandexbrowser: t
      , version: versionIdentifier || getFirstMatch(/(?:yabrowser)[\s\/](\d+(\.\d+)?)/i)
      }
    }
    else if (/ucbrowser/i.test(ua)) {
      result = {
          name: 'UC Browser'
        , ucbrowser: t
        , version: getFirstMatch(/(?:ucbrowser)[\s\/](\d+(?:\.\d+)+)/i)
      }
    }
    else if (/mxios/i.test(ua)) {
      result = {
        name: 'Maxthon'
        , maxthon: t
        , version: getFirstMatch(/(?:mxios)[\s\/](\d+(?:\.\d+)+)/i)
      }
    }
    else if (/epiphany/i.test(ua)) {
      result = {
        name: 'Epiphany'
        , epiphany: t
        , version: getFirstMatch(/(?:epiphany)[\s\/](\d+(?:\.\d+)+)/i)
      }
    }
    else if (/puffin/i.test(ua)) {
      result = {
        name: 'Puffin'
        , puffin: t
        , version: getFirstMatch(/(?:puffin)[\s\/](\d+(?:\.\d+)?)/i)
      }
    }
    else if (/sleipnir/i.test(ua)) {
      result = {
        name: 'Sleipnir'
        , sleipnir: t
        , version: getFirstMatch(/(?:sleipnir)[\s\/](\d+(?:\.\d+)+)/i)
      }
    }
    else if (/k-meleon/i.test(ua)) {
      result = {
        name: 'K-Meleon'
        , kMeleon: t
        , version: getFirstMatch(/(?:k-meleon)[\s\/](\d+(?:\.\d+)+)/i)
      }
    }
    else if (windowsphone) {
      result = {
        name: 'Windows Phone'
      , windowsphone: t
      }
      if (edgeVersion) {
        result.msedge = t
        result.version = edgeVersion
      }
      else {
        result.msie = t
        result.version = getFirstMatch(/iemobile\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/msie|trident/i.test(ua)) {
      result = {
        name: 'Internet Explorer'
      , msie: t
      , version: getFirstMatch(/(?:msie |rv:)(\d+(\.\d+)?)/i)
      }
    } else if (chromeos) {
      result = {
        name: 'Chrome'
      , chromeos: t
      , chromeBook: t
      , chrome: t
      , version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
      }
    } else if (/chrome.+? edge/i.test(ua)) {
      result = {
        name: 'Microsoft Edge'
      , msedge: t
      , version: edgeVersion
      }
    }
    else if (/vivaldi/i.test(ua)) {
      result = {
        name: 'Vivaldi'
        , vivaldi: t
        , version: getFirstMatch(/vivaldi\/(\d+(\.\d+)?)/i) || versionIdentifier
      }
    }
    else if (sailfish) {
      result = {
        name: 'Sailfish'
      , sailfish: t
      , version: getFirstMatch(/sailfish\s?browser\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/seamonkey\//i.test(ua)) {
      result = {
        name: 'SeaMonkey'
      , seamonkey: t
      , version: getFirstMatch(/seamonkey\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/firefox|iceweasel|fxios/i.test(ua)) {
      result = {
        name: 'Firefox'
      , firefox: t
      , version: getFirstMatch(/(?:firefox|iceweasel|fxios)[ \/](\d+(\.\d+)?)/i)
      }
      if (/\((mobile|tablet);[^\)]*rv:[\d\.]+\)/i.test(ua)) {
        result.firefoxos = t
      }
    }
    else if (silk) {
      result =  {
        name: 'Amazon Silk'
      , silk: t
      , version : getFirstMatch(/silk\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/phantom/i.test(ua)) {
      result = {
        name: 'PhantomJS'
      , phantom: t
      , version: getFirstMatch(/phantomjs\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/slimerjs/i.test(ua)) {
      result = {
        name: 'SlimerJS'
        , slimer: t
        , version: getFirstMatch(/slimerjs\/(\d+(\.\d+)?)/i)
      }
    }
    else if (/blackberry|\bbb\d+/i.test(ua) || /rim\stablet/i.test(ua)) {
      result = {
        name: 'BlackBerry'
      , blackberry: t
      , version: versionIdentifier || getFirstMatch(/blackberry[\d]+\/(\d+(\.\d+)?)/i)
      }
    }
    else if (webos) {
      result = {
        name: 'WebOS'
      , webos: t
      , version: versionIdentifier || getFirstMatch(/w(?:eb)?osbrowser\/(\d+(\.\d+)?)/i)
      };
      /touchpad\//i.test(ua) && (result.touchpad = t)
    }
    else if (/bada/i.test(ua)) {
      result = {
        name: 'Bada'
      , bada: t
      , version: getFirstMatch(/dolfin\/(\d+(\.\d+)?)/i)
      };
    }
    else if (tizen) {
      result = {
        name: 'Tizen'
      , tizen: t
      , version: getFirstMatch(/(?:tizen\s?)?browser\/(\d+(\.\d+)?)/i) || versionIdentifier
      };
    }
    else if (/qupzilla/i.test(ua)) {
      result = {
        name: 'QupZilla'
        , qupzilla: t
        , version: getFirstMatch(/(?:qupzilla)[\s\/](\d+(?:\.\d+)+)/i) || versionIdentifier
      }
    }
    else if (/chromium/i.test(ua)) {
      result = {
        name: 'Chromium'
        , chromium: t
        , version: getFirstMatch(/(?:chromium)[\s\/](\d+(?:\.\d+)?)/i) || versionIdentifier
      }
    }
    else if (/chrome|crios|crmo/i.test(ua)) {
      result = {
        name: 'Chrome'
        , chrome: t
        , version: getFirstMatch(/(?:chrome|crios|crmo)\/(\d+(\.\d+)?)/i)
      }
    }
    else if (android) {
      result = {
        name: 'Android'
        , version: versionIdentifier
      }
    }
    else if (/safari|applewebkit/i.test(ua)) {
      result = {
        name: 'Safari'
      , safari: t
      }
      if (versionIdentifier) {
        result.version = versionIdentifier
      }
    }
    else if (iosdevice) {
      result = {
        name : iosdevice == 'iphone' ? 'iPhone' : iosdevice == 'ipad' ? 'iPad' : 'iPod'
      }
      // WTF: version is not part of user agent in web apps
      if (versionIdentifier) {
        result.version = versionIdentifier
      }
    }
    else if(/googlebot/i.test(ua)) {
      result = {
        name: 'Googlebot'
      , googlebot: t
      , version: getFirstMatch(/googlebot\/(\d+(\.\d+))/i) || versionIdentifier
      }
    }
    else {
      result = {
        name: getFirstMatch(/^(.*)\/(.*) /),
        version: getSecondMatch(/^(.*)\/(.*) /)
     };
   }

    // set webkit or gecko flag for browsers based on these engines
    if (!result.msedge && /(apple)?webkit/i.test(ua)) {
      if (/(apple)?webkit\/537\.36/i.test(ua)) {
        result.name = result.name || "Blink"
        result.blink = t
      } else {
        result.name = result.name || "Webkit"
        result.webkit = t
      }
      if (!result.version && versionIdentifier) {
        result.version = versionIdentifier
      }
    } else if (!result.opera && /gecko\//i.test(ua)) {
      result.name = result.name || "Gecko"
      result.gecko = t
      result.version = result.version || getFirstMatch(/gecko\/(\d+(\.\d+)?)/i)
    }

    // set OS flags for platforms that have multiple browsers
    if (!result.msedge && (android || result.silk)) {
      result.android = t
    } else if (iosdevice) {
      result[iosdevice] = t
      result.ios = t
    } else if (mac) {
      result.mac = t
    } else if (xbox) {
      result.xbox = t
    } else if (windows) {
      result.windows = t
    } else if (linux) {
      result.linux = t
    }

    // OS version extraction
    var osVersion = '';
    if (result.windowsphone) {
      osVersion = getFirstMatch(/windows phone (?:os)?\s?(\d+(\.\d+)*)/i);
    } else if (iosdevice) {
      osVersion = getFirstMatch(/os (\d+([_\s]\d+)*) like mac os x/i);
      osVersion = osVersion.replace(/[_\s]/g, '.');
    } else if (android) {
      osVersion = getFirstMatch(/android[ \/-](\d+(\.\d+)*)/i);
    } else if (result.webos) {
      osVersion = getFirstMatch(/(?:web|hpw)os\/(\d+(\.\d+)*)/i);
    } else if (result.blackberry) {
      osVersion = getFirstMatch(/rim\stablet\sos\s(\d+(\.\d+)*)/i);
    } else if (result.bada) {
      osVersion = getFirstMatch(/bada\/(\d+(\.\d+)*)/i);
    } else if (result.tizen) {
      osVersion = getFirstMatch(/tizen[\/\s](\d+(\.\d+)*)/i);
    }
    if (osVersion) {
      result.osversion = osVersion;
    }

    // device type extraction
    var osMajorVersion = osVersion.split('.')[0];
    if (
         tablet
      || nexusTablet
      || iosdevice == 'ipad'
      || (android && (osMajorVersion == 3 || (osMajorVersion >= 4 && !mobile)))
      || result.silk
    ) {
      result.tablet = t
    } else if (
         mobile
      || iosdevice == 'iphone'
      || iosdevice == 'ipod'
      || android
      || nexusMobile
      || result.blackberry
      || result.webos
      || result.bada
    ) {
      result.mobile = t
    }

    // Graded Browser Support
    // http://developer.yahoo.com/yui/articles/gbs
    if (result.msedge ||
        (result.msie && result.version >= 10) ||
        (result.yandexbrowser && result.version >= 15) ||
		    (result.vivaldi && result.version >= 1.0) ||
        (result.chrome && result.version >= 20) ||
        (result.firefox && result.version >= 20.0) ||
        (result.safari && result.version >= 6) ||
        (result.opera && result.version >= 10.0) ||
        (result.ios && result.osversion && result.osversion.split(".")[0] >= 6) ||
        (result.blackberry && result.version >= 10.1)
        ) {
      result.a = t;
    }
    else if ((result.msie && result.version < 10) ||
        (result.chrome && result.version < 20) ||
        (result.firefox && result.version < 20.0) ||
        (result.safari && result.version < 6) ||
        (result.opera && result.version < 10.0) ||
        (result.ios && result.osversion && result.osversion.split(".")[0] < 6)
        ) {
      result.c = t
    } else result.x = t

    return result
  }

  var bowser = detect(typeof navigator !== 'undefined' ? navigator.userAgent : '')

  bowser.test = function (browserList) {
    for (var i = 0; i < browserList.length; ++i) {
      var browserItem = browserList[i];
      if (typeof browserItem=== 'string') {
        if (browserItem in bowser) {
          return true;
        }
      }
    }
    return false;
  }

  /*
   * Set our detect method to the main bowser object so we can
   * reuse it to test other user agents.
   * This is needed to implement future tests.
   */
  bowser._detect = detect;

  return bowser
});

},{}],3:[function(require,module,exports){
var matches = require('matches-selector')

module.exports = function (element, selector, checkYoSelf) {
  var parent = checkYoSelf ? element : element.parentNode

  while (parent && parent !== document) {
    if (matches(parent, selector)) return parent;
    parent = parent.parentNode
  }
}

},{"matches-selector":6}],4:[function(require,module,exports){
var closest = require('closest');

/**
 * Delegates event to a selector.
 *
 * @param {Element} element
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @param {Boolean} useCapture
 * @return {Object}
 */
function delegate(element, selector, type, callback, useCapture) {
    var listenerFn = listener.apply(this, arguments);

    element.addEventListener(type, listenerFn, useCapture);

    return {
        destroy: function() {
            element.removeEventListener(type, listenerFn, useCapture);
        }
    }
}

/**
 * Finds closest match and invokes callback.
 *
 * @param {Element} element
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @return {Function}
 */
function listener(element, selector, type, callback) {
    return function(e) {
        e.delegateTarget = closest(e.target, selector, true);

        if (e.delegateTarget) {
            callback.call(element, e);
        }
    }
}

module.exports = delegate;

},{"closest":3}],5:[function(require,module,exports){
var prefix = require('prefix-style')
var toCamelCase = require('to-camel-case')
var cache = { 'float': 'cssFloat' }
var addPxToStyle = require('add-px-to-style')

function style (element, property, value) {
  var camel = cache[property]
  if (typeof camel === 'undefined') {
    camel = detect(property)
  }

  // may be false if CSS prop is unsupported
  if (camel) {
    if (value === undefined) {
      return element.style[camel]
    }

    element.style[camel] = addPxToStyle(camel, value)
  }
}

function each (element, properties) {
  for (var k in properties) {
    if (properties.hasOwnProperty(k)) {
      style(element, k, properties[k])
    }
  }
}

function detect (cssProp) {
  var camel = toCamelCase(cssProp)
  var result = prefix(camel)
  cache[camel] = cache[cssProp] = cache[result] = result
  return result
}

function set () {
  if (arguments.length === 2) {
    each(arguments[0], arguments[1])
  } else {
    style(arguments[0], arguments[1], arguments[2])
  }
}

module.exports = set
module.exports.set = set

module.exports.get = function (element, properties) {
  if (Array.isArray(properties)) {
    return properties.reduce(function (obj, prop) {
      obj[prop] = style(element, prop || '')
      return obj
    }, {})
  } else {
    return style(element, properties || '')
  }
}

},{"add-px-to-style":1,"prefix-style":7,"to-camel-case":12}],6:[function(require,module,exports){

/**
 * Element prototype.
 */

var proto = Element.prototype;

/**
 * Vendor function.
 */

var vendor = proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

/**
 * Expose `match()`.
 */

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = el.parentNode.querySelectorAll(selector);
  for (var i = 0; i < nodes.length; ++i) {
    if (nodes[i] == el) return true;
  }
  return false;
}
},{}],7:[function(require,module,exports){
var div = null
var prefixes = [ 'Webkit', 'Moz', 'O', 'ms' ]

module.exports = function prefixStyle (prop) {
  // re-use a dummy div
  if (!div) {
    div = document.createElement('div')
  }

  var style = div.style

  // prop exists without prefix
  if (prop in style) {
    return prop
  }

  // borderRadius -> BorderRadius
  var titleCase = prop.charAt(0).toUpperCase() + prop.slice(1)

  // find the vendor-prefixed prop
  for (var i = prefixes.length; i >= 0; i--) {
    var name = prefixes[i] + titleCase
    // e.g. WebkitBorderRadius or webkitBorderRadius
    if (name in style) {
      return name
    }
  }

  return false
}

},{}],8:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],9:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],10:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],11:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":9,"./encode":10}],12:[function(require,module,exports){

var toSpace = require('to-space-case');


/**
 * Expose `toCamelCase`.
 */

module.exports = toCamelCase;


/**
 * Convert a `string` to camel case.
 *
 * @param {String} string
 * @return {String}
 */


function toCamelCase (string) {
  return toSpace(string).replace(/\s(\w)/g, function (matches, letter) {
    return letter.toUpperCase();
  });
}
},{"to-space-case":14}],13:[function(require,module,exports){

/**
 * Expose `toNoCase`.
 */

module.exports = toNoCase;


/**
 * Test whether a string is camel-case.
 */

var hasSpace = /\s/;
var hasCamel = /[a-z][A-Z]/;
var hasSeparator = /[\W_]/;


/**
 * Remove any starting case from a `string`, like camel or snake, but keep
 * spaces and punctuation that may be important otherwise.
 *
 * @param {String} string
 * @return {String}
 */

function toNoCase (string) {
  if (hasSpace.test(string)) return string.toLowerCase();

  if (hasSeparator.test(string)) string = unseparate(string);
  if (hasCamel.test(string)) string = uncamelize(string);
  return string.toLowerCase();
}


/**
 * Separator splitter.
 */

var separatorSplitter = /[\W_]+(.|$)/g;


/**
 * Un-separate a `string`.
 *
 * @param {String} string
 * @return {String}
 */

function unseparate (string) {
  return string.replace(separatorSplitter, function (m, next) {
    return next ? ' ' + next : '';
  });
}


/**
 * Camelcase splitter.
 */

var camelSplitter = /(.)([A-Z]+)/g;


/**
 * Un-camelcase a `string`.
 *
 * @param {String} string
 * @return {String}
 */

function uncamelize (string) {
  return string.replace(camelSplitter, function (m, previous, uppers) {
    return previous + ' ' + uppers.toLowerCase().split('').join(' ');
  });
}
},{}],14:[function(require,module,exports){

var clean = require('to-no-case');


/**
 * Expose `toSpaceCase`.
 */

module.exports = toSpaceCase;


/**
 * Convert a `string` to space case.
 *
 * @param {String} string
 * @return {String}
 */


function toSpaceCase (string) {
  return clean(string).replace(/[\W_]+(.|$)/g, function (matches, match) {
    return match ? ' ' + match : '';
  });
}
},{"to-no-case":13}],15:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":16,"punycode":8,"querystring":11}],16:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],17:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],18:[function(require,module,exports){
(function () {
  if (window.__embededGyazoContentJS) {
    return
  }
  window.__embededGyazoContentJS = true
  const browser = require('bowser')
  const storage = require('../libs/storageSwitcher')
  const ESC_KEY_CODE = 27
  const JACKUP_HEIGHT = 30
  const REMOVE_GYAZOMENU_EVENT = new window.Event('removeGyazoMenu')

  if (/gyazo\.com/.test(location.hostname)) {
    document.documentElement.setAttribute('data-extension-installed', true)
  }

  function isPressCommandKey (event) {
    //  Return true when
    //  Press CommandKey on MacOSX or CtrlKey on Windows or Linux
    if (!(event instanceof MouseEvent || event instanceof KeyboardEvent)) {
      return false
    }
    if (navigator.platform.match(/mac/i)) {
      return event.metaKey || event.keyIdentifier === 'Meta'
    } else {
      return event.ctrlKey || event.keyIdentifier === 'Control'
    }
  }

  function changeFixedElementToAbsolute () {
    Array.prototype.slice.apply(document.querySelectorAll('*')).filter(function (item) {
      return (window.getComputedStyle(item).position === 'fixed')
    }).forEach(function (item) {
      item.classList.add('gyazo-whole-capture-onetime-absolute')
      item.style.setProperty('position', 'absolute', 'important')
    })
  }

  function restoreFixedElement () {
    var fixedElms = document.getElementsByClassName('gyazo-whole-capture-onetime-absolute')
    Array.prototype.slice.apply(fixedElms).forEach(function (item) {
      item.classList.remove('gyazo-whole-capture-onetime-absolute')
      item.style.position = 'fixed'
    })
  }

  function lockScroll (skipPack) {
    var overflow = document.documentElement.style.overflow
    var overflowY = document.documentElement.style.overflowY
    var marginRight = document.documentElement.style.marginRight
    var _w = document.documentElement.getBoundingClientRect().width
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.overflowY = 'hidden'
    var w = document.documentElement.getBoundingClientRect().width
    var scrollBarWidth = w - _w
    if (skipPack === null) { document.documentElement.style.marginRight = `${scrollBarWidth}px` }
    return {overflow: overflow, overflowY: overflowY, marginRight: marginRight}
  }

  function unlockScroll (old) {
    old = old || {overflow: 'auto', overflowY: 'auto'}
    document.documentElement.style.overflow = old.overflow
    document.documentElement.style.overflowY = old.overflowY
    document.documentElement.style.marginRight = old.marginRight
  }

  function getZoomAndScale () {
    var zoom = Math.round(window.outerWidth / window.innerWidth * 100) / 100
    // XXX: on Windows, when window is not maximum, it should tweak zoom.(Chrome zoom level 1 is 1.10)
    var isWindows = navigator.platform.match(/^win/i)
    var isMaximum = (window.outerHeight === screen.availHeight && window.outerWidth === screen.availWidth)
    if (isWindows && !isMaximum && zoom > 1.00 && zoom < 1.05) {
      zoom = 1.00
    }
    var scale = window.devicePixelRatio / zoom
    return {
      zoom: zoom,
      scale: scale
    }
  }

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var actions = {
      notification: function () {
        let notificationContainer = document.querySelector('.gyazo-menu.gyazo-menu-element.gyazo-notification') || document.querySelector('.gyazo-menu.gyazo-notification')
        if (notificationContainer) {
          notificationContainer.classList.add('gyazo-notification')
        } else {
          notificationContainer = document.createElement('div')
          notificationContainer.className = 'gyazo-menu gyazo-notification'
          document.body.appendChild(notificationContainer)
        }
        let title = document.createTextNode('')
        let message = document.createTextNode('')
        if (request.title) {
          title = document.createElement('div')
          title.className = 'gyazo-notification-title'
          title.textContent = request.title
        }
        if (request.message) {
          message = document.createElement('div')
          message.className = 'gyazo-notification-message'
          message.textContent = request.message
        }
        let showImage = document.createElement('div')
        if (request.imagePageUrl) {
          const imageContainer = document.createElement('a')
          imageContainer.href = request.imagePageUrl
          imageContainer.target = '_blank'
          showImage.appendChild(imageContainer)
          const imageElem = document.createElement('img')
          imageElem.className = 'image'
          imageElem.src = request.imageUrl
          imageContainer.appendChild(imageElem)
          showImage.appendChild(document.createElement('br'))
          const imageInfo = document.createElement('div')
          imageInfo.className = 'gyazo-notification-image-info'
          showImage.appendChild(imageInfo)
          const infoSpan = document.createElement('span')
          infoSpan.textContent = document.title
          imageInfo.appendChild(infoSpan)
          const imageHost = document.createElement('div')
          imageHost.className = 'gyazo-notification-image-host'
          showImage.appendChild(imageHost)
          imageHost.textContent = location.host
        } else {
          const loadingElm = document.createElement('span')
          loadingElm.className = 'gyazo-spin'
          window.fetch(chrome.runtime.getURL('imgs/spinner.svg'))
            .then((res) => res.text())
            .then((text) => {
              loadingElm.innerHTML = text
            })
          showImage.appendChild(loadingElm)
        }
        notificationContainer.innerHTML = ''
        notificationContainer.appendChild(title)
        notificationContainer.appendChild(message)
        notificationContainer.appendChild(showImage)
        if (request.isFinish) {
          notificationContainer.querySelector('.image').addEventListener('load', function () {
            window.setTimeout(function () {
              if (document.body.contains(notificationContainer)) {
                document.body.removeChild(notificationContainer)
              }
            }, 5000)
          })
        }
        sendResponse()
      },
      insertMenu: function () {
        let gyazoMenu = document.querySelector('.gyazo-menu:not(.gyazo-notification)')
        if (gyazoMenu) {
          document.body.removeChild(gyazoMenu)
          window.dispatchEvent(REMOVE_GYAZOMENU_EVENT)
          return true
        }
        let hideMenu = function () {
          if (document.body.contains(gyazoMenu)) {
            document.body.removeChild(gyazoMenu)
          }
          window.dispatchEvent(REMOVE_GYAZOMENU_EVENT)
        }
        gyazoMenu = document.createElement('div')
        gyazoMenu.className = 'gyazo-menu gyazo-menu-element'

        let createButton = function (loadSvgName, text, shortcutKey) {
          let btn = document.createElement('div')
          btn.className = 'gyazo-big-button gyazo-button gyazo-menu-element'

          if (shortcutKey) {
            btn.setAttribute('title', 'Press: ' + shortcutKey)
          }

          let iconElm = document.createElement('div')
          iconElm.classList.add('gyazo-button-icon')

          window.fetch(chrome.runtime.getURL(`imgs/${loadSvgName}.svg`))
            .then((res) => res.text())
            .then((text) => iconElm.innerHTML = text)

          let textElm = document.createElement('div')
          textElm.className = 'gyazo-button-text'
          textElm.textContent = text

          btn.appendChild(iconElm)
          btn.appendChild(textElm)

          return btn
        }

        let selectElementBtn = createButton('selection', chrome.i18n.getMessage('selectElement'), 'E')
        let selectAreaBtn = createButton('crop', chrome.i18n.getMessage('selectArea'), 'S')
        let windowCaptureBtn = createButton('window', chrome.i18n.getMessage('captureWindow'), 'P')
        let wholeCaptureBtn = createButton('window-scroll', chrome.i18n.getMessage('topToBottom'), 'W')
        let myImageBtn = createButton('grid', chrome.i18n.getMessage('myImage'))
        myImageBtn.classList.add('gyazo-menu-myimage')
        let closeBtn = document.createElement('div')
        closeBtn.className = 'gyazo-close-button gyazo-menu-element'
        const closeBtnIcon = document.createElement('div')
        closeBtnIcon.className = 'gyazo-menu-element gyazo-icon gyazo-icon-cross'
        closeBtn.appendChild(closeBtnIcon)
        window.fetch(chrome.runtime.getURL('imgs/cross.svg'))
          .then((res) => res.text())
          .then((text) => closeBtnIcon.innerHTML = text)
        closeBtn.setAttribute('title', 'Press: Escape')

        window.addEventListener('contextmenu', function (event) {
          hideMenu()
        })
        document.body.appendChild(gyazoMenu)
        gyazoMenu.appendChild(selectElementBtn)
        gyazoMenu.appendChild(selectAreaBtn)
        gyazoMenu.appendChild(windowCaptureBtn)
        gyazoMenu.appendChild(wholeCaptureBtn)
        gyazoMenu.appendChild(myImageBtn)
        gyazoMenu.appendChild(closeBtn)

        let hotKey = function (event) {
          window.removeEventListener('keydown', hotKey)
          if (event.keyCode === ESC_KEY_CODE) {
            hideMenu()
          }
          switch (String.fromCharCode(event.keyCode)) {
            case 'E':
              selectElementBtn.click()
              break
            case 'S':
              selectAreaBtn.click()
              break
            case 'P':
              windowCaptureBtn.click()
              break
            case 'W':
              wholeCaptureBtn.click()
              break
          }
        }
        window.addEventListener('keydown', hotKey)
        try {
          // Provide access to chrome.storage at content script https://bugzilla.mozilla.org/show_bug.cgi?id=1197346
          storage.get({behavior: 'element'}, function (item) {
            if (item.behavior === 'element') {
              // Default behavior is select element
              selectElementBtn.classList.add('gyazo-button-active')
              window.requestAnimationFrame(actions.gyazoSelectElm)
            } else if (item.behavior === 'area') {
              // Default behavior is select area
              selectAreaBtn.classList.add('gyazo-button-active')
              actions.gyazoCaptureSelectedArea()
            }
          })
        } catch (e) {
          selectAreaBtn.classList.add('gyazo-button-active')
          actions.gyazoCaptureSelectedArea()
        }
        selectAreaBtn.addEventListener('click', function () {
          hideMenu()
          window.requestAnimationFrame(function () {
            actions.gyazoCaptureSelectedArea()
          })
        })
        selectElementBtn.addEventListener('click', function () {
          hideMenu()
          window.requestAnimationFrame(function () {
            actions.gyazoSelectElm()
          })
        })
        windowCaptureBtn.addEventListener('click', function () {
          hideMenu()
          window.requestAnimationFrame(function () {
            actions.gyazocaptureWindow()
          })
        })
        wholeCaptureBtn.addEventListener('click', function () {
          hideMenu()
          window.requestAnimationFrame(function () {
            actions.gyazoWholeCapture()
          })
        })
        closeBtn.addEventListener('click', function () {
          hideMenu()
        })
        myImageBtn.addEventListener('click', function () {
          hideMenu()
          window.open('https://gyazo.com/')
        })
      },
      changeFixedElementToAbsolute: function () {
        changeFixedElementToAbsolute()
        var waitScroll = function () {
          if (Math.abs(window.scrollX - request.scrollTo.x) < 1 &&
              Math.abs(window.scrollY - request.scrollTo.y) < 1) {
            window.requestAnimationFrame(sendResponse)
          } else {
            window.requestAnimationFrame(waitScroll)
          }
        }
        window.requestAnimationFrame(waitScroll)
      },
      gyazocaptureWindow: function () {
        var overflow = lockScroll(true)
        var data = {}
        var scaleObj = getZoomAndScale()
        data.w = window.innerWidth
        data.h = window.innerHeight
        data.x = window.scrollX
        data.y = window.scrollY
        data.t = document.title
        data.u = location.href
        data.s = scaleObj.scale
        data.z = scaleObj.zoom
        data.positionX = window.scrollX
        data.positionY = window.scrollY
        data.defaultPositon = window.scrollY
        data.innerHeight = window.innerHeight
        window.requestAnimationFrame(() => chrome.runtime.sendMessage(chrome.runtime.id, {
          action: 'gyazoCaptureWithSize',
          data: data,
          tab: request.tab
        }, function () {
          unlockScroll(overflow)
        }))
      },
      gyazoSelectElm: function () {
        if (document.querySelector('.gyazo-crop-select-element')) {
          return false
        }
        const MARGIN = 3
        document.body.classList.add('gyazo-select-element-mode')
        var jackup = document.createElement('div')
        jackup.classList.add('gyazo-jackup-element')
        document.body.appendChild(jackup)
        var layer = document.createElement('div')
        layer.className = 'gyazo-crop-select-element'
        document.body.appendChild(layer)
        layer.style.background = 'rgba(9, 132, 222, 0.35)'
        layer.style.margin = '0px'
        layer.style.border = '1px solid rgb(9, 132, 222)'
        layer.style.position = 'fixed'
        layer.style.pointerEvents = 'none'
        layer.style.zIndex = 2147483646 // Maximun number of 32bit Int - 1
        var allElms = Array.prototype.slice.apply(document.body.querySelectorAll('*')).filter(function (item) {
          return !item.classList.contains('gyazo-crop-select-element') &&
                 !item.classList.contains('gyazo-menu-element')
        })
        allElms.forEach(function (item) {
          item.classList.add('gyazo-select-element-cursor-overwrite')
        })
        var moveLayer = function (event) {
          var item = event.target
          event.stopPropagation()
          if (item.tagName === 'IMG') {
            layer.setAttribute('data-img-url', item.src)
          } else {
            layer.setAttribute('data-img-url', '')
          }
          var rect = item.getBoundingClientRect()
          layer.style.width = rect.width + 'px'
          layer.style.height = rect.height + 'px'
          layer.style.left = rect.left + 'px'
          layer.style.top = rect.top + 'px'
        }
        let hasMargin = false
        var takeMargin = function () {
          if (hasMargin) return
          hasMargin = true
          layer.style.width = parseInt(window.getComputedStyle(layer).width, 10) + MARGIN * 2 + 'px'
          layer.style.height = parseInt(window.getComputedStyle(layer).height, 10) + MARGIN * 2 + 'px'
          layer.style.left = parseInt(window.getComputedStyle(layer).left, 10) - MARGIN + 'px'
          layer.style.top = parseInt(window.getComputedStyle(layer).top, 10) - MARGIN + 'px'
        }
        var keydownHandler = function (event) {
          if (event.keyCode === ESC_KEY_CODE) {
            cancel()
          }else if (isPressCommandKey(event)) {
            takeMargin()
          }
        }
        var keyUpHandler = function (event) {
          if (isPressCommandKey(event)) {
            hasMargin = false
            layer.style.width = parseInt(window.getComputedStyle(layer).width, 10) - MARGIN * 2 + 'px'
            layer.style.height = parseInt(window.getComputedStyle(layer).height, 10) - MARGIN * 2 + 'px'
            layer.style.left = parseInt(window.getComputedStyle(layer).left, 10) + MARGIN + 'px'
            layer.style.top = parseInt(window.getComputedStyle(layer).top, 10) + MARGIN + 'px'
          }
        }
        var clickElement = function (event) {
          event.stopPropagation()
          event.preventDefault()
          document.body.classList.remove('gyazo-select-element-mode')
          allElms.forEach(function (item) {
            if (item.classList.contains('gyazo-select-element-cursor-overwrite')) {
              item.classList.remove('gyazo-select-element-cursor-overwrite')
            }
            item.removeEventListener('mouseover', moveLayer)
            item.removeEventListener('click', clickElement)
          })
          var data = {}
          var scaleObj = getZoomAndScale()

          // Sanitize gyazo desc for ivy-search
          Array.from(document.querySelectorAll('*')).forEach(function (elm) {
            if (window.getComputedStyle(elm).display === 'none' || window.getComputedStyle(elm).visibility === 'hidden') {
              elm.classList.add('gyazo-hidden')
            }
          })
          var dupTarget = event.target.cloneNode(true)
          Array.from(dupTarget.querySelectorAll('*')).forEach(function (elm) {
            switch (elm.tagName) {
              case 'SCRIPT':
              case 'STYLE':
                return elm.remove()
            }
            if (elm.classList.contains('gyazo-hidden')) {
              elm.remove()
            }
          })
          Array.from(document.getElementsByClassName('gyazo-hidden')).forEach(function (elm) {
            elm.classList.remove('gyazo-hidden')
          })

          data.w = parseFloat(layer.style.width)
          data.h = parseFloat(layer.style.height)
          data.x = window.scrollX + layer.offsetLeft
          data.y = window.scrollY + layer.offsetTop
          data.t = document.title
          data.u = location.href
          data.s = scaleObj.scale
          data.z = scaleObj.zoom
          data.positionX = window.scrollX
          data.positionY = window.scrollY
          data.innerHeight = window.innerHeight
          data.desc = dupTarget.textContent
          if (document.body.contains(layer)) {
            document.body.removeChild(layer)
          }
          if (document.querySelector('.gyazo-menu')) {
            document.body.removeChild(document.querySelector('.gyazo-menu'))
          }
          jackup.style.height = (window.innerHeight + JACKUP_HEIGHT) + 'px'
          window.removeEventListener('contextmenu', cancel)
          window.removeEventListener('keydown', keydownHandler)
          document.removeEventListener('keyup', keyUpHandler)
          if (layer.offsetTop >= 0 && layer.offsetTop + layer.offsetHeight <= window.innerHeight) {
            // Only when required scroll
            changeFixedElementToAbsolute()
          }
          if (layer.getAttribute('data-img-url')) {
            restoreFixedElement()
            return chrome.runtime.sendMessage(chrome.runtime.id, {
              action: 'gyazoSendRawImage',
              data: {srcUrl: layer.getAttribute('data-img-url')},
              tab: request.tab
            }, function () {})
          }
          var overflow = lockScroll()
          var finish = function () {
            if (document.getElementsByClassName('gyazo-crop-select-element').length > 0) {
              return window.requestAnimationFrame(finish)
            }
            window.requestAnimationFrame(function () {
              chrome.runtime.sendMessage(chrome.runtime.id, {
                action: 'gyazoCaptureWithSize',
                data: data,
                tab: request.tab
              }, null, function () {
                restoreFixedElement()
                document.body.removeChild(jackup)
                unlockScroll(overflow)
              })
            })
          }
          window.requestAnimationFrame(finish)
        }
        var cancel = function () {
          if (document.body.contains(jackup)) {
            document.body.removeChild(jackup)
          }
          if (document.body.contains(layer)) {
            document.body.removeChild(layer)
          }
          document.body.classList.remove('gyazo-select-element-mode')
          window.removeEventListener('contextmenu', cancel)
          document.removeEventListener('keydown', keydownHandler)
          document.removeEventListener('keyup', keyUpHandler)
          Array.prototype.slice.apply(document.querySelectorAll('.gyazo-select-element-cursor-overwrite')).forEach(function (item) {
            item.classList.remove('gyazo-select-element-cursor-overwrite')
            item.removeEventListener('mouseover', moveLayer)
            item.removeEventListener('click', clickElement)
          })
          restoreFixedElement()
        }
        let removedGyazoMenu = function () {
          window.removeEventListener('removeGyazoMenu', removedGyazoMenu)
          cancel()
        }
        window.addEventListener('removeGyazoMenu', removedGyazoMenu)
        window.addEventListener('contextmenu', cancel)
        document.addEventListener('keydown', keydownHandler)
        document.addEventListener('keyup', keyUpHandler)
        window.requestAnimationFrame(function () {
          allElms.forEach(function (item) {
            item.addEventListener('mouseover', moveLayer)
            item.addEventListener('click', clickElement)
          })
        })
      },
      gyazoCaptureSelectedArea: function () {
        if (document.querySelector('.gyazo-jackup-element')) {
          return false
        }
        var startX
        var startY
        var data = {}
        var tempUserSelect = document.body.style.webkitUserSelect
        var layer = document.createElement('div')
        var jackup = document.createElement('div')
        jackup.classList.add('gyazo-jackup-element')
        document.body.appendChild(jackup)
        var pageHeight = Math.max(document.body.clientHeight, document.body.offsetHeight, document.body.scrollHeight)
        layer.style.position = 'absolute'
        layer.style.left = document.body.clientLeft + 'px'
        layer.style.top = document.body.clientTop + 'px'
        layer.style.width = Math.max(
          document.body.clientWidth, document.body.offsetWidth, document.body.scrollWidth,
          document.documentElement.clientWidth, document.documentElement.offsetWidth, document.documentElement.scrollWidth
        ) + 'px'
        layer.style.height = pageHeight + 'px'
        layer.style.zIndex = 2147483646 // Maximun number of 32bit Int - 1
        layer.style.cursor = 'crosshair'
        layer.className = 'gyazo-select-layer'
        document.body.style.webkitUserSelect = 'none'
        var selectionElm = document.createElement('div')
        layer.appendChild(selectionElm)
        document.body.appendChild(layer)
        selectionElm.styleUpdate = function (styles) {
          Object.keys(styles).forEach(function (key) {
            selectionElm.style[key] = styles[key]
          })
        }
        selectionElm.styleUpdate({
          background: 'rgba(92, 92, 92, 0.3)',
          position: 'absolute'
        })
        var cancelGyazo = function () {
          document.body.removeChild(layer)
          document.body.removeChild(jackup)
          document.body.style.webkitUserSelect = tempUserSelect
          document.removeEventListener('keydown', keydownHandler)
          window.removeEventListener('contextmenu', cancelGyazo)
          restoreFixedElement()
          if (document.querySelector('.gyazo-menu')) {
            document.body.removeChild(document.querySelector('.gyazo-menu'))
          }
        }
        let removedGyazoMenu = function () {
          cancelGyazo()
          window.removeEventListener('removeGyazoMenu', removedGyazoMenu)
        }
        window.addEventListener('removeGyazoMenu', removedGyazoMenu)
        var keydownHandler = function (event) {
          if (event.keyCode === ESC_KEY_CODE) {
            //  If press Esc Key, cancel it
            cancelGyazo()
          }
        }
        var mousedownHandler = function (e) {
          let gyazoMenu = document.querySelector('.gyazo-menu')
          if (gyazoMenu) {
            document.body.removeChild(gyazoMenu)
          }
          startX = e.pageX
          startY = e.pageY
          selectionElm.styleUpdate({
            border: '1px solid rgba(255, 255, 255, 0.8)',
            left: startX + 'px',
            top: startY + 'px'
          })
          layer.removeEventListener('mousedown', mousedownHandler)
          layer.addEventListener('mousemove', mousemoveHandler)
          layer.addEventListener('mouseup', mouseupHandler)
        }
        var mousemoveHandler = function (e) {
          selectionElm.styleUpdate({
            width: (Math.abs(e.pageX - startX) - 1) + 'px',
            height: (Math.abs(e.pageY - startY) - 1) + 'px',
            left: Math.min(e.pageX, startX) + 'px',
            top: Math.min(e.pageY, startY) + 'px'
          })
        }
        var mouseupHandler = function (e) {
          document.body.style.webkitUserSelect = tempUserSelect
          document.removeEventListener('keydown', keydownHandler)
          window.addEventListener('contextmenu', function (event) {
            cancelGyazo()
            event.preventDefault()
          })
          var scaleObj = getZoomAndScale()
          var rect = selectionElm.getBoundingClientRect()
          data.w = rect.width
          data.h = rect.height
          if (data.h <= 3 || data.w <= 3) {
            cancelGyazo()
            return false
          }
          data.x = rect.left + window.scrollX
          data.y = rect.top + window.scrollY
          data.t = document.title
          data.u = location.href
          data.s = scaleObj.scale
          data.z = scaleObj.zoom
          data.positionX = window.scrollX
          data.positionY = window.scrollY
          data.innerHeight = window.innerHeight
          document.body.removeChild(layer)
          if (document.querySelector('.gyazo-menu')) {
            document.body.removeChild(document.querySelector('.gyazo-menu'))
          }
          var overflow = lockScroll()
          jackup.style.height = (window.innerHeight + JACKUP_HEIGHT) + 'px'
          // wait for rewrite by removeChild
          let finish = function () {
            if (document.getElementsByClassName('gyazo-select-layer').length > 0) {
              return window.requestAnimationFrame(finish)
            }
            window.setTimeout(function () {
              chrome.runtime.sendMessage(chrome.runtime.id, {
                action: 'gyazoCaptureWithSize',
                data: data,
                tab: request.tab
              }, null, function () {
                document.body.removeChild(jackup)
                unlockScroll(overflow)
                restoreFixedElement()
              })
            }, 100)
          }
          window.requestAnimationFrame(finish)
        }
        layer.addEventListener('mousedown', mousedownHandler)
        document.addEventListener('keydown', keydownHandler)
        window.addEventListener('contextmenu', cancelGyazo)
      },
      gyazoWholeCapture: function () {
        var overflow = lockScroll(true)
        var data = {}
        var scaleObj = getZoomAndScale()
        data.w = window.innerWidth
        data.h = Math.max(document.body.clientHeight, document.body.offsetHeight, document.body.scrollHeight)
        data.x = 0
        data.y = 0
        data.t = document.title
        data.u = location.href
        data.s = scaleObj.scale
        data.z = scaleObj.zoom
        data.positionX = window.scrollX
        data.positionY = window.scrollY
        data.innerHeight = window.innerHeight
        var jackup = document.createElement('div')
        jackup.classList.add('gyazo-jackup-element')
        document.body.appendChild(jackup)
        jackup.style.height = (data.h + 30) + 'px'
        chrome.runtime.sendMessage(chrome.runtime.id, {
          action: 'gyazoCaptureWithSize',
          data: data,
          tab: request.tab
        }, null, function () {
          document.body.removeChild(jackup)
          unlockScroll(overflow)
        })
      }
    }
    if (request.action in actions) {
      actions[request.action]()
    }
    return true
  })
  // XXX: Firefox can't embed moz-extension:// file in content
  if (browser.firefox) return
  require('./expander')
})()

},{"../libs/storageSwitcher":23,"./expander":19,"bowser":2}],19:[function(require,module,exports){
const delegate = require('delegate')
const css = require('dom-css')
const extend = require('xtend')
const gyazoIdFromUrl = require('./lib/gyazoIdFromUrl')
const adjacentStyle = require('./lib/adjacentStyle')
const waitFor = require('./lib/waitFor')

function fetchImage (url, callback) {
  chrome.runtime.sendMessage(chrome.runtime.id, {
    action: 'gyazoGetImageBlob',
    gyazoUrl: url
  }, (response) => {
    const xhr = new window.XMLHttpRequest()
    xhr.open('GET', response.imageBlobUrl, true)
    xhr.responseType = 'arraybuffer'
    xhr.onload = () => {
      const blob = new window.Blob([xhr.response], { type: 'image/png' })

      callback(null, blob)
    }
    xhr.onerror = (e) => {
      callback(e)
    }
    xhr.send()
  })
}

function createLoader (position = {}) {
  const loader = document.createElement('div')
  const circleIcon = document.createElement('div')
  circleIcon.className = 'gz-circle-loader'
  loader.appendChild(circleIcon)

  css(loader, extend({
    position: 'fixed',
    boxShadow: '0 0 8px rgba(0,0,0,.6)',
    backgroundColor: '#fff',
    zIndex: 1000000,
    width: 40,
    height: 40,
    padding: 4,
    boxSizing: 'border-box'
  }, position))

  return loader
}

function createImagePreview ({ url, boxStyle }) {
  const img = document.createElement('img')
  img.src = url

  css(img, extend({
    display: 'inline-block',
    position: 'fixed',
    zIndex: 1000000,
    backgroundColor: '#fff',
    maxWidth: 500,
    boxShadow: '0 0 8px rgba(0,0,0,.6)'
  }, boxStyle))

  return img
}

let previewIsShown = false
delegate(document.body, 'a', 'mouseover', (event) => {
  if (previewIsShown) return

  const element = event.target
  const href = element.getAttribute('href')

  if (element.querySelector('img')) return

  const isGyazoUrl = !!gyazoIdFromUrl(href)
  if (isGyazoUrl) {
    previewIsShown = true

    let container

    let loader = createLoader(adjacentStyle(element))
    document.body.appendChild(loader)

    let leaved = false

    const onLeave = (event = {}) => {
      leaved = true

      if (event.target && element !== event.target) return
      if (container) document.body.removeChild(container)
      if (loader) document.body.removeChild(loader)

      element.removeEventListener('mouseleave', onLeave)
      previewIsShown = false
    }

    const cancel = waitFor(() => !element.offsetParent, onLeave)

    element.addEventListener('mouseleave', onLeave)
    element.addEventListener('mouseleave', cancel)

    fetchImage(href, (e, blob) => {
      if (leaved) return

      document.body.removeChild(loader)
      loader = null

      container = createImagePreview({
        url: window.URL.createObjectURL(blob),
        boxStyle: adjacentStyle(element)
      })

      document.body.appendChild(container)
    })
  }
})

},{"./lib/adjacentStyle":20,"./lib/gyazoIdFromUrl":21,"./lib/waitFor":22,"delegate":4,"dom-css":5,"xtend":17}],20:[function(require,module,exports){
'use strict'

module.exports = function adjacentStyle (element) {
  const rect = element.getBoundingClientRect()

  const offsetY = 20
  const centerY = Math.floor(window.innerHeight / 2)

  if (rect.top > centerY) {
    return {
      left: rect.left,
      bottom: Math.round((window.innerHeight - rect.top + offsetY)),
      maxHeight: Math.round(Math.min(rect.top - offsetY * 2, 500))
    }
  } else {
    const rectBottom = rect.top + rect.height
    return {
      left: rect.left,
      top: Math.round(rectBottom + offsetY),
      maxHeight: Math.round(Math.min(window.innerHeight - rectBottom - offsetY * 2, 500))
    }
  }
}

},{}],21:[function(require,module,exports){
'use strict'
const url = require('url')

module.exports = function gyazoIdFromUrl (str) {
  let parsedUrl = ''
  try {
    parsedUrl = url.parse(str)
  } catch (e) {
    return
  }

  if ((/^(.+\.)?gyazo\.com$/).test(parsedUrl.host) && (/^\/[0-9a-f]+$/).test(parsedUrl.pathname)) {
    return parsedUrl.pathname.slice(1)
  }
}

},{"url":15}],22:[function(require,module,exports){
module.exports = function waitFor (condition, fn) {
  const timer = window.setInterval(() => {
    if (!condition()) return
    fn()
    cancel()
  }, 100)

  function cancel () {
    window.clearInterval(timer)
  }

  return cancel
}

},{}],23:[function(require,module,exports){
// Firefox WebExtension doesn't have chrome.storage.sync but only chrome.storage.local
// https://bugzilla.mozilla.org/show_bug.cgi?id=1213475
// https://bugzilla.mozilla.org/show_bug.cgi?id=1220494
try {
  module.exports = ('sync' in chrome.storage && typeof chrome.storage.sync === 'function')
    ? chrome.storage.sync
    : chrome.storage.local
} catch (e) {
  module.exports = {get: function (a, b) {
    throw new Error('not support chrome.storage')
  }}
}

},{}]},{},[18]);
