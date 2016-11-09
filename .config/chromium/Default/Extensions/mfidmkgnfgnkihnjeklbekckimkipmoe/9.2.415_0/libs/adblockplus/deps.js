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

//
// Module framework stuff
//

function require(module)
{
  return require.scopes[module];
}
require.scopes = Object.create(null);

function importAll(module, globalObj)
{
  var exports = require(module);
  for (var key in exports)
    globalObj[key] = exports[key];
}

onShutdown = {
  done: false,
  add: function() {},
  remove: function() {}
};

//
// XPCOM emulation
//

var Components =
{
  interfaces:
  {
    nsIFile: {DIRECTORY_TYPE: 0},
    nsIFileURL: function() {},
    nsIHttpChannel: function() {},
    nsITimer: {TYPE_REPEATING_SLACK: 0},
    nsIInterfaceRequestor: null,
    nsIChannelEventSink: null
  },
  classes:
  {
    "@mozilla.org/timer;1":
    {
      createInstance: function()
      {
        return new FakeTimer();
      }
    },
    "@mozilla.org/xmlextras/xmlhttprequest;1":
    {
      createInstance: function()
      {
        return new XMLHttpRequest();
      }
    }
  },
  results: {},
  utils: {
    reportError: function(e)
    {
      console.error(e);
      console.trace();
    }
  },
  manager: null,
  ID: function()
  {
    return null;
  }
};
const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;

var XPCOMUtils =
{
  generateQI: function() {}
};

//
// Fake nsIFile implementation for our I/O
//

function FakeFile(path)
{
  this.path = path;
}
FakeFile.prototype =
{
  get leafName()
  {
    return this.path;
  },
  set leafName(value)
  {
    this.path = value;
  },
  append: function(path)
  {
    this.path += path;
  },
  clone: function()
  {
    return new FakeFile(this.path);
  },
  get parent()
  {
    return {create: function() {}};
  },
  normalize: function() {}
};

//
// Services.jsm module emulation
//

var Services =
{
  io: {
    newURI: function(uri)
    {
      if (!uri.length || uri[0] == "~")
        throw new Error("Invalid URI");

      /^([^:\/]*)/.test(uri);
      var scheme = RegExp.$1.toLowerCase();

      return {
        scheme: scheme,
        spec: uri,
        QueryInterface: function()
        {
          return this;
        }
      };
    },
    newFileURI: function(file)
    {
      var result = this.newURI("file:///" + file.path);
      result.file = file;
      return result;
    }
  },
  obs: {
    addObserver: function() {},
    removeObserver: function() {}
  },
  vc: {
    compare: function(v1, v2)
    {
      function parsePart(s)
      {
        if (!s)
          return parsePart("0");

        var part = {
          numA: 0,
          strB: "",
          numC: 0,
          extraD: ""
        };

        if (s === "*")
        {
          part.numA = Number.MAX_VALUE;
          return part;
        }

        var matches = s.match(/(\d*)(\D*)(\d*)(.*)/);
        part.numA = parseInt(matches[1], 10) || part.numA;
        part.strB = matches[2] || part.strB;
        part.numC = parseInt(matches[3], 10) || part.numC;
        part.extraD = matches[4] || part.extraD;

        if (part.strB == "+")
        {
          part.numA++;
          part.strB = "pre";
        }

        return part;
      }

      function comparePartElement(s1, s2)
      {
        if (s1 === "" && s2 !== "")
          return 1;
        if (s1 !== "" && s2 === "")
          return -1;
        return s1 === s2 ? 0 : (s1 > s2 ? 1 : -1);
      }

      function compareParts(p1, p2)
      {
        var result = 0;
        var elements = ["numA", "strB", "numC", "extraD"];
        elements.some(function(element)
        {
          result = comparePartElement(p1[element], p2[element]);
          return result;
        });
        return result;
      }

      var parts1 = v1.split(".");
      var parts2 = v2.split(".");
      for (var i = 0; i < Math.max(parts1.length, parts2.length); i++)
      {
        var result = compareParts(parsePart(parts1[i]), parsePart(parts2[i]));
        if (result)
          return result;
      }
      return 0;
    }
  }
}

//
// FileUtils.jsm module emulation
//

var FileUtils =
{
  PERMS_DIRECTORY: 0
};

function FakeTimer()
{
}
FakeTimer.prototype =
{
  delay: 0,
  callback: null,
  initWithCallback: function(callback, delay)
  {
    this.callback = callback;
    this.delay = delay;
    this.scheduleTimeout();
  },
  scheduleTimeout: function()
  {
    var me = this;
    window.setTimeout(function()
    {
      try
      {
        me.callback();
      }
      catch(e)
      {
        Cu.reportError(e);
      }
      me.scheduleTimeout();
    }, this.delay);
  }
};

//
// Add a channel property to XMLHttpRequest, Synchronizer needs it
//

XMLHttpRequest.prototype.channel =
{
  status: -1,
  notificationCallbacks: {},
  loadFlags: 0,
  INHIBIT_CACHING: 0,
  VALIDATE_ALWAYS: 0,
  QueryInterface: function()
  {
    return this;
  }
};

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function() {
  var platformVersion = null;
  var application = null;
  var applicationVersion;

  var regexp = /(\S+)\/(\S+)(?:\s*\(.*?\))?/g;
  var match;

  while (match = regexp.exec(navigator.userAgent))
  {
    var app = match[1];
    var ver = match[2];

    if (app == "Chrome")
    {
      platformVersion = ver;
    }
    else if (app != "Mozilla" && app != "AppleWebKit" && app != "Safari")
    {
      // For compatibility with legacy websites, Chrome's UA
      // also includes a Mozilla, AppleWebKit and Safari token.
      // Any further name/version pair indicates a fork.
      application = app == "OPR" ? "opera" : app.toLowerCase();
      applicationVersion = ver;
    }
  }

  // not a Chromium-based UA, probably modifed by the user
  if (!platformVersion)
  {
    application = "unknown";
    applicationVersion = platformVersion = "0";
  }

  // no additional name/version, so this is upstream Chrome
  if (!application)
  {
    application = "chrome";
    applicationVersion = platformVersion;
  }

  require.scopes.info = {
    addonName: "adblockpluschrome",
    addonVersion: "1.11",

    application: application,
    applicationVersion: applicationVersion,

    platform: "chromium",
    platformVersion: platformVersion
  };
})();

/*! http://mths.be/punycode v1.2.3 by @mathias */
/* Used under GPL 2.0, see https://github.com/bestiejs/punycode.js/blob/master/LICENSE-GPL.txt */
;(function(root) {

    /** Detect free variables */
    var freeExports = typeof exports == 'object' && exports;
    var freeModule = typeof module == 'object' && module &&
        module.exports == freeExports && module;
    var freeGlobal = typeof global == 'object' && global;
    if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
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
    regexNonASCII = /[^ -~]/, // unprintable ASCII chars + non-ASCII chars
    regexSeparators = /\x2E|\u3002|\uFF0E|\uFF61/g, // RFC 3490 separators

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
        throw RangeError(errors[type]);
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
        while (length--) {
            array[length] = fn(array[length]);
        }
        return array;
    }

    /**
     * A simple `Array#map`-like wrapper to work with domain name strings.
     * @private
     * @param {String} domain The domain name.
     * @param {Function} callback The function that gets called for every
     * character.
     * @returns {Array} A new string of characters returned by the callback
     * function.
     */
    function mapDomain(string, fn) {
        return map(string.split(regexSeparators), fn).join('.');
    }

    /**
     * Creates an array containing the numeric code points of each Unicode
     * character in the string. While JavaScript uses UCS-2 internally,
     * this function will convert a pair of surrogate halves (each of which
     * UCS-2 exposes as separate characters) into a single code point,
     * matching UTF-16.
     * @see `punycode.ucs2.encode`
     * @see <http://mathiasbynens.be/notes/javascript-encoding>
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
     * http://tools.ietf.org/html/rfc3492#section-3.4
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
            length,
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
     * Converts a string of Unicode symbols to a Punycode string of ASCII-only
     * symbols.
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
     * Converts a Punycode string representing a domain name to Unicode. Only the
     * Punycoded parts of the domain name will be converted, i.e. it doesn't
     * matter if you call it on a string that has already been converted to
     * Unicode.
     * @memberOf punycode
     * @param {String} domain The Punycode domain name to convert to Unicode.
     * @returns {String} The Unicode representation of the given Punycode
     * string.
     */
    function toUnicode(domain) {
        return mapDomain(domain, function(string) {
            return regexPunycode.test(string)
                ? decode(string.slice(4).toLowerCase())
                : string;
        });
    }

    /**
     * Converts a Unicode string representing a domain name to Punycode. Only the
     * non-ASCII parts of the domain name will be converted, i.e. it doesn't
     * matter if you call it with a domain that's already in ASCII.
     * @memberOf punycode
     * @param {String} domain The domain name to convert, as a Unicode string.
     * @returns {String} The Punycode representation of the given domain name.
     */
    function toASCII(domain) {
        return mapDomain(domain, function(string) {
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
        'version': '1.2.3',
        /**
         * An object of methods to convert from JavaScript's internal character
         * representation (UCS-2) to Unicode code points, and back.
         * @see <http://mathiasbynens.be/notes/javascript-encoding>
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
        define(function() {
            return punycode;
        });
    }	else if (freeExports && !freeExports.nodeType) {
        if (freeModule) { // in Node.js or RingoJS v0.8.0+
            freeModule.exports = punycode;
        } else { // in Narwhal or RingoJS v0.7.0-
            for (key in punycode) {
                punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
            }
        }
    } else { // in Rhino or a web browser
        root.punycode = punycode;
    }

}(this));

var publicSuffixes = {
    "0.bg": 1,
    "1.bg": 1,
    "1kapp.com": 1,
    "2.bg": 1,
    "2000.hu": 1,
    "3.bg": 1,
    "4.bg": 1,
    "4u.com": 1,
    "5.bg": 1,
    "6.bg": 1,
    "7.bg": 1,
    "8.bg": 1,
    "9.bg": 1,
    "a.bg": 1,
    "a.prod.fastly.net": 1,
    "a.se": 1,
    "a.ssl.fastly.net": 1,
    "aa.no": 1,
    "aaa.pro": 1,
    "aarborte.no": 1,
    "ab.ca": 1,
    "abashiri.hokkaido.jp": 1,
    "abeno.osaka.jp": 1,
    "abiko.chiba.jp": 1,
    "abira.hokkaido.jp": 1,
    "abo.pa": 1,
    "abr.it": 1,
    "abruzzo.it": 1,
    "abu.yamaguchi.jp": 1,
    "ac.ae": 1,
    "ac.at": 1,
    "ac.be": 1,
    "ac.ci": 1,
    "ac.cn": 1,
    "ac.cr": 1,
    "ac.cy": 1,
    "ac.gn": 1,
    "ac.id": 1,
    "ac.il": 1,
    "ac.im": 1,
    "ac.in": 1,
    "ac.ir": 1,
    "ac.jp": 1,
    "ac.kr": 1,
    "ac.lk": 1,
    "ac.ma": 1,
    "ac.me": 1,
    "ac.mu": 1,
    "ac.mw": 1,
    "ac.ni": 1,
    "ac.nz": 1,
    "ac.pa": 1,
    "ac.pr": 1,
    "ac.rs": 1,
    "ac.ru": 1,
    "ac.rw": 1,
    "ac.se": 1,
    "ac.sz": 1,
    "ac.th": 1,
    "ac.tj": 1,
    "ac.tz": 1,
    "ac.ug": 1,
    "ac.uk": 1,
    "ac.vn": 1,
    "ac.za": 1,
    "aca.pro": 1,
    "academy.museum": 1,
    "accident-investigation.aero": 1,
    "accident-prevention.aero": 1,
    "acct.pro": 1,
    "achi.nagano.jp": 1,
    "act.au": 1,
    "act.edu.au": 1,
    "ad.jp": 1,
    "adachi.tokyo.jp": 1,
    "adm.br": 1,
    "adult.ht": 1,
    "adv.br": 1,
    "adygeya.ru": 1,
    "adygeya.su": 1,
    "ae.org": 1,
    "aejrie.no": 1,
    "aero.mv": 1,
    "aero.tt": 1,
    "aerobatic.aero": 1,
    "aeroclub.aero": 1,
    "aerodrome.aero": 1,
    "aeroport.fr": 1,
    "afjord.no": 1,
    "africa.com": 1,
    "ag.it": 1,
    "aga.niigata.jp": 1,
    "agano.niigata.jp": 1,
    "agdenes.no": 1,
    "agematsu.nagano.jp": 1,
    "agents.aero": 1,
    "agr.br": 1,
    "agrar.hu": 1,
    "agric.za": 1,
    "agriculture.museum": 1,
    "agrigento.it": 1,
    "agrinet.tn": 1,
    "agro.pl": 1,
    "aguni.okinawa.jp": 1,
    "ah.cn": 1,
    "ah.no": 1,
    "aibetsu.hokkaido.jp": 1,
    "aichi.jp": 1,
    "aid.pl": 1,
    "aikawa.kanagawa.jp": 1,
    "ainan.ehime.jp": 1,
    "aioi.hyogo.jp": 1,
    "aip.ee": 1,
    "air-surveillance.aero": 1,
    "air-traffic-control.aero": 1,
    "air.museum": 1,
    "aircraft.aero": 1,
    "airguard.museum": 1,
    "airline.aero": 1,
    "airport.aero": 1,
    "airtraffic.aero": 1,
    "aisai.aichi.jp": 1,
    "aisho.shiga.jp": 1,
    "aizubange.fukushima.jp": 1,
    "aizumi.tokushima.jp": 1,
    "aizumisato.fukushima.jp": 1,
    "aizuwakamatsu.fukushima.jp": 1,
    "ak.us": 1,
    "akabira.hokkaido.jp": 1,
    "akagi.shimane.jp": 1,
    "akaiwa.okayama.jp": 1,
    "akashi.hyogo.jp": 1,
    "aki.kochi.jp": 1,
    "akiruno.tokyo.jp": 1,
    "akishima.tokyo.jp": 1,
    "akita.akita.jp": 1,
    "akita.jp": 1,
    "akkeshi.hokkaido.jp": 1,
    "aknoluokta.no": 1,
    "ako.hyogo.jp": 1,
    "akrehamn.no": 1,
    "akune.kagoshima.jp": 1,
    "al.eu.org": 1,
    "al.it": 1,
    "al.no": 1,
    "al.us": 1,
    "alabama.museum": 1,
    "alaheadju.no": 1,
    "aland.fi": 1,
    "alaska.museum": 1,
    "alessandria.it": 1,
    "alesund.no": 1,
    "algard.no": 1,
    "alstahaug.no": 1,
    "alt.za": 1,
    "alta.no": 1,
    "altai.ru": 1,
    "alto-adige.it": 1,
    "altoadige.it": 1,
    "alvdal.no": 1,
    "am.br": 1,
    "ama.aichi.jp": 1,
    "ama.shimane.jp": 1,
    "amagasaki.hyogo.jp": 1,
    "amakusa.kumamoto.jp": 1,
    "amami.kagoshima.jp": 1,
    "amber.museum": 1,
    "ambulance.aero": 1,
    "ambulance.museum": 1,
    "american.museum": 1,
    "americana.museum": 1,
    "americanantiques.museum": 1,
    "americanart.museum": 1,
    "ami.ibaraki.jp": 1,
    "amli.no": 1,
    "amot.no": 1,
    "amsterdam.museum": 1,
    "amur.ru": 1,
    "amursk.ru": 1,
    "amusement.aero": 1,
    "an.it": 1,
    "anamizu.ishikawa.jp": 1,
    "anan.nagano.jp": 1,
    "anan.tokushima.jp": 1,
    "ancona.it": 1,
    "and.museum": 1,
    "andasuolo.no": 1,
    "andebu.no": 1,
    "ando.nara.jp": 1,
    "andoy.no": 1,
    "andria-barletta-trani.it": 1,
    "andria-trani-barletta.it": 1,
    "andriabarlettatrani.it": 1,
    "andriatranibarletta.it": 1,
    "and\u00f8y.no": 1,
    "anjo.aichi.jp": 1,
    "annaka.gunma.jp": 1,
    "annefrank.museum": 1,
    "anpachi.gifu.jp": 1,
    "anthro.museum": 1,
    "anthropology.museum": 1,
    "antiques.museum": 1,
    "ao.it": 1,
    "aogaki.hyogo.jp": 1,
    "aogashima.tokyo.jp": 1,
    "aoki.nagano.jp": 1,
    "aomori.aomori.jp": 1,
    "aomori.jp": 1,
    "aosta-valley.it": 1,
    "aosta.it": 1,
    "aostavalley.it": 1,
    "aoste.it": 1,
    "ap-northeast-1.compute.amazonaws.com": 1,
    "ap-northeast-2.compute.amazonaws.com": 1,
    "ap-southeast-1.compute.amazonaws.com": 1,
    "ap-southeast-2.compute.amazonaws.com": 1,
    "ap.gov.pl": 1,
    "ap.it": 1,
    "appspot.com": 1,
    "aq.it": 1,
    "aquarium.museum": 1,
    "aquila.it": 1,
    "ar.com": 1,
    "ar.it": 1,
    "ar.us": 1,
    "arai.shizuoka.jp": 1,
    "arakawa.saitama.jp": 1,
    "arakawa.tokyo.jp": 1,
    "arao.kumamoto.jp": 1,
    "arboretum.museum": 1,
    "archaeological.museum": 1,
    "archaeology.museum": 1,
    "architecture.museum": 1,
    "ardal.no": 1,
    "aremark.no": 1,
    "arendal.no": 1,
    "arezzo.it": 1,
    "ariake.saga.jp": 1,
    "arida.wakayama.jp": 1,
    "aridagawa.wakayama.jp": 1,
    "arita.saga.jp": 1,
    "arkhangelsk.ru": 1,
    "arkhangelsk.su": 1,
    "arna.no": 1,
    "arq.br": 1,
    "art.br": 1,
    "art.do": 1,
    "art.dz": 1,
    "art.ht": 1,
    "art.museum": 1,
    "art.pl": 1,
    "art.sn": 1,
    "artanddesign.museum": 1,
    "artcenter.museum": 1,
    "artdeco.museum": 1,
    "arteducation.museum": 1,
    "artgallery.museum": 1,
    "arts.co": 1,
    "arts.museum": 1,
    "arts.nf": 1,
    "arts.ro": 1,
    "arts.ve": 1,
    "artsandcrafts.museum": 1,
    "as.us": 1,
    "asago.hyogo.jp": 1,
    "asahi.chiba.jp": 1,
    "asahi.ibaraki.jp": 1,
    "asahi.mie.jp": 1,
    "asahi.nagano.jp": 1,
    "asahi.toyama.jp": 1,
    "asahi.yamagata.jp": 1,
    "asahikawa.hokkaido.jp": 1,
    "asaka.saitama.jp": 1,
    "asakawa.fukushima.jp": 1,
    "asakuchi.okayama.jp": 1,
    "asaminami.hiroshima.jp": 1,
    "ascoli-piceno.it": 1,
    "ascolipiceno.it": 1,
    "aseral.no": 1,
    "ashibetsu.hokkaido.jp": 1,
    "ashikaga.tochigi.jp": 1,
    "ashiya.fukuoka.jp": 1,
    "ashiya.hyogo.jp": 1,
    "ashoro.hokkaido.jp": 1,
    "asker.no": 1,
    "askim.no": 1,
    "askoy.no": 1,
    "askvoll.no": 1,
    "ask\u00f8y.no": 1,
    "asmatart.museum": 1,
    "asn.au": 1,
    "asn.lv": 1,
    "asnes.no": 1,
    "aso.kumamoto.jp": 1,
    "ass.km": 1,
    "assabu.hokkaido.jp": 1,
    "assassination.museum": 1,
    "assedic.fr": 1,
    "assisi.museum": 1,
    "assn.lk": 1,
    "asso.bj": 1,
    "asso.ci": 1,
    "asso.dz": 1,
    "asso.eu.org": 1,
    "asso.fr": 1,
    "asso.gp": 1,
    "asso.ht": 1,
    "asso.km": 1,
    "asso.mc": 1,
    "asso.nc": 1,
    "asso.re": 1,
    "association.aero": 1,
    "association.museum": 1,
    "asti.it": 1,
    "astrakhan.ru": 1,
    "astronomy.museum": 1,
    "asuke.aichi.jp": 1,
    "at-band-camp.net": 1,
    "at.eu.org": 1,
    "at.it": 1,
    "atami.shizuoka.jp": 1,
    "ath.cx": 1,
    "atlanta.museum": 1,
    "atm.pl": 1,
    "ato.br": 1,
    "atsugi.kanagawa.jp": 1,
    "atsuma.hokkaido.jp": 1,
    "au.eu.org": 1,
    "audnedaln.no": 1,
    "augustow.pl": 1,
    "aukra.no": 1,
    "aure.no": 1,
    "aurland.no": 1,
    "aurskog-holand.no": 1,
    "aurskog-h\u00f8land.no": 1,
    "austevoll.no": 1,
    "austin.museum": 1,
    "australia.museum": 1,
    "austrheim.no": 1,
    "author.aero": 1,
    "auto.pl": 1,
    "automotive.museum": 1,
    "av.it": 1,
    "av.tr": 1,
    "avellino.it": 1,
    "averoy.no": 1,
    "aver\u00f8y.no": 1,
    "aviation.museum": 1,
    "avocat.fr": 1,
    "avocat.pro": 1,
    "avoues.fr": 1,
    "awaji.hyogo.jp": 1,
    "axis.museum": 1,
    "aya.miyazaki.jp": 1,
    "ayabe.kyoto.jp": 1,
    "ayagawa.kagawa.jp": 1,
    "ayase.kanagawa.jp": 1,
    "az.us": 1,
    "azumino.nagano.jp": 1,
    "azure-mobile.net": 1,
    "azurewebsites.net": 1,
    "a\u00e9roport.ci": 1,
    "b.bg": 1,
    "b.br": 1,
    "b.se": 1,
    "b.ssl.fastly.net": 1,
    "ba.it": 1,
    "babia-gora.pl": 1,
    "badaddja.no": 1,
    "badajoz.museum": 1,
    "baghdad.museum": 1,
    "bahcavuotna.no": 1,
    "bahccavuotna.no": 1,
    "bahn.museum": 1,
    "baidar.no": 1,
    "baikal.ru": 1,
    "bajddar.no": 1,
    "balashov.su": 1,
    "balat.no": 1,
    "bale.museum": 1,
    "balestrand.no": 1,
    "ballangen.no": 1,
    "ballooning.aero": 1,
    "balsan.it": 1,
    "balsfjord.no": 1,
    "baltimore.museum": 1,
    "bamble.no": 1,
    "bandai.fukushima.jp": 1,
    "bando.ibaraki.jp": 1,
    "bar.pro": 1,
    "barcelona.museum": 1,
    "bardu.no": 1,
    "bari.it": 1,
    "barletta-trani-andria.it": 1,
    "barlettatraniandria.it": 1,
    "barreau.bj": 1,
    "barrel-of-knowledge.info": 1,
    "barrell-of-knowledge.info": 1,
    "barum.no": 1,
    "bas.it": 1,
    "baseball.museum": 1,
    "basel.museum": 1,
    "bashkiria.ru": 1,
    "bashkiria.su": 1,
    "basilicata.it": 1,
    "baths.museum": 1,
    "bato.tochigi.jp": 1,
    "batsfjord.no": 1,
    "bauern.museum": 1,
    "bbs.tr": 1,
    "bc.ca": 1,
    "bd": 2,
    "bd.se": 1,
    "be.eu.org": 1,
    "bearalvahki.no": 1,
    "bearalv\u00e1hki.no": 1,
    "beardu.no": 1,
    "beauxarts.museum": 1,
    "bedzin.pl": 1,
    "beeldengeluid.museum": 1,
    "beiarn.no": 1,
    "bel.tr": 1,
    "belau.pw": 1,
    "belgorod.ru": 1,
    "bellevue.museum": 1,
    "belluno.it": 1,
    "benevento.it": 1,
    "beppu.oita.jp": 1,
    "berg.no": 1,
    "bergamo.it": 1,
    "bergbau.museum": 1,
    "bergen.no": 1,
    "berkeley.museum": 1,
    "berlevag.no": 1,
    "berlev\u00e5g.no": 1,
    "berlin.museum": 1,
    "bern.museum": 1,
    "beskidy.pl": 1,
    "betainabox.com": 1,
    "better-than.tv": 1,
    "bg.eu.org": 1,
    "bg.it": 1,
    "bi.it": 1,
    "bialowieza.pl": 1,
    "bialystok.pl": 1,
    "bibai.hokkaido.jp": 1,
    "bible.museum": 1,
    "biei.hokkaido.jp": 1,
    "bielawa.pl": 1,
    "biella.it": 1,
    "bieszczady.pl": 1,
    "bievat.no": 1,
    "biev\u00e1t.no": 1,
    "bifuka.hokkaido.jp": 1,
    "bihoro.hokkaido.jp": 1,
    "bilbao.museum": 1,
    "bill.museum": 1,
    "bindal.no": 1,
    "bio.br": 1,
    "bir.ru": 1,
    "biratori.hokkaido.jp": 1,
    "birdart.museum": 1,
    "birkenes.no": 1,
    "birthplace.museum": 1,
    "biz.at": 1,
    "biz.az": 1,
    "biz.bb": 1,
    "biz.cy": 1,
    "biz.et": 1,
    "biz.id": 1,
    "biz.ki": 1,
    "biz.mv": 1,
    "biz.mw": 1,
    "biz.ni": 1,
    "biz.nr": 1,
    "biz.pk": 1,
    "biz.pl": 1,
    "biz.pr": 1,
    "biz.tj": 1,
    "biz.tr": 1,
    "biz.tt": 1,
    "biz.ua": 1,
    "biz.vn": 1,
    "bizen.okayama.jp": 1,
    "bj.cn": 1,
    "bjarkoy.no": 1,
    "bjark\u00f8y.no": 1,
    "bjerkreim.no": 1,
    "bjugn.no": 1,
    "bl.it": 1,
    "blog.br": 1,
    "blogdns.com": 1,
    "blogdns.net": 1,
    "blogdns.org": 1,
    "blogsite.org": 1,
    "blogspot.ae": 1,
    "blogspot.al": 1,
    "blogspot.am": 1,
    "blogspot.ba": 1,
    "blogspot.be": 1,
    "blogspot.bg": 1,
    "blogspot.bj": 1,
    "blogspot.ca": 1,
    "blogspot.cf": 1,
    "blogspot.ch": 1,
    "blogspot.cl": 1,
    "blogspot.co.at": 1,
    "blogspot.co.id": 1,
    "blogspot.co.il": 1,
    "blogspot.co.ke": 1,
    "blogspot.co.nz": 1,
    "blogspot.co.uk": 1,
    "blogspot.co.za": 1,
    "blogspot.com": 1,
    "blogspot.com.ar": 1,
    "blogspot.com.au": 1,
    "blogspot.com.br": 1,
    "blogspot.com.by": 1,
    "blogspot.com.co": 1,
    "blogspot.com.cy": 1,
    "blogspot.com.ee": 1,
    "blogspot.com.eg": 1,
    "blogspot.com.es": 1,
    "blogspot.com.mt": 1,
    "blogspot.com.ng": 1,
    "blogspot.com.tr": 1,
    "blogspot.com.uy": 1,
    "blogspot.cv": 1,
    "blogspot.cz": 1,
    "blogspot.de": 1,
    "blogspot.dk": 1,
    "blogspot.fi": 1,
    "blogspot.fr": 1,
    "blogspot.gr": 1,
    "blogspot.hk": 1,
    "blogspot.hr": 1,
    "blogspot.hu": 1,
    "blogspot.ie": 1,
    "blogspot.in": 1,
    "blogspot.is": 1,
    "blogspot.it": 1,
    "blogspot.jp": 1,
    "blogspot.kr": 1,
    "blogspot.li": 1,
    "blogspot.lt": 1,
    "blogspot.lu": 1,
    "blogspot.md": 1,
    "blogspot.mk": 1,
    "blogspot.mr": 1,
    "blogspot.mx": 1,
    "blogspot.my": 1,
    "blogspot.nl": 1,
    "blogspot.no": 1,
    "blogspot.pe": 1,
    "blogspot.pt": 1,
    "blogspot.qa": 1,
    "blogspot.re": 1,
    "blogspot.ro": 1,
    "blogspot.rs": 1,
    "blogspot.ru": 1,
    "blogspot.se": 1,
    "blogspot.sg": 1,
    "blogspot.si": 1,
    "blogspot.sk": 1,
    "blogspot.sn": 1,
    "blogspot.td": 1,
    "blogspot.tw": 1,
    "blogspot.ug": 1,
    "blogspot.vn": 1,
    "bmd.br": 1,
    "bmoattachments.org": 1,
    "bn": 2,
    "bn.it": 1,
    "bo.it": 1,
    "bo.nordland.no": 1,
    "bo.telemark.no": 1,
    "bodo.no": 1,
    "bod\u00f8.no": 1,
    "bokn.no": 1,
    "boldlygoingnowhere.org": 1,
    "boleslawiec.pl": 1,
    "bologna.it": 1,
    "bolt.hu": 1,
    "bolzano.it": 1,
    "bomlo.no": 1,
    "bonn.museum": 1,
    "boston.museum": 1,
    "botanical.museum": 1,
    "botanicalgarden.museum": 1,
    "botanicgarden.museum": 1,
    "botany.museum": 1,
    "bozen.it": 1,
    "br.com": 1,
    "br.it": 1,
    "brand.se": 1,
    "brandywinevalley.museum": 1,
    "brasil.museum": 1,
    "bremanger.no": 1,
    "brescia.it": 1,
    "brindisi.it": 1,
    "bristol.museum": 1,
    "british.museum": 1,
    "britishcolumbia.museum": 1,
    "broadcast.museum": 1,
    "broke-it.net": 1,
    "broker.aero": 1,
    "bronnoy.no": 1,
    "bronnoysund.no": 1,
    "brumunddal.no": 1,
    "brunel.museum": 1,
    "brussel.museum": 1,
    "brussels.museum": 1,
    "bruxelles.museum": 1,
    "bryansk.ru": 1,
    "bryansk.su": 1,
    "bryne.no": 1,
    "br\u00f8nn\u00f8y.no": 1,
    "br\u00f8nn\u00f8ysund.no": 1,
    "bs.it": 1,
    "bt.it": 1,
    "bu.no": 1,
    "budejju.no": 1,
    "building.museum": 1,
    "bungoono.oita.jp": 1,
    "bungotakada.oita.jp": 1,
    "bunkyo.tokyo.jp": 1,
    "burghof.museum": 1,
    "buryatia.ru": 1,
    "bus.museum": 1,
    "busan.kr": 1,
    "bushey.museum": 1,
    "buyshouses.net": 1,
    "buzen.fukuoka.jp": 1,
    "bv.nl": 1,
    "bydgoszcz.pl": 1,
    "bygland.no": 1,
    "bykle.no": 1,
    "bytom.pl": 1,
    "bz.it": 1,
    "b\u00e1hcavuotna.no": 1,
    "b\u00e1hccavuotna.no": 1,
    "b\u00e1id\u00e1r.no": 1,
    "b\u00e1jddar.no": 1,
    "b\u00e1l\u00e1t.no": 1,
    "b\u00e5d\u00e5ddj\u00e5.no": 1,
    "b\u00e5tsfjord.no": 1,
    "b\u00e6rum.no": 1,
    "b\u00f8.nordland.no": 1,
    "b\u00f8.telemark.no": 1,
    "b\u00f8mlo.no": 1,
    "c.bg": 1,
    "c.cdn77.org": 1,
    "c.la": 1,
    "c.se": 1,
    "ca.eu.org": 1,
    "ca.it": 1,
    "ca.na": 1,
    "ca.us": 1,
    "caa.aero": 1,
    "cadaques.museum": 1,
    "cagliari.it": 1,
    "cahcesuolo.no": 1,
    "cal.it": 1,
    "calabria.it": 1,
    "california.museum": 1,
    "caltanissetta.it": 1,
    "cam.it": 1,
    "cambridge.museum": 1,
    "campania.it": 1,
    "campidano-medio.it": 1,
    "campidanomedio.it": 1,
    "campobasso.it": 1,
    "can.museum": 1,
    "canada.museum": 1,
    "capebreton.museum": 1,
    "carbonia-iglesias.it": 1,
    "carboniaiglesias.it": 1,
    "cargo.aero": 1,
    "carrara-massa.it": 1,
    "carraramassa.it": 1,
    "carrier.museum": 1,
    "cartoonart.museum": 1,
    "casadelamoneda.museum": 1,
    "caserta.it": 1,
    "casino.hu": 1,
    "castle.museum": 1,
    "castres.museum": 1,
    "catania.it": 1,
    "catanzaro.it": 1,
    "catering.aero": 1,
    "cb.it": 1,
    "cbg.ru": 1,
    "cc.ak.us": 1,
    "cc.al.us": 1,
    "cc.ar.us": 1,
    "cc.as.us": 1,
    "cc.az.us": 1,
    "cc.ca.us": 1,
    "cc.co.us": 1,
    "cc.ct.us": 1,
    "cc.dc.us": 1,
    "cc.de.us": 1,
    "cc.fl.us": 1,
    "cc.ga.us": 1,
    "cc.gu.us": 1,
    "cc.hi.us": 1,
    "cc.ia.us": 1,
    "cc.id.us": 1,
    "cc.il.us": 1,
    "cc.in.us": 1,
    "cc.ks.us": 1,
    "cc.ky.us": 1,
    "cc.la.us": 1,
    "cc.ma.us": 1,
    "cc.md.us": 1,
    "cc.me.us": 1,
    "cc.mi.us": 1,
    "cc.mn.us": 1,
    "cc.mo.us": 1,
    "cc.ms.us": 1,
    "cc.mt.us": 1,
    "cc.na": 1,
    "cc.nc.us": 1,
    "cc.nd.us": 1,
    "cc.ne.us": 1,
    "cc.nh.us": 1,
    "cc.nj.us": 1,
    "cc.nm.us": 1,
    "cc.nv.us": 1,
    "cc.ny.us": 1,
    "cc.oh.us": 1,
    "cc.ok.us": 1,
    "cc.or.us": 1,
    "cc.pa.us": 1,
    "cc.pr.us": 1,
    "cc.ri.us": 1,
    "cc.sc.us": 1,
    "cc.sd.us": 1,
    "cc.tn.us": 1,
    "cc.tx.us": 1,
    "cc.ut.us": 1,
    "cc.va.us": 1,
    "cc.vi.us": 1,
    "cc.vt.us": 1,
    "cc.wa.us": 1,
    "cc.wi.us": 1,
    "cc.wv.us": 1,
    "cc.wy.us": 1,
    "cci.fr": 1,
    "cd.eu.org": 1,
    "cdn77-ssl.net": 1,
    "ce.it": 1,
    "cechire.com": 1,
    "celtic.museum": 1,
    "center.museum": 1,
    "certification.aero": 1,
    "cesena-forli.it": 1,
    "cesenaforli.it": 1,
    "ch.eu.org": 1,
    "ch.it": 1,
    "chambagri.fr": 1,
    "championship.aero": 1,
    "charter.aero": 1,
    "chattanooga.museum": 1,
    "chel.ru": 1,
    "cheltenham.museum": 1,
    "chelyabinsk.ru": 1,
    "cherkassy.ua": 1,
    "cherkasy.ua": 1,
    "chernigov.ua": 1,
    "chernihiv.ua": 1,
    "chernivtsi.ua": 1,
    "chernovtsy.ua": 1,
    "chesapeakebay.museum": 1,
    "chiba.jp": 1,
    "chicago.museum": 1,
    "chichibu.saitama.jp": 1,
    "chieti.it": 1,
    "chigasaki.kanagawa.jp": 1,
    "chihayaakasaka.osaka.jp": 1,
    "chijiwa.nagasaki.jp": 1,
    "chikugo.fukuoka.jp": 1,
    "chikuho.fukuoka.jp": 1,
    "chikuhoku.nagano.jp": 1,
    "chikujo.fukuoka.jp": 1,
    "chikuma.nagano.jp": 1,
    "chikusei.ibaraki.jp": 1,
    "chikushino.fukuoka.jp": 1,
    "chikuzen.fukuoka.jp": 1,
    "children.museum": 1,
    "childrens.museum": 1,
    "childrensgarden.museum": 1,
    "chino.nagano.jp": 1,
    "chippubetsu.hokkaido.jp": 1,
    "chiropractic.museum": 1,
    "chirurgiens-dentistes.fr": 1,
    "chiryu.aichi.jp": 1,
    "chita.aichi.jp": 1,
    "chita.ru": 1,
    "chitose.hokkaido.jp": 1,
    "chiyoda.gunma.jp": 1,
    "chiyoda.tokyo.jp": 1,
    "chizu.tottori.jp": 1,
    "chocolate.museum": 1,
    "chofu.tokyo.jp": 1,
    "chonan.chiba.jp": 1,
    "chosei.chiba.jp": 1,
    "choshi.chiba.jp": 1,
    "choyo.kumamoto.jp": 1,
    "christiansburg.museum": 1,
    "chtr.k12.ma.us": 1,
    "chukotka.ru": 1,
    "chungbuk.kr": 1,
    "chungnam.kr": 1,
    "chuo.chiba.jp": 1,
    "chuo.fukuoka.jp": 1,
    "chuo.osaka.jp": 1,
    "chuo.tokyo.jp": 1,
    "chuo.yamanashi.jp": 1,
    "chuvashia.ru": 1,
    "ci.it": 1,
    "cieszyn.pl": 1,
    "cim.br": 1,
    "cincinnati.museum": 1,
    "cinema.museum": 1,
    "circus.museum": 1,
    "city.hu": 1,
    "city.kawasaki.jp": 0,
    "city.kitakyushu.jp": 0,
    "city.kobe.jp": 0,
    "city.nagoya.jp": 0,
    "city.sapporo.jp": 0,
    "city.sendai.jp": 0,
    "city.yokohama.jp": 0,
    "civilaviation.aero": 1,
    "civilisation.museum": 1,
    "civilization.museum": 1,
    "civilwar.museum": 1,
    "ck": 2,
    "ck.ua": 1,
    "cl.it": 1,
    "clinton.museum": 1,
    "clock.museum": 1,
    "cloudapp.net": 1,
    "cloudcontrolapp.com": 1,
    "cloudcontrolled.com": 1,
    "cloudfront.net": 1,
    "cloudfunctions.net": 1,
    "club.aero": 1,
    "club.tw": 1,
    "cmw.ru": 1,
    "cn-north-1.compute.amazonaws.cn": 1,
    "cn.com": 1,
    "cn.eu.org": 1,
    "cn.it": 1,
    "cn.ua": 1,
    "cng.br": 1,
    "cnt.br": 1,
    "co.ae": 1,
    "co.ag": 1,
    "co.ao": 1,
    "co.at": 1,
    "co.ba": 1,
    "co.bb": 1,
    "co.bi": 1,
    "co.bw": 1,
    "co.ca": 1,
    "co.ci": 1,
    "co.cl": 1,
    "co.cm": 1,
    "co.com": 1,
    "co.cr": 1,
    "co.cz": 1,
    "co.gg": 1,
    "co.gl": 1,
    "co.gy": 1,
    "co.hu": 1,
    "co.id": 1,
    "co.il": 1,
    "co.im": 1,
    "co.in": 1,
    "co.ir": 1,
    "co.it": 1,
    "co.je": 1,
    "co.jp": 1,
    "co.kr": 1,
    "co.lc": 1,
    "co.ls": 1,
    "co.ma": 1,
    "co.me": 1,
    "co.mg": 1,
    "co.mu": 1,
    "co.mw": 1,
    "co.na": 1,
    "co.ni": 1,
    "co.nl": 1,
    "co.no": 1,
    "co.nz": 1,
    "co.om": 1,
    "co.pl": 1,
    "co.pn": 1,
    "co.pw": 1,
    "co.rs": 1,
    "co.rw": 1,
    "co.st": 1,
    "co.sz": 1,
    "co.th": 1,
    "co.tj": 1,
    "co.tm": 1,
    "co.tt": 1,
    "co.tz": 1,
    "co.ua": 1,
    "co.ug": 1,
    "co.uk": 1,
    "co.us": 1,
    "co.uz": 1,
    "co.ve": 1,
    "co.vi": 1,
    "co.za": 1,
    "coal.museum": 1,
    "coastaldefence.museum": 1,
    "codespot.com": 1,
    "cody.museum": 1,
    "coldwar.museum": 1,
    "collection.museum": 1,
    "colonialwilliamsburg.museum": 1,
    "coloradoplateau.museum": 1,
    "columbia.museum": 1,
    "columbus.museum": 1,
    "com.ac": 1,
    "com.af": 1,
    "com.ag": 1,
    "com.ai": 1,
    "com.al": 1,
    "com.ar": 1,
    "com.au": 1,
    "com.aw": 1,
    "com.az": 1,
    "com.ba": 1,
    "com.bb": 1,
    "com.bh": 1,
    "com.bi": 1,
    "com.bm": 1,
    "com.bo": 1,
    "com.br": 1,
    "com.bs": 1,
    "com.bt": 1,
    "com.by": 1,
    "com.bz": 1,
    "com.ci": 1,
    "com.cm": 1,
    "com.cn": 1,
    "com.co": 1,
    "com.cu": 1,
    "com.cw": 1,
    "com.cy": 1,
    "com.de": 1,
    "com.dm": 1,
    "com.do": 1,
    "com.dz": 1,
    "com.ec": 1,
    "com.ee": 1,
    "com.eg": 1,
    "com.es": 1,
    "com.et": 1,
    "com.fr": 1,
    "com.ge": 1,
    "com.gh": 1,
    "com.gi": 1,
    "com.gl": 1,
    "com.gn": 1,
    "com.gp": 1,
    "com.gr": 1,
    "com.gt": 1,
    "com.gy": 1,
    "com.hk": 1,
    "com.hn": 1,
    "com.hr": 1,
    "com.ht": 1,
    "com.im": 1,
    "com.io": 1,
    "com.iq": 1,
    "com.is": 1,
    "com.jo": 1,
    "com.kg": 1,
    "com.ki": 1,
    "com.km": 1,
    "com.kp": 1,
    "com.ky": 1,
    "com.kz": 1,
    "com.la": 1,
    "com.lb": 1,
    "com.lc": 1,
    "com.lk": 1,
    "com.lr": 1,
    "com.lv": 1,
    "com.ly": 1,
    "com.mg": 1,
    "com.mk": 1,
    "com.ml": 1,
    "com.mo": 1,
    "com.ms": 1,
    "com.mt": 1,
    "com.mu": 1,
    "com.mv": 1,
    "com.mw": 1,
    "com.mx": 1,
    "com.my": 1,
    "com.na": 1,
    "com.nf": 1,
    "com.ng": 1,
    "com.ni": 1,
    "com.nr": 1,
    "com.om": 1,
    "com.pa": 1,
    "com.pe": 1,
    "com.pf": 1,
    "com.ph": 1,
    "com.pk": 1,
    "com.pl": 1,
    "com.pr": 1,
    "com.ps": 1,
    "com.pt": 1,
    "com.py": 1,
    "com.qa": 1,
    "com.re": 1,
    "com.ro": 1,
    "com.ru": 1,
    "com.rw": 1,
    "com.sa": 1,
    "com.sb": 1,
    "com.sc": 1,
    "com.sd": 1,
    "com.se": 1,
    "com.sg": 1,
    "com.sh": 1,
    "com.sl": 1,
    "com.sn": 1,
    "com.so": 1,
    "com.st": 1,
    "com.sv": 1,
    "com.sy": 1,
    "com.tj": 1,
    "com.tm": 1,
    "com.tn": 1,
    "com.to": 1,
    "com.tr": 1,
    "com.tt": 1,
    "com.tw": 1,
    "com.ua": 1,
    "com.ug": 1,
    "com.uy": 1,
    "com.uz": 1,
    "com.vc": 1,
    "com.ve": 1,
    "com.vi": 1,
    "com.vn": 1,
    "com.vu": 1,
    "com.ws": 1,
    "communication.museum": 1,
    "communications.museum": 1,
    "community.museum": 1,
    "como.it": 1,
    "compute-1.amazonaws.com": 1,
    "compute.amazonaws.cn": 1,
    "compute.amazonaws.com": 1,
    "computer.museum": 1,
    "computerhistory.museum": 1,
    "comunica\u00e7\u00f5es.museum": 1,
    "conf.au": 1,
    "conf.lv": 1,
    "conference.aero": 1,
    "consulado.st": 1,
    "consultant.aero": 1,
    "consulting.aero": 1,
    "contemporary.museum": 1,
    "contemporaryart.museum": 1,
    "control.aero": 1,
    "convent.museum": 1,
    "coop.br": 1,
    "coop.ht": 1,
    "coop.km": 1,
    "coop.mv": 1,
    "coop.mw": 1,
    "coop.py": 1,
    "coop.tt": 1,
    "copenhagen.museum": 1,
    "corporation.museum": 1,
    "correios-e-telecomunica\u00e7\u00f5es.museum": 1,
    "corvette.museum": 1,
    "cosenza.it": 1,
    "costume.museum": 1,
    "council.aero": 1,
    "countryestate.museum": 1,
    "county.museum": 1,
    "cpa.pro": 1,
    "cq.cn": 1,
    "cr.it": 1,
    "cr.ua": 1,
    "crafts.museum": 1,
    "cranbrook.museum": 1,
    "creation.museum": 1,
    "cremona.it": 1,
    "crew.aero": 1,
    "cri.nz": 1,
    "crimea.ua": 1,
    "crotone.it": 1,
    "cs.it": 1,
    "ct.it": 1,
    "ct.us": 1,
    "cultural.museum": 1,
    "culturalcenter.museum": 1,
    "culture.museum": 1,
    "cuneo.it": 1,
    "cupcake.is": 1,
    "cv.ua": 1,
    "cy.eu.org": 1,
    "cyber.museum": 1,
    "cymru.museum": 1,
    "cz.eu.org": 1,
    "cz.it": 1,
    "czeladz.pl": 1,
    "czest.pl": 1,
    "d.bg": 1,
    "d.se": 1,
    "daegu.kr": 1,
    "daejeon.kr": 1,
    "dagestan.ru": 1,
    "dagestan.su": 1,
    "daigo.ibaraki.jp": 1,
    "daisen.akita.jp": 1,
    "daito.osaka.jp": 1,
    "daiwa.hiroshima.jp": 1,
    "dali.museum": 1,
    "dallas.museum": 1,
    "database.museum": 1,
    "date.fukushima.jp": 1,
    "date.hokkaido.jp": 1,
    "davvenjarga.no": 1,
    "davvenj\u00e1rga.no": 1,
    "davvesiida.no": 1,
    "dazaifu.fukuoka.jp": 1,
    "dc.us": 1,
    "ddr.museum": 1,
    "de.com": 1,
    "de.eu.org": 1,
    "de.us": 1,
    "deatnu.no": 1,
    "decorativearts.museum": 1,
    "defense.tn": 1,
    "delaware.museum": 1,
    "dell-ogliastra.it": 1,
    "dellogliastra.it": 1,
    "delmenhorst.museum": 1,
    "denmark.museum": 1,
    "dep.no": 1,
    "depot.museum": 1,
    "desa.id": 1,
    "design.aero": 1,
    "design.museum": 1,
    "detroit.museum": 1,
    "dgca.aero": 1,
    "dielddanuorri.no": 1,
    "dinosaur.museum": 1,
    "discovery.museum": 1,
    "diskstation.me": 1,
    "divtasvuodna.no": 1,
    "divttasvuotna.no": 1,
    "dk.eu.org": 1,
    "dlugoleka.pl": 1,
    "dn.ua": 1,
    "dnepropetrovsk.ua": 1,
    "dni.us": 1,
    "dnipropetrovsk.ua": 1,
    "dnsalias.com": 1,
    "dnsalias.net": 1,
    "dnsalias.org": 1,
    "dnsdojo.com": 1,
    "dnsdojo.net": 1,
    "dnsdojo.org": 1,
    "does-it.net": 1,
    "doesntexist.com": 1,
    "doesntexist.org": 1,
    "dolls.museum": 1,
    "dominic.ua": 1,
    "donetsk.ua": 1,
    "donna.no": 1,
    "donostia.museum": 1,
    "dontexist.com": 1,
    "dontexist.net": 1,
    "dontexist.org": 1,
    "doomdns.com": 1,
    "doomdns.org": 1,
    "doshi.yamanashi.jp": 1,
    "dovre.no": 1,
    "dp.ua": 1,
    "dr.na": 1,
    "dr.tr": 1,
    "drammen.no": 1,
    "drangedal.no": 1,
    "dreamhosters.com": 1,
    "drobak.no": 1,
    "dr\u00f8bak.no": 1,
    "dscloud.biz": 1,
    "dscloud.me": 1,
    "dscloud.mobi": 1,
    "dsmynas.com": 1,
    "dsmynas.net": 1,
    "dsmynas.org": 1,
    "duckdns.org": 1,
    "dudinka.ru": 1,
    "durham.museum": 1,
    "dvrdns.org": 1,
    "dyn-o-saur.com": 1,
    "dynalias.com": 1,
    "dynalias.net": 1,
    "dynalias.org": 1,
    "dynathome.net": 1,
    "dyndns-at-home.com": 1,
    "dyndns-at-work.com": 1,
    "dyndns-blog.com": 1,
    "dyndns-free.com": 1,
    "dyndns-home.com": 1,
    "dyndns-ip.com": 1,
    "dyndns-mail.com": 1,
    "dyndns-office.com": 1,
    "dyndns-pics.com": 1,
    "dyndns-remote.com": 1,
    "dyndns-server.com": 1,
    "dyndns-web.com": 1,
    "dyndns-wiki.com": 1,
    "dyndns-work.com": 1,
    "dyndns.biz": 1,
    "dyndns.info": 1,
    "dyndns.org": 1,
    "dyndns.tv": 1,
    "dyndns.ws": 1,
    "dynv6.net": 1,
    "dyroy.no": 1,
    "dyr\u00f8y.no": 1,
    "d\u00f8nna.no": 1,
    "e-burg.ru": 1,
    "e.bg": 1,
    "e.se": 1,
    "e12.ve": 1,
    "e164.arpa": 1,
    "eastafrica.museum": 1,
    "eastcoast.museum": 1,
    "ebetsu.hokkaido.jp": 1,
    "ebina.kanagawa.jp": 1,
    "ebino.miyazaki.jp": 1,
    "ebiz.tw": 1,
    "echizen.fukui.jp": 1,
    "ecn.br": 1,
    "eco.br": 1,
    "ed.ao": 1,
    "ed.ci": 1,
    "ed.cr": 1,
    "ed.jp": 1,
    "ed.pw": 1,
    "edogawa.tokyo.jp": 1,
    "edu.ac": 1,
    "edu.af": 1,
    "edu.al": 1,
    "edu.ar": 1,
    "edu.au": 1,
    "edu.az": 1,
    "edu.ba": 1,
    "edu.bb": 1,
    "edu.bh": 1,
    "edu.bi": 1,
    "edu.bm": 1,
    "edu.bo": 1,
    "edu.br": 1,
    "edu.bs": 1,
    "edu.bt": 1,
    "edu.bz": 1,
    "edu.ci": 1,
    "edu.cn": 1,
    "edu.co": 1,
    "edu.cu": 1,
    "edu.cw": 1,
    "edu.dm": 1,
    "edu.do": 1,
    "edu.dz": 1,
    "edu.ec": 1,
    "edu.ee": 1,
    "edu.eg": 1,
    "edu.es": 1,
    "edu.et": 1,
    "edu.eu.org": 1,
    "edu.ge": 1,
    "edu.gh": 1,
    "edu.gi": 1,
    "edu.gl": 1,
    "edu.gn": 1,
    "edu.gp": 1,
    "edu.gr": 1,
    "edu.gt": 1,
    "edu.gy": 1,
    "edu.hk": 1,
    "edu.hn": 1,
    "edu.ht": 1,
    "edu.in": 1,
    "edu.iq": 1,
    "edu.is": 1,
    "edu.it": 1,
    "edu.jo": 1,
    "edu.kg": 1,
    "edu.ki": 1,
    "edu.km": 1,
    "edu.kn": 1,
    "edu.kp": 1,
    "edu.ky": 1,
    "edu.kz": 1,
    "edu.la": 1,
    "edu.lb": 1,
    "edu.lc": 1,
    "edu.lk": 1,
    "edu.lr": 1,
    "edu.lv": 1,
    "edu.ly": 1,
    "edu.me": 1,
    "edu.mg": 1,
    "edu.mk": 1,
    "edu.ml": 1,
    "edu.mn": 1,
    "edu.mo": 1,
    "edu.ms": 1,
    "edu.mt": 1,
    "edu.mv": 1,
    "edu.mw": 1,
    "edu.mx": 1,
    "edu.my": 1,
    "edu.ng": 1,
    "edu.ni": 1,
    "edu.nr": 1,
    "edu.om": 1,
    "edu.pa": 1,
    "edu.pe": 1,
    "edu.pf": 1,
    "edu.ph": 1,
    "edu.pk": 1,
    "edu.pl": 1,
    "edu.pn": 1,
    "edu.pr": 1,
    "edu.ps": 1,
    "edu.pt": 1,
    "edu.py": 1,
    "edu.qa": 1,
    "edu.rs": 1,
    "edu.ru": 1,
    "edu.rw": 1,
    "edu.sa": 1,
    "edu.sb": 1,
    "edu.sc": 1,
    "edu.sd": 1,
    "edu.sg": 1,
    "edu.sl": 1,
    "edu.sn": 1,
    "edu.st": 1,
    "edu.sv": 1,
    "edu.sy": 1,
    "edu.tj": 1,
    "edu.tm": 1,
    "edu.to": 1,
    "edu.tr": 1,
    "edu.tt": 1,
    "edu.tw": 1,
    "edu.ua": 1,
    "edu.uy": 1,
    "edu.vc": 1,
    "edu.ve": 1,
    "edu.vn": 1,
    "edu.vu": 1,
    "edu.ws": 1,
    "edu.za": 1,
    "education.museum": 1,
    "educational.museum": 1,
    "educator.aero": 1,
    "edunet.tn": 1,
    "ee.eu.org": 1,
    "egersund.no": 1,
    "egyptian.museum": 1,
    "ehime.jp": 1,
    "eid.no": 1,
    "eidfjord.no": 1,
    "eidsberg.no": 1,
    "eidskog.no": 1,
    "eidsvoll.no": 1,
    "eigersund.no": 1,
    "eiheiji.fukui.jp": 1,
    "eisenbahn.museum": 1,
    "ekloges.cy": 1,
    "elasticbeanstalk.com": 1,
    "elb.amazonaws.com": 1,
    "elblag.pl": 1,
    "elburg.museum": 1,
    "elk.pl": 1,
    "elvendrell.museum": 1,
    "elverum.no": 1,
    "embaixada.st": 1,
    "embetsu.hokkaido.jp": 1,
    "embroidery.museum": 1,
    "emergency.aero": 1,
    "emilia-romagna.it": 1,
    "emiliaromagna.it": 1,
    "emp.br": 1,
    "emr.it": 1,
    "en.it": 1,
    "ena.gifu.jp": 1,
    "encyclopedic.museum": 1,
    "endofinternet.net": 1,
    "endofinternet.org": 1,
    "endoftheinternet.org": 1,
    "enebakk.no": 1,
    "eng.br": 1,
    "eng.pro": 1,
    "engerdal.no": 1,
    "engine.aero": 1,
    "engineer.aero": 1,
    "england.museum": 1,
    "eniwa.hokkaido.jp": 1,
    "enna.it": 1,
    "ens.tn": 1,
    "entertainment.aero": 1,
    "entomology.museum": 1,
    "environment.museum": 1,
    "environmentalconservation.museum": 1,
    "epilepsy.museum": 1,
    "equipment.aero": 1,
    "er": 2,
    "erimo.hokkaido.jp": 1,
    "erotica.hu": 1,
    "erotika.hu": 1,
    "es.eu.org": 1,
    "es.kr": 1,
    "esan.hokkaido.jp": 1,
    "esashi.hokkaido.jp": 1,
    "esp.br": 1,
    "essex.museum": 1,
    "est-a-la-maison.com": 1,
    "est-a-la-masion.com": 1,
    "est-le-patron.com": 1,
    "est-mon-blogueur.com": 1,
    "est.pr": 1,
    "estate.museum": 1,
    "etajima.hiroshima.jp": 1,
    "etc.br": 1,
    "ethnology.museum": 1,
    "eti.br": 1,
    "etne.no": 1,
    "etnedal.no": 1,
    "eu-central-1.compute.amazonaws.com": 1,
    "eu-west-1.compute.amazonaws.com": 1,
    "eu.com": 1,
    "eu.int": 1,
    "eu.org": 1,
    "eun.eg": 1,
    "evenassi.no": 1,
    "evenes.no": 1,
    "even\u00e1\u0161\u0161i.no": 1,
    "evje-og-hornnes.no": 1,
    "exchange.aero": 1,
    "exeter.museum": 1,
    "exhibition.museum": 1,
    "experts-comptables.fr": 1,
    "express.aero": 1,
    "f.bg": 1,
    "f.se": 1,
    "fam.pk": 1,
    "family.museum": 1,
    "familyds.com": 1,
    "familyds.net": 1,
    "familyds.org": 1,
    "far.br": 1,
    "fareast.ru": 1,
    "farm.museum": 1,
    "farmequipment.museum": 1,
    "farmers.museum": 1,
    "farmstead.museum": 1,
    "farsund.no": 1,
    "fauske.no": 1,
    "fc.it": 1,
    "fe.it": 1,
    "fed.us": 1,
    "federation.aero": 1,
    "fedje.no": 1,
    "fermo.it": 1,
    "ferrara.it": 1,
    "fet.no": 1,
    "fetsund.no": 1,
    "fg.it": 1,
    "fh.se": 1,
    "fhs.no": 1,
    "fhsk.se": 1,
    "fhv.se": 1,
    "fi.cr": 1,
    "fi.eu.org": 1,
    "fi.it": 1,
    "fie.ee": 1,
    "field.museum": 1,
    "figueres.museum": 1,
    "filatelia.museum": 1,
    "film.hu": 1,
    "film.museum": 1,
    "fin.ec": 1,
    "fin.tn": 1,
    "fineart.museum": 1,
    "finearts.museum": 1,
    "finland.museum": 1,
    "finnoy.no": 1,
    "finn\u00f8y.no": 1,
    "firebaseapp.com": 1,
    "firenze.it": 1,
    "firm.co": 1,
    "firm.ht": 1,
    "firm.in": 1,
    "firm.nf": 1,
    "firm.ro": 1,
    "firm.ve": 1,
    "fitjar.no": 1,
    "fj": 2,
    "fj.cn": 1,
    "fjaler.no": 1,
    "fjell.no": 1,
    "fk": 2,
    "fl.us": 1,
    "fla.no": 1,
    "flakstad.no": 1,
    "flanders.museum": 1,
    "flatanger.no": 1,
    "flekkefjord.no": 1,
    "flesberg.no": 1,
    "flight.aero": 1,
    "flog.br": 1,
    "flora.no": 1,
    "florence.it": 1,
    "florida.museum": 1,
    "floro.no": 1,
    "flor\u00f8.no": 1,
    "flynnhub.com": 1,
    "fl\u00e5.no": 1,
    "fm.br": 1,
    "fm.it": 1,
    "fm.no": 1,
    "fnd.br": 1,
    "foggia.it": 1,
    "folkebibl.no": 1,
    "folldal.no": 1,
    "for-better.biz": 1,
    "for-more.biz": 1,
    "for-our.info": 1,
    "for-some.biz": 1,
    "for-the.biz": 1,
    "force.museum": 1,
    "forde.no": 1,
    "forgot.her.name": 1,
    "forgot.his.name": 1,
    "forli-cesena.it": 1,
    "forlicesena.it": 1,
    "forsand.no": 1,
    "fortmissoula.museum": 1,
    "fortworth.museum": 1,
    "forum.hu": 1,
    "fosnes.no": 1,
    "fot.br": 1,
    "foundation.museum": 1,
    "fr.eu.org": 1,
    "fr.it": 1,
    "frana.no": 1,
    "francaise.museum": 1,
    "frankfurt.museum": 1,
    "franziskaner.museum": 1,
    "fredrikstad.no": 1,
    "freemasonry.museum": 1,
    "frei.no": 1,
    "freiburg.museum": 1,
    "freight.aero": 1,
    "fribourg.museum": 1,
    "friuli-v-giulia.it": 1,
    "friuli-ve-giulia.it": 1,
    "friuli-vegiulia.it": 1,
    "friuli-venezia-giulia.it": 1,
    "friuli-veneziagiulia.it": 1,
    "friuli-vgiulia.it": 1,
    "friuliv-giulia.it": 1,
    "friulive-giulia.it": 1,
    "friulivegiulia.it": 1,
    "friulivenezia-giulia.it": 1,
    "friuliveneziagiulia.it": 1,
    "friulivgiulia.it": 1,
    "frog.museum": 1,
    "frogn.no": 1,
    "froland.no": 1,
    "from-ak.com": 1,
    "from-al.com": 1,
    "from-ar.com": 1,
    "from-az.net": 1,
    "from-ca.com": 1,
    "from-co.net": 1,
    "from-ct.com": 1,
    "from-dc.com": 1,
    "from-de.com": 1,
    "from-fl.com": 1,
    "from-ga.com": 1,
    "from-hi.com": 1,
    "from-ia.com": 1,
    "from-id.com": 1,
    "from-il.com": 1,
    "from-in.com": 1,
    "from-ks.com": 1,
    "from-ky.com": 1,
    "from-la.net": 1,
    "from-ma.com": 1,
    "from-md.com": 1,
    "from-me.org": 1,
    "from-mi.com": 1,
    "from-mn.com": 1,
    "from-mo.com": 1,
    "from-ms.com": 1,
    "from-mt.com": 1,
    "from-nc.com": 1,
    "from-nd.com": 1,
    "from-ne.com": 1,
    "from-nh.com": 1,
    "from-nj.com": 1,
    "from-nm.com": 1,
    "from-nv.com": 1,
    "from-ny.net": 1,
    "from-oh.com": 1,
    "from-ok.com": 1,
    "from-or.com": 1,
    "from-pa.com": 1,
    "from-pr.com": 1,
    "from-ri.com": 1,
    "from-sc.com": 1,
    "from-sd.com": 1,
    "from-tn.com": 1,
    "from-tx.com": 1,
    "from-ut.com": 1,
    "from-va.com": 1,
    "from-vt.com": 1,
    "from-wa.com": 1,
    "from-wi.com": 1,
    "from-wv.com": 1,
    "from-wy.com": 1,
    "from.hr": 1,
    "frosinone.it": 1,
    "frosta.no": 1,
    "froya.no": 1,
    "fr\u00e6na.no": 1,
    "fr\u00f8ya.no": 1,
    "fst.br": 1,
    "ftpaccess.cc": 1,
    "fuchu.hiroshima.jp": 1,
    "fuchu.tokyo.jp": 1,
    "fuchu.toyama.jp": 1,
    "fudai.iwate.jp": 1,
    "fuefuki.yamanashi.jp": 1,
    "fuel.aero": 1,
    "fuettertdasnetz.de": 1,
    "fuji.shizuoka.jp": 1,
    "fujieda.shizuoka.jp": 1,
    "fujiidera.osaka.jp": 1,
    "fujikawa.shizuoka.jp": 1,
    "fujikawa.yamanashi.jp": 1,
    "fujikawaguchiko.yamanashi.jp": 1,
    "fujimi.nagano.jp": 1,
    "fujimi.saitama.jp": 1,
    "fujimino.saitama.jp": 1,
    "fujinomiya.shizuoka.jp": 1,
    "fujioka.gunma.jp": 1,
    "fujisato.akita.jp": 1,
    "fujisawa.iwate.jp": 1,
    "fujisawa.kanagawa.jp": 1,
    "fujishiro.ibaraki.jp": 1,
    "fujiyoshida.yamanashi.jp": 1,
    "fukagawa.hokkaido.jp": 1,
    "fukaya.saitama.jp": 1,
    "fukuchi.fukuoka.jp": 1,
    "fukuchiyama.kyoto.jp": 1,
    "fukudomi.saga.jp": 1,
    "fukui.fukui.jp": 1,
    "fukui.jp": 1,
    "fukumitsu.toyama.jp": 1,
    "fukuoka.jp": 1,
    "fukuroi.shizuoka.jp": 1,
    "fukusaki.hyogo.jp": 1,
    "fukushima.fukushima.jp": 1,
    "fukushima.hokkaido.jp": 1,
    "fukushima.jp": 1,
    "fukuyama.hiroshima.jp": 1,
    "funabashi.chiba.jp": 1,
    "funagata.yamagata.jp": 1,
    "funahashi.toyama.jp": 1,
    "fundacio.museum": 1,
    "fuoisku.no": 1,
    "fuossko.no": 1,
    "furano.hokkaido.jp": 1,
    "furniture.museum": 1,
    "furubira.hokkaido.jp": 1,
    "furudono.fukushima.jp": 1,
    "furukawa.miyagi.jp": 1,
    "fusa.no": 1,
    "fuso.aichi.jp": 1,
    "fussa.tokyo.jp": 1,
    "futaba.fukushima.jp": 1,
    "futsu.nagasaki.jp": 1,
    "futtsu.chiba.jp": 1,
    "fvg.it": 1,
    "fylkesbibl.no": 1,
    "fyresdal.no": 1,
    "f\u00f8rde.no": 1,
    "g.bg": 1,
    "g.se": 1,
    "g12.br": 1,
    "ga.us": 1,
    "gaivuotna.no": 1,
    "gallery.museum": 1,
    "galsa.no": 1,
    "gamagori.aichi.jp": 1,
    "game-host.org": 1,
    "game-server.cc": 1,
    "game.tw": 1,
    "games.hu": 1,
    "gamo.shiga.jp": 1,
    "gamvik.no": 1,
    "gangaviika.no": 1,
    "gangwon.kr": 1,
    "garden.museum": 1,
    "gateway.museum": 1,
    "gaular.no": 1,
    "gausdal.no": 1,
    "gb.com": 1,
    "gb.net": 1,
    "gc.ca": 1,
    "gd.cn": 1,
    "gda.pl": 1,
    "gdansk.pl": 1,
    "gdynia.pl": 1,
    "ge.it": 1,
    "geek.nz": 1,
    "geelvinck.museum": 1,
    "geisei.kochi.jp": 1,
    "gemological.museum": 1,
    "gen.in": 1,
    "gen.nz": 1,
    "gen.tr": 1,
    "genkai.saga.jp": 1,
    "genoa.it": 1,
    "genova.it": 1,
    "geology.museum": 1,
    "geometre-expert.fr": 1,
    "georgia.museum": 1,
    "getmyip.com": 1,
    "gets-it.net": 1,
    "ggf.br": 1,
    "giehtavuoatna.no": 1,
    "giessen.museum": 1,
    "gifu.gifu.jp": 1,
    "gifu.jp": 1,
    "gildeskal.no": 1,
    "gildesk\u00e5l.no": 1,
    "ginan.gifu.jp": 1,
    "ginowan.okinawa.jp": 1,
    "ginoza.okinawa.jp": 1,
    "giske.no": 1,
    "github.io": 1,
    "githubusercontent.com": 1,
    "gjemnes.no": 1,
    "gjerdrum.no": 1,
    "gjerstad.no": 1,
    "gjesdal.no": 1,
    "gjovik.no": 1,
    "gj\u00f8vik.no": 1,
    "glas.museum": 1,
    "glass.museum": 1,
    "gliding.aero": 1,
    "gliwice.pl": 1,
    "global.prod.fastly.net": 1,
    "global.ssl.fastly.net": 1,
    "glogow.pl": 1,
    "gloppen.no": 1,
    "gmina.pl": 1,
    "gniezno.pl": 1,
    "go.ci": 1,
    "go.cr": 1,
    "go.dyndns.org": 1,
    "go.id": 1,
    "go.it": 1,
    "go.jp": 1,
    "go.kr": 1,
    "go.pw": 1,
    "go.th": 1,
    "go.tj": 1,
    "go.tz": 1,
    "go.ug": 1,
    "gob.ar": 1,
    "gob.bo": 1,
    "gob.cl": 1,
    "gob.do": 1,
    "gob.ec": 1,
    "gob.es": 1,
    "gob.gt": 1,
    "gob.hn": 1,
    "gob.mx": 1,
    "gob.ni": 1,
    "gob.pa": 1,
    "gob.pe": 1,
    "gob.pk": 1,
    "gob.sv": 1,
    "gob.ve": 1,
    "gobo.wakayama.jp": 1,
    "godo.gifu.jp": 1,
    "gojome.akita.jp": 1,
    "gok.pk": 1,
    "gokase.miyazaki.jp": 1,
    "gol.no": 1,
    "gon.pk": 1,
    "gonohe.aomori.jp": 1,
    "googleapis.com": 1,
    "googlecode.com": 1,
    "gop.pk": 1,
    "gorge.museum": 1,
    "gorizia.it": 1,
    "gorlice.pl": 1,
    "gos.pk": 1,
    "gose.nara.jp": 1,
    "gosen.niigata.jp": 1,
    "goshiki.hyogo.jp": 1,
    "gotdns.com": 1,
    "gotdns.org": 1,
    "gotemba.shizuoka.jp": 1,
    "goto.nagasaki.jp": 1,
    "gotpantheon.com": 1,
    "gotsu.shimane.jp": 1,
    "gouv.bj": 1,
    "gouv.ci": 1,
    "gouv.fr": 1,
    "gouv.ht": 1,
    "gouv.km": 1,
    "gouv.ml": 1,
    "gouv.rw": 1,
    "gouv.sn": 1,
    "gov.ac": 1,
    "gov.ae": 1,
    "gov.af": 1,
    "gov.al": 1,
    "gov.ar": 1,
    "gov.as": 1,
    "gov.au": 1,
    "gov.az": 1,
    "gov.ba": 1,
    "gov.bb": 1,
    "gov.bf": 1,
    "gov.bh": 1,
    "gov.bm": 1,
    "gov.bo": 1,
    "gov.br": 1,
    "gov.bs": 1,
    "gov.bt": 1,
    "gov.by": 1,
    "gov.bz": 1,
    "gov.cd": 1,
    "gov.cl": 1,
    "gov.cm": 1,
    "gov.cn": 1,
    "gov.co": 1,
    "gov.cu": 1,
    "gov.cx": 1,
    "gov.cy": 1,
    "gov.dm": 1,
    "gov.do": 1,
    "gov.dz": 1,
    "gov.ec": 1,
    "gov.ee": 1,
    "gov.eg": 1,
    "gov.et": 1,
    "gov.ge": 1,
    "gov.gh": 1,
    "gov.gi": 1,
    "gov.gn": 1,
    "gov.gr": 1,
    "gov.gy": 1,
    "gov.hk": 1,
    "gov.ie": 1,
    "gov.il": 1,
    "gov.in": 1,
    "gov.iq": 1,
    "gov.ir": 1,
    "gov.is": 1,
    "gov.it": 1,
    "gov.jo": 1,
    "gov.kg": 1,
    "gov.ki": 1,
    "gov.km": 1,
    "gov.kn": 1,
    "gov.kp": 1,
    "gov.ky": 1,
    "gov.kz": 1,
    "gov.la": 1,
    "gov.lb": 1,
    "gov.lc": 1,
    "gov.lk": 1,
    "gov.lr": 1,
    "gov.lt": 1,
    "gov.lv": 1,
    "gov.ly": 1,
    "gov.ma": 1,
    "gov.me": 1,
    "gov.mg": 1,
    "gov.mk": 1,
    "gov.ml": 1,
    "gov.mn": 1,
    "gov.mo": 1,
    "gov.mr": 1,
    "gov.ms": 1,
    "gov.mu": 1,
    "gov.mv": 1,
    "gov.mw": 1,
    "gov.my": 1,
    "gov.nc.tr": 1,
    "gov.ng": 1,
    "gov.nr": 1,
    "gov.om": 1,
    "gov.ph": 1,
    "gov.pk": 1,
    "gov.pl": 1,
    "gov.pn": 1,
    "gov.pr": 1,
    "gov.ps": 1,
    "gov.pt": 1,
    "gov.py": 1,
    "gov.qa": 1,
    "gov.rs": 1,
    "gov.ru": 1,
    "gov.rw": 1,
    "gov.sa": 1,
    "gov.sb": 1,
    "gov.sc": 1,
    "gov.sd": 1,
    "gov.sg": 1,
    "gov.sh": 1,
    "gov.sl": 1,
    "gov.st": 1,
    "gov.sx": 1,
    "gov.sy": 1,
    "gov.tj": 1,
    "gov.tl": 1,
    "gov.tm": 1,
    "gov.tn": 1,
    "gov.to": 1,
    "gov.tr": 1,
    "gov.tt": 1,
    "gov.tw": 1,
    "gov.ua": 1,
    "gov.uk": 1,
    "gov.vc": 1,
    "gov.ve": 1,
    "gov.vn": 1,
    "gov.ws": 1,
    "gov.za": 1,
    "government.aero": 1,
    "govt.nz": 1,
    "gr.com": 1,
    "gr.eu.org": 1,
    "gr.it": 1,
    "gr.jp": 1,
    "grajewo.pl": 1,
    "gran.no": 1,
    "grandrapids.museum": 1,
    "grane.no": 1,
    "granvin.no": 1,
    "gratangen.no": 1,
    "graz.museum": 1,
    "greta.fr": 1,
    "grimstad.no": 1,
    "griw.gov.pl": 1,
    "groks-the.info": 1,
    "groks-this.info": 1,
    "grondar.za": 1,
    "grong.no": 1,
    "grosseto.it": 1,
    "groundhandling.aero": 1,
    "group.aero": 1,
    "grozny.ru": 1,
    "grozny.su": 1,
    "grp.lk": 1,
    "grue.no": 1,
    "gs.aa.no": 1,
    "gs.ah.no": 1,
    "gs.bu.no": 1,
    "gs.cn": 1,
    "gs.fm.no": 1,
    "gs.hl.no": 1,
    "gs.hm.no": 1,
    "gs.jan-mayen.no": 1,
    "gs.mr.no": 1,
    "gs.nl.no": 1,
    "gs.nt.no": 1,
    "gs.of.no": 1,
    "gs.ol.no": 1,
    "gs.oslo.no": 1,
    "gs.rl.no": 1,
    "gs.sf.no": 1,
    "gs.st.no": 1,
    "gs.svalbard.no": 1,
    "gs.tm.no": 1,
    "gs.tr.no": 1,
    "gs.va.no": 1,
    "gs.vf.no": 1,
    "gsm.pl": 1,
    "gu": 2,
    "gu.us": 1,
    "gub.uy": 1,
    "guernsey.museum": 1,
    "gujo.gifu.jp": 1,
    "gulen.no": 1,
    "gunma.jp": 1,
    "guovdageaidnu.no": 1,
    "gushikami.okinawa.jp": 1,
    "gv.ao": 1,
    "gv.at": 1,
    "gwangju.kr": 1,
    "gx.cn": 1,
    "gyeongbuk.kr": 1,
    "gyeonggi.kr": 1,
    "gyeongnam.kr": 1,
    "gyokuto.kumamoto.jp": 1,
    "gz.cn": 1,
    "g\u00e1ivuotna.no": 1,
    "g\u00e1ls\u00e1.no": 1,
    "g\u00e1\u014bgaviika.no": 1,
    "h.bg": 1,
    "h.se": 1,
    "ha.cn": 1,
    "ha.no": 1,
    "habikino.osaka.jp": 1,
    "habmer.no": 1,
    "haboro.hokkaido.jp": 1,
    "hachijo.tokyo.jp": 1,
    "hachinohe.aomori.jp": 1,
    "hachioji.tokyo.jp": 1,
    "hachirogata.akita.jp": 1,
    "hadano.kanagawa.jp": 1,
    "hadsel.no": 1,
    "haebaru.okinawa.jp": 1,
    "haga.tochigi.jp": 1,
    "hagebostad.no": 1,
    "hagi.yamaguchi.jp": 1,
    "haibara.shizuoka.jp": 1,
    "hakata.fukuoka.jp": 1,
    "hakodate.hokkaido.jp": 1,
    "hakone.kanagawa.jp": 1,
    "hakuba.nagano.jp": 1,
    "hakui.ishikawa.jp": 1,
    "hakusan.ishikawa.jp": 1,
    "halden.no": 1,
    "halloffame.museum": 1,
    "halsa.no": 1,
    "ham-radio-op.net": 1,
    "hamada.shimane.jp": 1,
    "hamamatsu.shizuoka.jp": 1,
    "hamar.no": 1,
    "hamaroy.no": 1,
    "hamatama.saga.jp": 1,
    "hamatonbetsu.hokkaido.jp": 1,
    "hamburg.museum": 1,
    "hammarfeasta.no": 1,
    "hammerfest.no": 1,
    "hamura.tokyo.jp": 1,
    "hanamaki.iwate.jp": 1,
    "hanamigawa.chiba.jp": 1,
    "hanawa.fukushima.jp": 1,
    "handa.aichi.jp": 1,
    "handson.museum": 1,
    "hanggliding.aero": 1,
    "hannan.osaka.jp": 1,
    "hanno.saitama.jp": 1,
    "hanyu.saitama.jp": 1,
    "hapmir.no": 1,
    "happou.akita.jp": 1,
    "hara.nagano.jp": 1,
    "haram.no": 1,
    "hareid.no": 1,
    "harima.hyogo.jp": 1,
    "harstad.no": 1,
    "harvestcelebration.museum": 1,
    "hasama.oita.jp": 1,
    "hasami.nagasaki.jp": 1,
    "hashbang.sh": 1,
    "hashikami.aomori.jp": 1,
    "hashima.gifu.jp": 1,
    "hashimoto.wakayama.jp": 1,
    "hasuda.saitama.jp": 1,
    "hasvik.no": 1,
    "hatogaya.saitama.jp": 1,
    "hatoyama.saitama.jp": 1,
    "hatsukaichi.hiroshima.jp": 1,
    "hattfjelldal.no": 1,
    "haugesund.no": 1,
    "hawaii.museum": 1,
    "hayakawa.yamanashi.jp": 1,
    "hayashima.okayama.jp": 1,
    "hazu.aichi.jp": 1,
    "hb.cn": 1,
    "he.cn": 1,
    "health.museum": 1,
    "health.nz": 1,
    "health.vn": 1,
    "heguri.nara.jp": 1,
    "heimatunduhren.museum": 1,
    "hekinan.aichi.jp": 1,
    "hellas.museum": 1,
    "helsinki.museum": 1,
    "hembygdsforbund.museum": 1,
    "hemne.no": 1,
    "hemnes.no": 1,
    "hemsedal.no": 1,
    "herad.no": 1,
    "here-for-more.info": 1,
    "heritage.museum": 1,
    "herokuapp.com": 1,
    "herokussl.com": 1,
    "heroy.more-og-romsdal.no": 1,
    "heroy.nordland.no": 1,
    "her\u00f8y.m\u00f8re-og-romsdal.no": 1,
    "her\u00f8y.nordland.no": 1,
    "hi.cn": 1,
    "hi.us": 1,
    "hichiso.gifu.jp": 1,
    "hida.gifu.jp": 1,
    "hidaka.hokkaido.jp": 1,
    "hidaka.kochi.jp": 1,
    "hidaka.saitama.jp": 1,
    "hidaka.wakayama.jp": 1,
    "higashi.fukuoka.jp": 1,
    "higashi.fukushima.jp": 1,
    "higashi.okinawa.jp": 1,
    "higashiagatsuma.gunma.jp": 1,
    "higashichichibu.saitama.jp": 1,
    "higashihiroshima.hiroshima.jp": 1,
    "higashiizu.shizuoka.jp": 1,
    "higashiizumo.shimane.jp": 1,
    "higashikagawa.kagawa.jp": 1,
    "higashikagura.hokkaido.jp": 1,
    "higashikawa.hokkaido.jp": 1,
    "higashikurume.tokyo.jp": 1,
    "higashimatsushima.miyagi.jp": 1,
    "higashimatsuyama.saitama.jp": 1,
    "higashimurayama.tokyo.jp": 1,
    "higashinaruse.akita.jp": 1,
    "higashine.yamagata.jp": 1,
    "higashiomi.shiga.jp": 1,
    "higashiosaka.osaka.jp": 1,
    "higashishirakawa.gifu.jp": 1,
    "higashisumiyoshi.osaka.jp": 1,
    "higashitsuno.kochi.jp": 1,
    "higashiura.aichi.jp": 1,
    "higashiyama.kyoto.jp": 1,
    "higashiyamato.tokyo.jp": 1,
    "higashiyodogawa.osaka.jp": 1,
    "higashiyoshino.nara.jp": 1,
    "hiji.oita.jp": 1,
    "hikari.yamaguchi.jp": 1,
    "hikawa.shimane.jp": 1,
    "hikimi.shimane.jp": 1,
    "hikone.shiga.jp": 1,
    "himeji.hyogo.jp": 1,
    "himeshima.oita.jp": 1,
    "himi.toyama.jp": 1,
    "hino.tokyo.jp": 1,
    "hino.tottori.jp": 1,
    "hinode.tokyo.jp": 1,
    "hinohara.tokyo.jp": 1,
    "hioki.kagoshima.jp": 1,
    "hirado.nagasaki.jp": 1,
    "hiraizumi.iwate.jp": 1,
    "hirakata.osaka.jp": 1,
    "hiranai.aomori.jp": 1,
    "hirara.okinawa.jp": 1,
    "hirata.fukushima.jp": 1,
    "hiratsuka.kanagawa.jp": 1,
    "hiraya.nagano.jp": 1,
    "hirogawa.wakayama.jp": 1,
    "hirokawa.fukuoka.jp": 1,
    "hirono.fukushima.jp": 1,
    "hirono.iwate.jp": 1,
    "hiroo.hokkaido.jp": 1,
    "hirosaki.aomori.jp": 1,
    "hiroshima.jp": 1,
    "hisayama.fukuoka.jp": 1,
    "histoire.museum": 1,
    "historical.museum": 1,
    "historicalsociety.museum": 1,
    "historichouses.museum": 1,
    "historisch.museum": 1,
    "historisches.museum": 1,
    "history.museum": 1,
    "historyofscience.museum": 1,
    "hita.oita.jp": 1,
    "hitachi.ibaraki.jp": 1,
    "hitachinaka.ibaraki.jp": 1,
    "hitachiomiya.ibaraki.jp": 1,
    "hitachiota.ibaraki.jp": 1,
    "hitoyoshi.kumamoto.jp": 1,
    "hitra.no": 1,
    "hizen.saga.jp": 1,
    "hjartdal.no": 1,
    "hjelmeland.no": 1,
    "hk.cn": 1,
    "hk.com": 1,
    "hk.org": 1,
    "hl.cn": 1,
    "hl.no": 1,
    "hm.no": 1,
    "hn.cn": 1,
    "hobby-site.com": 1,
    "hobby-site.org": 1,
    "hobol.no": 1,
    "hob\u00f8l.no": 1,
    "hof.no": 1,
    "hofu.yamaguchi.jp": 1,
    "hokkaido.jp": 1,
    "hokksund.no": 1,
    "hokuryu.hokkaido.jp": 1,
    "hokuto.hokkaido.jp": 1,
    "hokuto.yamanashi.jp": 1,
    "hol.no": 1,
    "hole.no": 1,
    "holmestrand.no": 1,
    "holtalen.no": 1,
    "holt\u00e5len.no": 1,
    "home.dyndns.org": 1,
    "homebuilt.aero": 1,
    "homedns.org": 1,
    "homeftp.net": 1,
    "homeftp.org": 1,
    "homeip.net": 1,
    "homelinux.com": 1,
    "homelinux.net": 1,
    "homelinux.org": 1,
    "homeunix.com": 1,
    "homeunix.net": 1,
    "homeunix.org": 1,
    "honai.ehime.jp": 1,
    "honbetsu.hokkaido.jp": 1,
    "honefoss.no": 1,
    "hongo.hiroshima.jp": 1,
    "honjo.akita.jp": 1,
    "honjo.saitama.jp": 1,
    "honjyo.akita.jp": 1,
    "hornindal.no": 1,
    "horokanai.hokkaido.jp": 1,
    "horology.museum": 1,
    "horonobe.hokkaido.jp": 1,
    "horten.no": 1,
    "hotel.hu": 1,
    "hotel.lk": 1,
    "hotel.tz": 1,
    "house.museum": 1,
    "hoyanger.no": 1,
    "hoylandet.no": 1,
    "hr.eu.org": 1,
    "hs.kr": 1,
    "hu.com": 1,
    "hu.eu.org": 1,
    "hu.net": 1,
    "huissier-justice.fr": 1,
    "humanities.museum": 1,
    "hurdal.no": 1,
    "hurum.no": 1,
    "hvaler.no": 1,
    "hyllestad.no": 1,
    "hyogo.jp": 1,
    "hyuga.miyazaki.jp": 1,
    "h\u00e1bmer.no": 1,
    "h\u00e1mm\u00e1rfeasta.no": 1,
    "h\u00e1pmir.no": 1,
    "h\u00e5.no": 1,
    "h\u00e6gebostad.no": 1,
    "h\u00f8nefoss.no": 1,
    "h\u00f8yanger.no": 1,
    "h\u00f8ylandet.no": 1,
    "i.bg": 1,
    "i.ng": 1,
    "i.ph": 1,
    "i.se": 1,
    "i234.me": 1,
    "ia.us": 1,
    "iamallama.com": 1,
    "ibara.okayama.jp": 1,
    "ibaraki.ibaraki.jp": 1,
    "ibaraki.jp": 1,
    "ibaraki.osaka.jp": 1,
    "ibestad.no": 1,
    "ibigawa.gifu.jp": 1,
    "ic.gov.pl": 1,
    "ichiba.tokushima.jp": 1,
    "ichihara.chiba.jp": 1,
    "ichikai.tochigi.jp": 1,
    "ichikawa.chiba.jp": 1,
    "ichikawa.hyogo.jp": 1,
    "ichikawamisato.yamanashi.jp": 1,
    "ichinohe.iwate.jp": 1,
    "ichinomiya.aichi.jp": 1,
    "ichinomiya.chiba.jp": 1,
    "ichinoseki.iwate.jp": 1,
    "id.au": 1,
    "id.ir": 1,
    "id.lv": 1,
    "id.ly": 1,
    "id.us": 1,
    "ide.kyoto.jp": 1,
    "idf.il": 1,
    "idrett.no": 1,
    "idv.hk": 1,
    "idv.tw": 1,
    "ie.eu.org": 1,
    "if.ua": 1,
    "iglesias-carbonia.it": 1,
    "iglesiascarbonia.it": 1,
    "iheya.okinawa.jp": 1,
    "iida.nagano.jp": 1,
    "iide.yamagata.jp": 1,
    "iijima.nagano.jp": 1,
    "iitate.fukushima.jp": 1,
    "iiyama.nagano.jp": 1,
    "iizuka.fukuoka.jp": 1,
    "iizuna.nagano.jp": 1,
    "ikaruga.nara.jp": 1,
    "ikata.ehime.jp": 1,
    "ikawa.akita.jp": 1,
    "ikeda.fukui.jp": 1,
    "ikeda.gifu.jp": 1,
    "ikeda.hokkaido.jp": 1,
    "ikeda.nagano.jp": 1,
    "ikeda.osaka.jp": 1,
    "iki.fi": 1,
    "iki.nagasaki.jp": 1,
    "ikoma.nara.jp": 1,
    "ikusaka.nagano.jp": 1,
    "il.eu.org": 1,
    "il.us": 1,
    "ilawa.pl": 1,
    "illustration.museum": 1,
    "im.it": 1,
    "imabari.ehime.jp": 1,
    "imageandsound.museum": 1,
    "imakane.hokkaido.jp": 1,
    "imari.saga.jp": 1,
    "imb.br": 1,
    "imizu.toyama.jp": 1,
    "imperia.it": 1,
    "in-addr.arpa": 1,
    "in-the-band.net": 1,
    "in.eu.org": 1,
    "in.na": 1,
    "in.net": 1,
    "in.ni": 1,
    "in.rs": 1,
    "in.th": 1,
    "in.ua": 1,
    "in.us": 1,
    "ina.ibaraki.jp": 1,
    "ina.nagano.jp": 1,
    "ina.saitama.jp": 1,
    "inabe.mie.jp": 1,
    "inagawa.hyogo.jp": 1,
    "inagi.tokyo.jp": 1,
    "inami.toyama.jp": 1,
    "inami.wakayama.jp": 1,
    "inashiki.ibaraki.jp": 1,
    "inatsuki.fukuoka.jp": 1,
    "inawashiro.fukushima.jp": 1,
    "inazawa.aichi.jp": 1,
    "inc.hk": 1,
    "incheon.kr": 1,
    "ind.br": 1,
    "ind.gt": 1,
    "ind.in": 1,
    "ind.tn": 1,
    "inderoy.no": 1,
    "inder\u00f8y.no": 1,
    "indian.museum": 1,
    "indiana.museum": 1,
    "indianapolis.museum": 1,
    "indianmarket.museum": 1,
    "ine.kyoto.jp": 1,
    "inf.br": 1,
    "inf.cu": 1,
    "inf.mk": 1,
    "info.at": 1,
    "info.au": 1,
    "info.az": 1,
    "info.bb": 1,
    "info.co": 1,
    "info.ec": 1,
    "info.et": 1,
    "info.ht": 1,
    "info.hu": 1,
    "info.ki": 1,
    "info.la": 1,
    "info.mv": 1,
    "info.na": 1,
    "info.nf": 1,
    "info.ni": 1,
    "info.nr": 1,
    "info.pk": 1,
    "info.pl": 1,
    "info.pr": 1,
    "info.ro": 1,
    "info.sd": 1,
    "info.tn": 1,
    "info.tr": 1,
    "info.tt": 1,
    "info.tz": 1,
    "info.ve": 1,
    "info.vn": 1,
    "ing.pa": 1,
    "ingatlan.hu": 1,
    "ino.kochi.jp": 1,
    "insurance.aero": 1,
    "int.ar": 1,
    "int.az": 1,
    "int.bo": 1,
    "int.ci": 1,
    "int.co": 1,
    "int.eu.org": 1,
    "int.is": 1,
    "int.la": 1,
    "int.lk": 1,
    "int.mv": 1,
    "int.mw": 1,
    "int.ni": 1,
    "int.pt": 1,
    "int.ru": 1,
    "int.rw": 1,
    "int.tj": 1,
    "int.tt": 1,
    "int.ve": 1,
    "int.vn": 1,
    "intelligence.museum": 1,
    "interactive.museum": 1,
    "intl.tn": 1,
    "inuyama.aichi.jp": 1,
    "inzai.chiba.jp": 1,
    "ip6.arpa": 1,
    "iraq.museum": 1,
    "iris.arpa": 1,
    "irkutsk.ru": 1,
    "iron.museum": 1,
    "iruma.saitama.jp": 1,
    "is-a-anarchist.com": 1,
    "is-a-blogger.com": 1,
    "is-a-bookkeeper.com": 1,
    "is-a-bruinsfan.org": 1,
    "is-a-bulls-fan.com": 1,
    "is-a-candidate.org": 1,
    "is-a-caterer.com": 1,
    "is-a-celticsfan.org": 1,
    "is-a-chef.com": 1,
    "is-a-chef.net": 1,
    "is-a-chef.org": 1,
    "is-a-conservative.com": 1,
    "is-a-cpa.com": 1,
    "is-a-cubicle-slave.com": 1,
    "is-a-democrat.com": 1,
    "is-a-designer.com": 1,
    "is-a-doctor.com": 1,
    "is-a-financialadvisor.com": 1,
    "is-a-geek.com": 1,
    "is-a-geek.net": 1,
    "is-a-geek.org": 1,
    "is-a-green.com": 1,
    "is-a-guru.com": 1,
    "is-a-hard-worker.com": 1,
    "is-a-hunter.com": 1,
    "is-a-knight.org": 1,
    "is-a-landscaper.com": 1,
    "is-a-lawyer.com": 1,
    "is-a-liberal.com": 1,
    "is-a-libertarian.com": 1,
    "is-a-linux-user.org": 1,
    "is-a-llama.com": 1,
    "is-a-musician.com": 1,
    "is-a-nascarfan.com": 1,
    "is-a-nurse.com": 1,
    "is-a-painter.com": 1,
    "is-a-patsfan.org": 1,
    "is-a-personaltrainer.com": 1,
    "is-a-photographer.com": 1,
    "is-a-player.com": 1,
    "is-a-republican.com": 1,
    "is-a-rockstar.com": 1,
    "is-a-socialist.com": 1,
    "is-a-soxfan.org": 1,
    "is-a-student.com": 1,
    "is-a-teacher.com": 1,
    "is-a-techie.com": 1,
    "is-a-therapist.com": 1,
    "is-an-accountant.com": 1,
    "is-an-actor.com": 1,
    "is-an-actress.com": 1,
    "is-an-anarchist.com": 1,
    "is-an-artist.com": 1,
    "is-an-engineer.com": 1,
    "is-an-entertainer.com": 1,
    "is-by.us": 1,
    "is-certified.com": 1,
    "is-found.org": 1,
    "is-gone.com": 1,
    "is-into-anime.com": 1,
    "is-into-cars.com": 1,
    "is-into-cartoons.com": 1,
    "is-into-games.com": 1,
    "is-leet.com": 1,
    "is-lost.org": 1,
    "is-not-certified.com": 1,
    "is-saved.org": 1,
    "is-slick.com": 1,
    "is-uberleet.com": 1,
    "is-very-bad.org": 1,
    "is-very-evil.org": 1,
    "is-very-good.org": 1,
    "is-very-nice.org": 1,
    "is-very-sweet.org": 1,
    "is-with-theband.com": 1,
    "is.eu.org": 1,
    "is.gov.pl": 1,
    "is.it": 1,
    "isa-geek.com": 1,
    "isa-geek.net": 1,
    "isa-geek.org": 1,
    "isa-hockeynut.com": 1,
    "isa.kagoshima.jp": 1,
    "isa.us": 1,
    "isahaya.nagasaki.jp": 1,
    "ise.mie.jp": 1,
    "isehara.kanagawa.jp": 1,
    "isen.kagoshima.jp": 1,
    "isernia.it": 1,
    "isesaki.gunma.jp": 1,
    "ishigaki.okinawa.jp": 1,
    "ishikari.hokkaido.jp": 1,
    "ishikawa.fukushima.jp": 1,
    "ishikawa.jp": 1,
    "ishikawa.okinawa.jp": 1,
    "ishinomaki.miyagi.jp": 1,
    "isla.pr": 1,
    "isleofman.museum": 1,
    "isshiki.aichi.jp": 1,
    "issmarterthanyou.com": 1,
    "isteingeek.de": 1,
    "istmein.de": 1,
    "isumi.chiba.jp": 1,
    "it.ao": 1,
    "it.eu.org": 1,
    "itabashi.tokyo.jp": 1,
    "itako.ibaraki.jp": 1,
    "itakura.gunma.jp": 1,
    "itami.hyogo.jp": 1,
    "itano.tokushima.jp": 1,
    "itayanagi.aomori.jp": 1,
    "ito.shizuoka.jp": 1,
    "itoigawa.niigata.jp": 1,
    "itoman.okinawa.jp": 1,
    "its.me": 1,
    "ivano-frankivsk.ua": 1,
    "ivanovo.ru": 1,
    "ivanovo.su": 1,
    "iveland.no": 1,
    "ivgu.no": 1,
    "iwade.wakayama.jp": 1,
    "iwafune.tochigi.jp": 1,
    "iwaizumi.iwate.jp": 1,
    "iwaki.fukushima.jp": 1,
    "iwakuni.yamaguchi.jp": 1,
    "iwakura.aichi.jp": 1,
    "iwama.ibaraki.jp": 1,
    "iwamizawa.hokkaido.jp": 1,
    "iwanai.hokkaido.jp": 1,
    "iwanuma.miyagi.jp": 1,
    "iwata.shizuoka.jp": 1,
    "iwate.iwate.jp": 1,
    "iwate.jp": 1,
    "iwatsuki.saitama.jp": 1,
    "iwi.nz": 1,
    "iyo.ehime.jp": 1,
    "iz.hr": 1,
    "izena.okinawa.jp": 1,
    "izhevsk.ru": 1,
    "izu.shizuoka.jp": 1,
    "izumi.kagoshima.jp": 1,
    "izumi.osaka.jp": 1,
    "izumiotsu.osaka.jp": 1,
    "izumisano.osaka.jp": 1,
    "izumizaki.fukushima.jp": 1,
    "izumo.shimane.jp": 1,
    "izumozaki.niigata.jp": 1,
    "izunokuni.shizuoka.jp": 1,
    "j.bg": 1,
    "jamal.ru": 1,
    "jamison.museum": 1,
    "jan-mayen.no": 1,
    "jar.ru": 1,
    "jaworzno.pl": 1,
    "jefferson.museum": 1,
    "jeju.kr": 1,
    "jelenia-gora.pl": 1,
    "jeonbuk.kr": 1,
    "jeonnam.kr": 1,
    "jerusalem.museum": 1,
    "jessheim.no": 1,
    "jevnaker.no": 1,
    "jewelry.museum": 1,
    "jewish.museum": 1,
    "jewishart.museum": 1,
    "jfk.museum": 1,
    "jgora.pl": 1,
    "jinsekikogen.hiroshima.jp": 1,
    "jl.cn": 1,
    "jm": 2,
    "joboji.iwate.jp": 1,
    "jobs.tt": 1,
    "joetsu.niigata.jp": 1,
    "jogasz.hu": 1,
    "johana.toyama.jp": 1,
    "jolster.no": 1,
    "jondal.no": 1,
    "jor.br": 1,
    "jorpeland.no": 1,
    "joshkar-ola.ru": 1,
    "joso.ibaraki.jp": 1,
    "journal.aero": 1,
    "journalism.museum": 1,
    "journalist.aero": 1,
    "joyo.kyoto.jp": 1,
    "jp.eu.org": 1,
    "jp.net": 1,
    "jpn.com": 1,
    "js.cn": 1,
    "judaica.museum": 1,
    "judygarland.museum": 1,
    "juedisches.museum": 1,
    "juif.museum": 1,
    "jur.pro": 1,
    "jus.br": 1,
    "jx.cn": 1,
    "j\u00f8lster.no": 1,
    "j\u00f8rpeland.no": 1,
    "k-uralsk.ru": 1,
    "k.bg": 1,
    "k.se": 1,
    "k12.ak.us": 1,
    "k12.al.us": 1,
    "k12.ar.us": 1,
    "k12.as.us": 1,
    "k12.az.us": 1,
    "k12.ca.us": 1,
    "k12.co.us": 1,
    "k12.ct.us": 1,
    "k12.dc.us": 1,
    "k12.de.us": 1,
    "k12.ec": 1,
    "k12.fl.us": 1,
    "k12.ga.us": 1,
    "k12.gu.us": 1,
    "k12.ia.us": 1,
    "k12.id.us": 1,
    "k12.il": 1,
    "k12.il.us": 1,
    "k12.in.us": 1,
    "k12.ks.us": 1,
    "k12.ky.us": 1,
    "k12.la.us": 1,
    "k12.ma.us": 1,
    "k12.md.us": 1,
    "k12.me.us": 1,
    "k12.mi.us": 1,
    "k12.mn.us": 1,
    "k12.mo.us": 1,
    "k12.ms.us": 1,
    "k12.mt.us": 1,
    "k12.nc.us": 1,
    "k12.ne.us": 1,
    "k12.nh.us": 1,
    "k12.nj.us": 1,
    "k12.nm.us": 1,
    "k12.nv.us": 1,
    "k12.ny.us": 1,
    "k12.oh.us": 1,
    "k12.ok.us": 1,
    "k12.or.us": 1,
    "k12.pa.us": 1,
    "k12.pr.us": 1,
    "k12.ri.us": 1,
    "k12.sc.us": 1,
    "k12.tn.us": 1,
    "k12.tr": 1,
    "k12.tx.us": 1,
    "k12.ut.us": 1,
    "k12.va.us": 1,
    "k12.vi": 1,
    "k12.vi.us": 1,
    "k12.vt.us": 1,
    "k12.wa.us": 1,
    "k12.wi.us": 1,
    "k12.wy.us": 1,
    "kadena.okinawa.jp": 1,
    "kadogawa.miyazaki.jp": 1,
    "kadoma.osaka.jp": 1,
    "kafjord.no": 1,
    "kaga.ishikawa.jp": 1,
    "kagami.kochi.jp": 1,
    "kagamiishi.fukushima.jp": 1,
    "kagamino.okayama.jp": 1,
    "kagawa.jp": 1,
    "kagoshima.jp": 1,
    "kagoshima.kagoshima.jp": 1,
    "kaho.fukuoka.jp": 1,
    "kahoku.ishikawa.jp": 1,
    "kahoku.yamagata.jp": 1,
    "kai.yamanashi.jp": 1,
    "kainan.tokushima.jp": 1,
    "kainan.wakayama.jp": 1,
    "kaisei.kanagawa.jp": 1,
    "kaita.hiroshima.jp": 1,
    "kaizuka.osaka.jp": 1,
    "kakamigahara.gifu.jp": 1,
    "kakegawa.shizuoka.jp": 1,
    "kakinoki.shimane.jp": 1,
    "kakogawa.hyogo.jp": 1,
    "kakuda.miyagi.jp": 1,
    "kalisz.pl": 1,
    "kalmykia.ru": 1,
    "kalmykia.su": 1,
    "kaluga.ru": 1,
    "kaluga.su": 1,
    "kamagaya.chiba.jp": 1,
    "kamaishi.iwate.jp": 1,
    "kamakura.kanagawa.jp": 1,
    "kamchatka.ru": 1,
    "kameoka.kyoto.jp": 1,
    "kameyama.mie.jp": 1,
    "kami.kochi.jp": 1,
    "kami.miyagi.jp": 1,
    "kamiamakusa.kumamoto.jp": 1,
    "kamifurano.hokkaido.jp": 1,
    "kamigori.hyogo.jp": 1,
    "kamiichi.toyama.jp": 1,
    "kamiizumi.saitama.jp": 1,
    "kamijima.ehime.jp": 1,
    "kamikawa.hokkaido.jp": 1,
    "kamikawa.hyogo.jp": 1,
    "kamikawa.saitama.jp": 1,
    "kamikitayama.nara.jp": 1,
    "kamikoani.akita.jp": 1,
    "kamimine.saga.jp": 1,
    "kaminokawa.tochigi.jp": 1,
    "kaminoyama.yamagata.jp": 1,
    "kamioka.akita.jp": 1,
    "kamisato.saitama.jp": 1,
    "kamishihoro.hokkaido.jp": 1,
    "kamisu.ibaraki.jp": 1,
    "kamisunagawa.hokkaido.jp": 1,
    "kamitonda.wakayama.jp": 1,
    "kamitsue.oita.jp": 1,
    "kamo.kyoto.jp": 1,
    "kamo.niigata.jp": 1,
    "kamoenai.hokkaido.jp": 1,
    "kamogawa.chiba.jp": 1,
    "kanagawa.jp": 1,
    "kanan.osaka.jp": 1,
    "kanazawa.ishikawa.jp": 1,
    "kanegasaki.iwate.jp": 1,
    "kaneyama.fukushima.jp": 1,
    "kaneyama.yamagata.jp": 1,
    "kani.gifu.jp": 1,
    "kanie.aichi.jp": 1,
    "kanmaki.nara.jp": 1,
    "kanna.gunma.jp": 1,
    "kannami.shizuoka.jp": 1,
    "kanonji.kagawa.jp": 1,
    "kanoya.kagoshima.jp": 1,
    "kanra.gunma.jp": 1,
    "kanuma.tochigi.jp": 1,
    "kanzaki.saga.jp": 1,
    "karasjohka.no": 1,
    "karasjok.no": 1,
    "karasuyama.tochigi.jp": 1,
    "karate.museum": 1,
    "karatsu.saga.jp": 1,
    "karelia.ru": 1,
    "karelia.su": 1,
    "karikatur.museum": 1,
    "kariwa.niigata.jp": 1,
    "kariya.aichi.jp": 1,
    "karlsoy.no": 1,
    "karmoy.no": 1,
    "karm\u00f8y.no": 1,
    "karpacz.pl": 1,
    "kartuzy.pl": 1,
    "karuizawa.nagano.jp": 1,
    "karumai.iwate.jp": 1,
    "kasahara.gifu.jp": 1,
    "kasai.hyogo.jp": 1,
    "kasama.ibaraki.jp": 1,
    "kasamatsu.gifu.jp": 1,
    "kasaoka.okayama.jp": 1,
    "kashiba.nara.jp": 1,
    "kashihara.nara.jp": 1,
    "kashima.ibaraki.jp": 1,
    "kashima.kumamoto.jp": 1,
    "kashima.saga.jp": 1,
    "kashiwa.chiba.jp": 1,
    "kashiwara.osaka.jp": 1,
    "kashiwazaki.niigata.jp": 1,
    "kasuga.fukuoka.jp": 1,
    "kasuga.hyogo.jp": 1,
    "kasugai.aichi.jp": 1,
    "kasukabe.saitama.jp": 1,
    "kasumigaura.ibaraki.jp": 1,
    "kasuya.fukuoka.jp": 1,
    "kaszuby.pl": 1,
    "katagami.akita.jp": 1,
    "katano.osaka.jp": 1,
    "katashina.gunma.jp": 1,
    "katori.chiba.jp": 1,
    "katowice.pl": 1,
    "katsuragi.nara.jp": 1,
    "katsuragi.wakayama.jp": 1,
    "katsushika.tokyo.jp": 1,
    "katsuura.chiba.jp": 1,
    "katsuyama.fukui.jp": 1,
    "kautokeino.no": 1,
    "kawaba.gunma.jp": 1,
    "kawachinagano.osaka.jp": 1,
    "kawagoe.mie.jp": 1,
    "kawagoe.saitama.jp": 1,
    "kawaguchi.saitama.jp": 1,
    "kawahara.tottori.jp": 1,
    "kawai.iwate.jp": 1,
    "kawai.nara.jp": 1,
    "kawajima.saitama.jp": 1,
    "kawakami.nagano.jp": 1,
    "kawakami.nara.jp": 1,
    "kawakita.ishikawa.jp": 1,
    "kawamata.fukushima.jp": 1,
    "kawaminami.miyazaki.jp": 1,
    "kawanabe.kagoshima.jp": 1,
    "kawanehon.shizuoka.jp": 1,
    "kawanishi.hyogo.jp": 1,
    "kawanishi.nara.jp": 1,
    "kawanishi.yamagata.jp": 1,
    "kawara.fukuoka.jp": 1,
    "kawasaki.jp": 2,
    "kawasaki.miyagi.jp": 1,
    "kawatana.nagasaki.jp": 1,
    "kawaue.gifu.jp": 1,
    "kawazu.shizuoka.jp": 1,
    "kayabe.hokkaido.jp": 1,
    "kazan.ru": 1,
    "kazimierz-dolny.pl": 1,
    "kazo.saitama.jp": 1,
    "kazuno.akita.jp": 1,
    "kchr.ru": 1,
    "ke": 2,
    "keisen.fukuoka.jp": 1,
    "kembuchi.hokkaido.jp": 1,
    "kemerovo.ru": 1,
    "kep.tr": 1,
    "kepno.pl": 1,
    "kesennuma.miyagi.jp": 1,
    "ketrzyn.pl": 1,
    "kg.kr": 1,
    "kh": 2,
    "kh.ua": 1,
    "khabarovsk.ru": 1,
    "khakassia.ru": 1,
    "khakassia.su": 1,
    "kharkiv.ua": 1,
    "kharkov.ua": 1,
    "kherson.ua": 1,
    "khmelnitskiy.ua": 1,
    "khmelnytskyi.ua": 1,
    "khv.ru": 1,
    "kibichuo.okayama.jp": 1,
    "kicks-ass.net": 1,
    "kicks-ass.org": 1,
    "kids.museum": 1,
    "kids.us": 1,
    "kiev.ua": 1,
    "kiho.mie.jp": 1,
    "kihoku.ehime.jp": 1,
    "kijo.miyazaki.jp": 1,
    "kikonai.hokkaido.jp": 1,
    "kikuchi.kumamoto.jp": 1,
    "kikugawa.shizuoka.jp": 1,
    "kimino.wakayama.jp": 1,
    "kimitsu.chiba.jp": 1,
    "kimobetsu.hokkaido.jp": 1,
    "kin.okinawa.jp": 1,
    "kinko.kagoshima.jp": 1,
    "kinokawa.wakayama.jp": 1,
    "kira.aichi.jp": 1,
    "kirkenes.no": 1,
    "kirov.ru": 1,
    "kirovograd.ua": 1,
    "kiryu.gunma.jp": 1,
    "kisarazu.chiba.jp": 1,
    "kishiwada.osaka.jp": 1,
    "kiso.nagano.jp": 1,
    "kisofukushima.nagano.jp": 1,
    "kisosaki.mie.jp": 1,
    "kita.kyoto.jp": 1,
    "kita.osaka.jp": 1,
    "kita.tokyo.jp": 1,
    "kitaaiki.nagano.jp": 1,
    "kitaakita.akita.jp": 1,
    "kitadaito.okinawa.jp": 1,
    "kitagata.gifu.jp": 1,
    "kitagata.saga.jp": 1,
    "kitagawa.kochi.jp": 1,
    "kitagawa.miyazaki.jp": 1,
    "kitahata.saga.jp": 1,
    "kitahiroshima.hokkaido.jp": 1,
    "kitakami.iwate.jp": 1,
    "kitakata.fukushima.jp": 1,
    "kitakata.miyazaki.jp": 1,
    "kitakyushu.jp": 2,
    "kitami.hokkaido.jp": 1,
    "kitamoto.saitama.jp": 1,
    "kitanakagusuku.okinawa.jp": 1,
    "kitashiobara.fukushima.jp": 1,
    "kitaura.miyazaki.jp": 1,
    "kitayama.wakayama.jp": 1,
    "kiwa.mie.jp": 1,
    "kiwi.nz": 1,
    "kiyama.saga.jp": 1,
    "kiyokawa.kanagawa.jp": 1,
    "kiyosato.hokkaido.jp": 1,
    "kiyose.tokyo.jp": 1,
    "kiyosu.aichi.jp": 1,
    "kizu.kyoto.jp": 1,
    "klabu.no": 1,
    "klepp.no": 1,
    "klodzko.pl": 1,
    "kl\u00e6bu.no": 1,
    "km.ua": 1,
    "kmpsp.gov.pl": 1,
    "kms.ru": 1,
    "knowsitall.info": 1,
    "kobayashi.miyazaki.jp": 1,
    "kobe.jp": 2,
    "kobierzyce.pl": 1,
    "kochi.jp": 1,
    "kochi.kochi.jp": 1,
    "kodaira.tokyo.jp": 1,
    "koebenhavn.museum": 1,
    "koeln.museum": 1,
    "koenig.ru": 1,
    "kofu.yamanashi.jp": 1,
    "koga.fukuoka.jp": 1,
    "koga.ibaraki.jp": 1,
    "koganei.tokyo.jp": 1,
    "koge.tottori.jp": 1,
    "koka.shiga.jp": 1,
    "kokonoe.oita.jp": 1,
    "kokubunji.tokyo.jp": 1,
    "kolobrzeg.pl": 1,
    "komae.tokyo.jp": 1,
    "komagane.nagano.jp": 1,
    "komaki.aichi.jp": 1,
    "komatsu.ishikawa.jp": 1,
    "komatsushima.tokushima.jp": 1,
    "komforb.se": 1,
    "komi.ru": 1,
    "kommunalforbund.se": 1,
    "kommune.no": 1,
    "komono.mie.jp": 1,
    "komoro.nagano.jp": 1,
    "komvux.se": 1,
    "konan.aichi.jp": 1,
    "konan.shiga.jp": 1,
    "kongsberg.no": 1,
    "kongsvinger.no": 1,
    "konin.pl": 1,
    "konskowola.pl": 1,
    "konsulat.gov.pl": 1,
    "konyvelo.hu": 1,
    "koori.fukushima.jp": 1,
    "kopervik.no": 1,
    "koriyama.fukushima.jp": 1,
    "koryo.nara.jp": 1,
    "kosa.kumamoto.jp": 1,
    "kosai.shizuoka.jp": 1,
    "kosaka.akita.jp": 1,
    "kosei.shiga.jp": 1,
    "koshigaya.saitama.jp": 1,
    "koshimizu.hokkaido.jp": 1,
    "koshu.yamanashi.jp": 1,
    "kostroma.ru": 1,
    "kosuge.yamanashi.jp": 1,
    "kota.aichi.jp": 1,
    "koto.shiga.jp": 1,
    "koto.tokyo.jp": 1,
    "kotohira.kagawa.jp": 1,
    "kotoura.tottori.jp": 1,
    "kouhoku.saga.jp": 1,
    "kounosu.saitama.jp": 1,
    "kouyama.kagoshima.jp": 1,
    "kouzushima.tokyo.jp": 1,
    "koya.wakayama.jp": 1,
    "koza.wakayama.jp": 1,
    "kozagawa.wakayama.jp": 1,
    "kozaki.chiba.jp": 1,
    "kppsp.gov.pl": 1,
    "kr.com": 1,
    "kr.eu.org": 1,
    "kr.it": 1,
    "kr.ua": 1,
    "kraanghke.no": 1,
    "kragero.no": 1,
    "krager\u00f8.no": 1,
    "krakow.pl": 1,
    "krasnodar.su": 1,
    "krasnoyarsk.ru": 1,
    "kristiansand.no": 1,
    "kristiansund.no": 1,
    "krodsherad.no": 1,
    "krokstadelva.no": 1,
    "krym.ua": 1,
    "kr\u00e5anghke.no": 1,
    "kr\u00f8dsherad.no": 1,
    "ks.ua": 1,
    "ks.us": 1,
    "kuban.ru": 1,
    "kuchinotsu.nagasaki.jp": 1,
    "kudamatsu.yamaguchi.jp": 1,
    "kudoyama.wakayama.jp": 1,
    "kui.hiroshima.jp": 1,
    "kuji.iwate.jp": 1,
    "kuju.oita.jp": 1,
    "kujukuri.chiba.jp": 1,
    "kuki.saitama.jp": 1,
    "kumagaya.saitama.jp": 1,
    "kumakogen.ehime.jp": 1,
    "kumamoto.jp": 1,
    "kumamoto.kumamoto.jp": 1,
    "kumano.hiroshima.jp": 1,
    "kumano.mie.jp": 1,
    "kumatori.osaka.jp": 1,
    "kumejima.okinawa.jp": 1,
    "kumenan.okayama.jp": 1,
    "kumiyama.kyoto.jp": 1,
    "kunigami.okinawa.jp": 1,
    "kunimi.fukushima.jp": 1,
    "kunisaki.oita.jp": 1,
    "kunitachi.tokyo.jp": 1,
    "kunitomi.miyazaki.jp": 1,
    "kunneppu.hokkaido.jp": 1,
    "kunohe.iwate.jp": 1,
    "kunst.museum": 1,
    "kunstsammlung.museum": 1,
    "kunstunddesign.museum": 1,
    "kurashiki.okayama.jp": 1,
    "kurate.fukuoka.jp": 1,
    "kure.hiroshima.jp": 1,
    "kurgan.ru": 1,
    "kurgan.su": 1,
    "kuriyama.hokkaido.jp": 1,
    "kurobe.toyama.jp": 1,
    "kurogi.fukuoka.jp": 1,
    "kuroishi.aomori.jp": 1,
    "kuroiso.tochigi.jp": 1,
    "kuromatsunai.hokkaido.jp": 1,
    "kurotaki.nara.jp": 1,
    "kursk.ru": 1,
    "kurume.fukuoka.jp": 1,
    "kusatsu.gunma.jp": 1,
    "kusatsu.shiga.jp": 1,
    "kushima.miyazaki.jp": 1,
    "kushimoto.wakayama.jp": 1,
    "kushiro.hokkaido.jp": 1,
    "kustanai.ru": 1,
    "kusu.oita.jp": 1,
    "kutchan.hokkaido.jp": 1,
    "kutno.pl": 1,
    "kuwana.mie.jp": 1,
    "kuzbass.ru": 1,
    "kuzumaki.iwate.jp": 1,
    "kv.ua": 1,
    "kvafjord.no": 1,
    "kvalsund.no": 1,
    "kvam.no": 1,
    "kvanangen.no": 1,
    "kvinesdal.no": 1,
    "kvinnherad.no": 1,
    "kviteseid.no": 1,
    "kvitsoy.no": 1,
    "kvits\u00f8y.no": 1,
    "kv\u00e6fjord.no": 1,
    "kv\u00e6nangen.no": 1,
    "kw": 2,
    "kwp.gov.pl": 1,
    "kwpsp.gov.pl": 1,
    "ky.us": 1,
    "kyiv.ua": 1,
    "kyonan.chiba.jp": 1,
    "kyotamba.kyoto.jp": 1,
    "kyotanabe.kyoto.jp": 1,
    "kyotango.kyoto.jp": 1,
    "kyoto.jp": 1,
    "kyowa.akita.jp": 1,
    "kyowa.hokkaido.jp": 1,
    "kyuragi.saga.jp": 1,
    "k\u00e1r\u00e1\u0161johka.no": 1,
    "k\u00e5fjord.no": 1,
    "l.bg": 1,
    "l.se": 1,
    "la-spezia.it": 1,
    "la.us": 1,
    "laakesvuemie.no": 1,
    "labor.museum": 1,
    "labour.museum": 1,
    "lahppi.no": 1,
    "lajolla.museum": 1,
    "lakas.hu": 1,
    "lanbib.se": 1,
    "lancashire.museum": 1,
    "land-4-sale.us": 1,
    "landes.museum": 1,
    "langevag.no": 1,
    "langev\u00e5g.no": 1,
    "lans.museum": 1,
    "lapy.pl": 1,
    "laquila.it": 1,
    "lardal.no": 1,
    "larsson.museum": 1,
    "larvik.no": 1,
    "laspezia.it": 1,
    "latina.it": 1,
    "lavagis.no": 1,
    "lavangen.no": 1,
    "law.pro": 1,
    "law.za": 1,
    "laz.it": 1,
    "lazio.it": 1,
    "lc.it": 1,
    "le.it": 1,
    "leangaviika.no": 1,
    "leasing.aero": 1,
    "lea\u014bgaviika.no": 1,
    "lebesby.no": 1,
    "lebork.pl": 1,
    "lebtimnetz.de": 1,
    "lecce.it": 1,
    "lecco.it": 1,
    "leg.br": 1,
    "legnica.pl": 1,
    "leikanger.no": 1,
    "leirfjord.no": 1,
    "leirvik.no": 1,
    "leitungsen.de": 1,
    "leka.no": 1,
    "leksvik.no": 1,
    "lel.br": 1,
    "lenug.su": 1,
    "lenvik.no": 1,
    "lerdal.no": 1,
    "lesja.no": 1,
    "levanger.no": 1,
    "lewismiller.museum": 1,
    "lezajsk.pl": 1,
    "lg.jp": 1,
    "lg.ua": 1,
    "li.it": 1,
    "lib.ak.us": 1,
    "lib.al.us": 1,
    "lib.ar.us": 1,
    "lib.as.us": 1,
    "lib.az.us": 1,
    "lib.ca.us": 1,
    "lib.co.us": 1,
    "lib.ct.us": 1,
    "lib.dc.us": 1,
    "lib.de.us": 1,
    "lib.ee": 1,
    "lib.fl.us": 1,
    "lib.ga.us": 1,
    "lib.gu.us": 1,
    "lib.hi.us": 1,
    "lib.ia.us": 1,
    "lib.id.us": 1,
    "lib.il.us": 1,
    "lib.in.us": 1,
    "lib.ks.us": 1,
    "lib.ky.us": 1,
    "lib.la.us": 1,
    "lib.ma.us": 1,
    "lib.md.us": 1,
    "lib.me.us": 1,
    "lib.mi.us": 1,
    "lib.mn.us": 1,
    "lib.mo.us": 1,
    "lib.ms.us": 1,
    "lib.mt.us": 1,
    "lib.nc.us": 1,
    "lib.nd.us": 1,
    "lib.ne.us": 1,
    "lib.nh.us": 1,
    "lib.nj.us": 1,
    "lib.nm.us": 1,
    "lib.nv.us": 1,
    "lib.ny.us": 1,
    "lib.oh.us": 1,
    "lib.ok.us": 1,
    "lib.or.us": 1,
    "lib.pa.us": 1,
    "lib.pr.us": 1,
    "lib.ri.us": 1,
    "lib.sc.us": 1,
    "lib.sd.us": 1,
    "lib.tn.us": 1,
    "lib.tx.us": 1,
    "lib.ut.us": 1,
    "lib.va.us": 1,
    "lib.vi.us": 1,
    "lib.vt.us": 1,
    "lib.wa.us": 1,
    "lib.wi.us": 1,
    "lib.wy.us": 1,
    "lier.no": 1,
    "lierne.no": 1,
    "lig.it": 1,
    "liguria.it": 1,
    "likes-pie.com": 1,
    "likescandy.com": 1,
    "lillehammer.no": 1,
    "lillesand.no": 1,
    "limanowa.pl": 1,
    "lincoln.museum": 1,
    "lindas.no": 1,
    "lindesnes.no": 1,
    "lind\u00e5s.no": 1,
    "linz.museum": 1,
    "lipetsk.ru": 1,
    "living.museum": 1,
    "livinghistory.museum": 1,
    "livorno.it": 1,
    "ln.cn": 1,
    "lo.it": 1,
    "loabat.no": 1,
    "loab\u00e1t.no": 1,
    "localhistory.museum": 1,
    "lodi.it": 1,
    "lodingen.no": 1,
    "logistics.aero": 1,
    "lom.it": 1,
    "lom.no": 1,
    "lombardia.it": 1,
    "lombardy.it": 1,
    "lomza.pl": 1,
    "london.museum": 1,
    "loppa.no": 1,
    "lorenskog.no": 1,
    "losangeles.museum": 1,
    "loten.no": 1,
    "louvre.museum": 1,
    "lowicz.pl": 1,
    "loyalist.museum": 1,
    "lt.eu.org": 1,
    "lt.it": 1,
    "lt.ua": 1,
    "ltd.co.im": 1,
    "ltd.cy": 1,
    "ltd.gi": 1,
    "ltd.hk": 1,
    "ltd.lk": 1,
    "ltd.uk": 1,
    "lu.eu.org": 1,
    "lu.it": 1,
    "lubin.pl": 1,
    "lucania.it": 1,
    "lucca.it": 1,
    "lucerne.museum": 1,
    "lugansk.ua": 1,
    "lukow.pl": 1,
    "lund.no": 1,
    "lunner.no": 1,
    "luroy.no": 1,
    "lur\u00f8y.no": 1,
    "luster.no": 1,
    "lutsk.ua": 1,
    "luxembourg.museum": 1,
    "luzern.museum": 1,
    "lv.eu.org": 1,
    "lv.ua": 1,
    "lviv.ua": 1,
    "lyngdal.no": 1,
    "lyngen.no": 1,
    "l\u00e1hppi.no": 1,
    "l\u00e4ns.museum": 1,
    "l\u00e6rdal.no": 1,
    "l\u00f8dingen.no": 1,
    "l\u00f8renskog.no": 1,
    "l\u00f8ten.no": 1,
    "m.bg": 1,
    "m.se": 1,
    "ma.us": 1,
    "macerata.it": 1,
    "machida.tokyo.jp": 1,
    "mad.museum": 1,
    "madrid.museum": 1,
    "maebashi.gunma.jp": 1,
    "magadan.ru": 1,
    "magazine.aero": 1,
    "maibara.shiga.jp": 1,
    "mail.pl": 1,
    "maintenance.aero": 1,
    "maizuru.kyoto.jp": 1,
    "makinohara.shizuoka.jp": 1,
    "makurazaki.kagoshima.jp": 1,
    "malatvuopmi.no": 1,
    "malbork.pl": 1,
    "mallorca.museum": 1,
    "malopolska.pl": 1,
    "malselv.no": 1,
    "malvik.no": 1,
    "mamurogawa.yamagata.jp": 1,
    "manchester.museum": 1,
    "mandal.no": 1,
    "maniwa.okayama.jp": 1,
    "manno.kagawa.jp": 1,
    "mansion.museum": 1,
    "mansions.museum": 1,
    "mantova.it": 1,
    "manx.museum": 1,
    "maori.nz": 1,
    "mar.it": 1,
    "marburg.museum": 1,
    "marche.it": 1,
    "mari-el.ru": 1,
    "mari.ru": 1,
    "marine.ru": 1,
    "maritime.museum": 1,
    "maritimo.museum": 1,
    "marker.no": 1,
    "marnardal.no": 1,
    "marugame.kagawa.jp": 1,
    "marumori.miyagi.jp": 1,
    "maryland.museum": 1,
    "marylhurst.museum": 1,
    "masaki.ehime.jp": 1,
    "masfjorden.no": 1,
    "mashike.hokkaido.jp": 1,
    "mashiki.kumamoto.jp": 1,
    "mashiko.tochigi.jp": 1,
    "masoy.no": 1,
    "massa-carrara.it": 1,
    "massacarrara.it": 1,
    "masuda.shimane.jp": 1,
    "mat.br": 1,
    "matera.it": 1,
    "matsubara.osaka.jp": 1,
    "matsubushi.saitama.jp": 1,
    "matsuda.kanagawa.jp": 1,
    "matsudo.chiba.jp": 1,
    "matsue.shimane.jp": 1,
    "matsukawa.nagano.jp": 1,
    "matsumae.hokkaido.jp": 1,
    "matsumoto.kagoshima.jp": 1,
    "matsumoto.nagano.jp": 1,
    "matsuno.ehime.jp": 1,
    "matsusaka.mie.jp": 1,
    "matsushige.tokushima.jp": 1,
    "matsushima.miyagi.jp": 1,
    "matsuura.nagasaki.jp": 1,
    "matsuyama.ehime.jp": 1,
    "matsuzaki.shizuoka.jp": 1,
    "matta-varjjat.no": 1,
    "mazowsze.pl": 1,
    "mazury.pl": 1,
    "mb.ca": 1,
    "mb.it": 1,
    "mc.eu.org": 1,
    "mc.it": 1,
    "md.ci": 1,
    "md.us": 1,
    "me.eu.org": 1,
    "me.it": 1,
    "me.tz": 1,
    "me.uk": 1,
    "me.us": 1,
    "med.br": 1,
    "med.ec": 1,
    "med.ee": 1,
    "med.ht": 1,
    "med.ly": 1,
    "med.om": 1,
    "med.pa": 1,
    "med.pl": 1,
    "med.pro": 1,
    "med.sa": 1,
    "med.sd": 1,
    "medecin.fr": 1,
    "medecin.km": 1,
    "media.aero": 1,
    "media.hu": 1,
    "media.museum": 1,
    "media.pl": 1,
    "medical.museum": 1,
    "medio-campidano.it": 1,
    "mediocampidano.it": 1,
    "medizinhistorisches.museum": 1,
    "meeres.museum": 1,
    "meguro.tokyo.jp": 1,
    "meiwa.gunma.jp": 1,
    "meiwa.mie.jp": 1,
    "meland.no": 1,
    "meldal.no": 1,
    "melhus.no": 1,
    "meloy.no": 1,
    "mel\u00f8y.no": 1,
    "memorial.museum": 1,
    "meraker.no": 1,
    "merseine.nu": 1,
    "mer\u00e5ker.no": 1,
    "mesaverde.museum": 1,
    "messina.it": 1,
    "mex.com": 1,
    "mi.it": 1,
    "mi.th": 1,
    "mi.us": 1,
    "miasa.nagano.jp": 1,
    "miasta.pl": 1,
    "mibu.tochigi.jp": 1,
    "michigan.museum": 1,
    "microlight.aero": 1,
    "midatlantic.museum": 1,
    "midori.chiba.jp": 1,
    "midori.gunma.jp": 1,
    "midsund.no": 1,
    "midtre-gauldal.no": 1,
    "mie.jp": 1,
    "mielec.pl": 1,
    "mielno.pl": 1,
    "mifune.kumamoto.jp": 1,
    "mihama.aichi.jp": 1,
    "mihama.chiba.jp": 1,
    "mihama.fukui.jp": 1,
    "mihama.mie.jp": 1,
    "mihama.wakayama.jp": 1,
    "mihara.hiroshima.jp": 1,
    "mihara.kochi.jp": 1,
    "miharu.fukushima.jp": 1,
    "miho.ibaraki.jp": 1,
    "mikasa.hokkaido.jp": 1,
    "mikawa.yamagata.jp": 1,
    "miki.hyogo.jp": 1,
    "mil.ac": 1,
    "mil.ae": 1,
    "mil.al": 1,
    "mil.ar": 1,
    "mil.az": 1,
    "mil.ba": 1,
    "mil.bo": 1,
    "mil.br": 1,
    "mil.by": 1,
    "mil.cl": 1,
    "mil.cn": 1,
    "mil.co": 1,
    "mil.do": 1,
    "mil.ec": 1,
    "mil.eg": 1,
    "mil.ge": 1,
    "mil.gh": 1,
    "mil.gt": 1,
    "mil.hn": 1,
    "mil.id": 1,
    "mil.in": 1,
    "mil.iq": 1,
    "mil.jo": 1,
    "mil.kg": 1,
    "mil.km": 1,
    "mil.kr": 1,
    "mil.kz": 1,
    "mil.lv": 1,
    "mil.mg": 1,
    "mil.mv": 1,
    "mil.my": 1,
    "mil.ng": 1,
    "mil.ni": 1,
    "mil.no": 1,
    "mil.nz": 1,
    "mil.pe": 1,
    "mil.ph": 1,
    "mil.pl": 1,
    "mil.py": 1,
    "mil.qa": 1,
    "mil.ru": 1,
    "mil.rw": 1,
    "mil.sh": 1,
    "mil.st": 1,
    "mil.sy": 1,
    "mil.tj": 1,
    "mil.tm": 1,
    "mil.to": 1,
    "mil.tr": 1,
    "mil.tw": 1,
    "mil.tz": 1,
    "mil.uy": 1,
    "mil.vc": 1,
    "mil.ve": 1,
    "mil.za": 1,
    "milan.it": 1,
    "milano.it": 1,
    "military.museum": 1,
    "mill.museum": 1,
    "mima.tokushima.jp": 1,
    "mimata.miyazaki.jp": 1,
    "minakami.gunma.jp": 1,
    "minamata.kumamoto.jp": 1,
    "minami-alps.yamanashi.jp": 1,
    "minami.fukuoka.jp": 1,
    "minami.kyoto.jp": 1,
    "minami.tokushima.jp": 1,
    "minamiaiki.nagano.jp": 1,
    "minamiashigara.kanagawa.jp": 1,
    "minamiawaji.hyogo.jp": 1,
    "minamiboso.chiba.jp": 1,
    "minamidaito.okinawa.jp": 1,
    "minamiechizen.fukui.jp": 1,
    "minamifurano.hokkaido.jp": 1,
    "minamiise.mie.jp": 1,
    "minamiizu.shizuoka.jp": 1,
    "minamimaki.nagano.jp": 1,
    "minamiminowa.nagano.jp": 1,
    "minamioguni.kumamoto.jp": 1,
    "minamisanriku.miyagi.jp": 1,
    "minamitane.kagoshima.jp": 1,
    "minamiuonuma.niigata.jp": 1,
    "minamiyamashiro.kyoto.jp": 1,
    "minano.saitama.jp": 1,
    "minato.osaka.jp": 1,
    "minato.tokyo.jp": 1,
    "mincom.tn": 1,
    "mine.nu": 1,
    "miners.museum": 1,
    "mining.museum": 1,
    "minnesota.museum": 1,
    "mino.gifu.jp": 1,
    "minobu.yamanashi.jp": 1,
    "minoh.osaka.jp": 1,
    "minokamo.gifu.jp": 1,
    "minowa.nagano.jp": 1,
    "misaki.okayama.jp": 1,
    "misaki.osaka.jp": 1,
    "misasa.tottori.jp": 1,
    "misato.akita.jp": 1,
    "misato.miyagi.jp": 1,
    "misato.saitama.jp": 1,
    "misato.shimane.jp": 1,
    "misato.wakayama.jp": 1,
    "misawa.aomori.jp": 1,
    "misconfused.org": 1,
    "mishima.fukushima.jp": 1,
    "mishima.shizuoka.jp": 1,
    "missile.museum": 1,
    "missoula.museum": 1,
    "misugi.mie.jp": 1,
    "mitaka.tokyo.jp": 1,
    "mitake.gifu.jp": 1,
    "mitane.akita.jp": 1,
    "mito.ibaraki.jp": 1,
    "mitou.yamaguchi.jp": 1,
    "mitoyo.kagawa.jp": 1,
    "mitsue.nara.jp": 1,
    "mitsuke.niigata.jp": 1,
    "miura.kanagawa.jp": 1,
    "miyada.nagano.jp": 1,
    "miyagi.jp": 1,
    "miyake.nara.jp": 1,
    "miyako.fukuoka.jp": 1,
    "miyako.iwate.jp": 1,
    "miyakonojo.miyazaki.jp": 1,
    "miyama.fukuoka.jp": 1,
    "miyama.mie.jp": 1,
    "miyashiro.saitama.jp": 1,
    "miyawaka.fukuoka.jp": 1,
    "miyazaki.jp": 1,
    "miyazaki.miyazaki.jp": 1,
    "miyazu.kyoto.jp": 1,
    "miyoshi.aichi.jp": 1,
    "miyoshi.hiroshima.jp": 1,
    "miyoshi.saitama.jp": 1,
    "miyoshi.tokushima.jp": 1,
    "miyota.nagano.jp": 1,
    "mizuho.tokyo.jp": 1,
    "mizumaki.fukuoka.jp": 1,
    "mizunami.gifu.jp": 1,
    "mizusawa.iwate.jp": 1,
    "mjondalen.no": 1,
    "mj\u00f8ndalen.no": 1,
    "mk.eu.org": 1,
    "mk.ua": 1,
    "mm": 2,
    "mn.it": 1,
    "mn.us": 1,
    "mo-i-rana.no": 1,
    "mo.cn": 1,
    "mo.it": 1,
    "mo.us": 1,
    "moareke.no": 1,
    "mobara.chiba.jp": 1,
    "mobi.gp": 1,
    "mobi.na": 1,
    "mobi.ng": 1,
    "mobi.tt": 1,
    "mobi.tz": 1,
    "mochizuki.nagano.jp": 1,
    "mod.gi": 1,
    "modalen.no": 1,
    "modelling.aero": 1,
    "modena.it": 1,
    "modern.museum": 1,
    "modum.no": 1,
    "moka.tochigi.jp": 1,
    "mol.it": 1,
    "molde.no": 1,
    "molise.it": 1,
    "moma.museum": 1,
    "mombetsu.hokkaido.jp": 1,
    "money.museum": 1,
    "monmouth.museum": 1,
    "monticello.museum": 1,
    "montreal.museum": 1,
    "monza-brianza.it": 1,
    "monza-e-della-brianza.it": 1,
    "monza.it": 1,
    "monzabrianza.it": 1,
    "monzaebrianza.it": 1,
    "monzaedellabrianza.it": 1,
    "mordovia.ru": 1,
    "mordovia.su": 1,
    "moriguchi.osaka.jp": 1,
    "morimachi.shizuoka.jp": 1,
    "morioka.iwate.jp": 1,
    "moriya.ibaraki.jp": 1,
    "moriyama.shiga.jp": 1,
    "moriyoshi.akita.jp": 1,
    "morotsuka.miyazaki.jp": 1,
    "moroyama.saitama.jp": 1,
    "moscow.museum": 1,
    "moseushi.hokkaido.jp": 1,
    "mosjoen.no": 1,
    "mosj\u00f8en.no": 1,
    "moskenes.no": 1,
    "moss.no": 1,
    "mosvik.no": 1,
    "motegi.tochigi.jp": 1,
    "motobu.okinawa.jp": 1,
    "motorcycle.museum": 1,
    "motosu.gifu.jp": 1,
    "motoyama.kochi.jp": 1,
    "mo\u00e5reke.no": 1,
    "mp.br": 1,
    "mr.no": 1,
    "mragowo.pl": 1,
    "ms.it": 1,
    "ms.kr": 1,
    "ms.us": 1,
    "msk.ru": 1,
    "msk.su": 1,
    "mt.eu.org": 1,
    "mt.it": 1,
    "mt.us": 1,
    "muenchen.museum": 1,
    "muenster.museum": 1,
    "mugi.tokushima.jp": 1,
    "muika.niigata.jp": 1,
    "mukawa.hokkaido.jp": 1,
    "muko.kyoto.jp": 1,
    "mulhouse.museum": 1,
    "munakata.fukuoka.jp": 1,
    "muncie.museum": 1,
    "muni.il": 1,
    "muosat.no": 1,
    "muos\u00e1t.no": 1,
    "mup.gov.pl": 1,
    "murakami.niigata.jp": 1,
    "murata.miyagi.jp": 1,
    "murayama.yamagata.jp": 1,
    "murmansk.ru": 1,
    "murmansk.su": 1,
    "muroran.hokkaido.jp": 1,
    "muroto.kochi.jp": 1,
    "mus.br": 1,
    "musashimurayama.tokyo.jp": 1,
    "musashino.tokyo.jp": 1,
    "museet.museum": 1,
    "museum.mv": 1,
    "museum.mw": 1,
    "museum.no": 1,
    "museum.om": 1,
    "museum.tt": 1,
    "museumcenter.museum": 1,
    "museumvereniging.museum": 1,
    "music.museum": 1,
    "mutsu.aomori.jp": 1,
    "mutsuzawa.chiba.jp": 1,
    "mw.gov.pl": 1,
    "mx.na": 1,
    "my.eu.org": 1,
    "my.id": 1,
    "mydrobo.com": 1,
    "myds.me": 1,
    "mykolaiv.ua": 1,
    "myoko.niigata.jp": 1,
    "mypets.ws": 1,
    "myphotos.cc": 1,
    "mytis.ru": 1,
    "mz": 2,
    "m\u00e1latvuopmi.no": 1,
    "m\u00e1tta-v\u00e1rjjat.no": 1,
    "m\u00e5lselv.no": 1,
    "m\u00e5s\u00f8y.no": 1,
    "m\u0101ori.nz": 1,
    "n.bg": 1,
    "n.se": 1,
    "na.it": 1,
    "naamesjevuemie.no": 1,
    "nabari.mie.jp": 1,
    "nachikatsuura.wakayama.jp": 1,
    "nagahama.shiga.jp": 1,
    "nagai.yamagata.jp": 1,
    "nagano.jp": 1,
    "nagano.nagano.jp": 1,
    "naganohara.gunma.jp": 1,
    "nagaoka.niigata.jp": 1,
    "nagaokakyo.kyoto.jp": 1,
    "nagara.chiba.jp": 1,
    "nagareyama.chiba.jp": 1,
    "nagasaki.jp": 1,
    "nagasaki.nagasaki.jp": 1,
    "nagasu.kumamoto.jp": 1,
    "nagato.yamaguchi.jp": 1,
    "nagatoro.saitama.jp": 1,
    "nagawa.nagano.jp": 1,
    "nagi.okayama.jp": 1,
    "nagiso.nagano.jp": 1,
    "nago.okinawa.jp": 1,
    "nagoya.jp": 2,
    "naha.okinawa.jp": 1,
    "nahari.kochi.jp": 1,
    "naie.hokkaido.jp": 1,
    "naka.hiroshima.jp": 1,
    "naka.ibaraki.jp": 1,
    "nakadomari.aomori.jp": 1,
    "nakagawa.fukuoka.jp": 1,
    "nakagawa.hokkaido.jp": 1,
    "nakagawa.nagano.jp": 1,
    "nakagawa.tokushima.jp": 1,
    "nakagusuku.okinawa.jp": 1,
    "nakagyo.kyoto.jp": 1,
    "nakai.kanagawa.jp": 1,
    "nakama.fukuoka.jp": 1,
    "nakamichi.yamanashi.jp": 1,
    "nakamura.kochi.jp": 1,
    "nakaniikawa.toyama.jp": 1,
    "nakano.nagano.jp": 1,
    "nakano.tokyo.jp": 1,
    "nakanojo.gunma.jp": 1,
    "nakanoto.ishikawa.jp": 1,
    "nakasatsunai.hokkaido.jp": 1,
    "nakatane.kagoshima.jp": 1,
    "nakatombetsu.hokkaido.jp": 1,
    "nakatsugawa.gifu.jp": 1,
    "nakayama.yamagata.jp": 1,
    "nakhodka.ru": 1,
    "nakijin.okinawa.jp": 1,
    "naklo.pl": 1,
    "nalchik.ru": 1,
    "nalchik.su": 1,
    "namdalseid.no": 1,
    "name.az": 1,
    "name.cy": 1,
    "name.eg": 1,
    "name.et": 1,
    "name.hr": 1,
    "name.jo": 1,
    "name.mk": 1,
    "name.mv": 1,
    "name.my": 1,
    "name.na": 1,
    "name.ng": 1,
    "name.pr": 1,
    "name.qa": 1,
    "name.tj": 1,
    "name.tr": 1,
    "name.tt": 1,
    "name.vn": 1,
    "namegata.ibaraki.jp": 1,
    "namegawa.saitama.jp": 1,
    "namerikawa.toyama.jp": 1,
    "namie.fukushima.jp": 1,
    "namikata.ehime.jp": 1,
    "namsos.no": 1,
    "namsskogan.no": 1,
    "nanae.hokkaido.jp": 1,
    "nanao.ishikawa.jp": 1,
    "nanbu.tottori.jp": 1,
    "nanbu.yamanashi.jp": 1,
    "nango.fukushima.jp": 1,
    "nanjo.okinawa.jp": 1,
    "nankoku.kochi.jp": 1,
    "nanmoku.gunma.jp": 1,
    "nannestad.no": 1,
    "nanporo.hokkaido.jp": 1,
    "nantan.kyoto.jp": 1,
    "nanto.toyama.jp": 1,
    "nanyo.yamagata.jp": 1,
    "naoshima.kagawa.jp": 1,
    "naples.it": 1,
    "napoli.it": 1,
    "nara.jp": 1,
    "nara.nara.jp": 1,
    "narashino.chiba.jp": 1,
    "narita.chiba.jp": 1,
    "naroy.no": 1,
    "narusawa.yamanashi.jp": 1,
    "naruto.tokushima.jp": 1,
    "narviika.no": 1,
    "narvik.no": 1,
    "nasu.tochigi.jp": 1,
    "nasushiobara.tochigi.jp": 1,
    "nat.tn": 1,
    "national.museum": 1,
    "nationalfirearms.museum": 1,
    "nationalheritage.museum": 1,
    "nativeamerican.museum": 1,
    "natori.miyagi.jp": 1,
    "naturalhistory.museum": 1,
    "naturalhistorymuseum.museum": 1,
    "naturalsciences.museum": 1,
    "naturbruksgymn.se": 1,
    "nature.museum": 1,
    "naturhistorisches.museum": 1,
    "natuurwetenschappen.museum": 1,
    "naumburg.museum": 1,
    "naustdal.no": 1,
    "naval.museum": 1,
    "navigation.aero": 1,
    "navuotna.no": 1,
    "nayoro.hokkaido.jp": 1,
    "nb.ca": 1,
    "nc.tr": 1,
    "nc.us": 1,
    "nd.us": 1,
    "ne.jp": 1,
    "ne.kr": 1,
    "ne.pw": 1,
    "ne.tz": 1,
    "ne.ug": 1,
    "ne.us": 1,
    "neat-url.com": 1,
    "nebraska.museum": 1,
    "nedre-eiker.no": 1,
    "nemuro.hokkaido.jp": 1,
    "nerima.tokyo.jp": 1,
    "nes.akershus.no": 1,
    "nes.buskerud.no": 1,
    "nesna.no": 1,
    "nesodden.no": 1,
    "nesoddtangen.no": 1,
    "nesseby.no": 1,
    "nesset.no": 1,
    "net.ac": 1,
    "net.ae": 1,
    "net.af": 1,
    "net.ag": 1,
    "net.ai": 1,
    "net.al": 1,
    "net.ar": 1,
    "net.au": 1,
    "net.az": 1,
    "net.ba": 1,
    "net.bb": 1,
    "net.bh": 1,
    "net.bm": 1,
    "net.bo": 1,
    "net.br": 1,
    "net.bs": 1,
    "net.bt": 1,
    "net.bz": 1,
    "net.ci": 1,
    "net.cm": 1,
    "net.cn": 1,
    "net.co": 1,
    "net.cu": 1,
    "net.cw": 1,
    "net.cy": 1,
    "net.dm": 1,
    "net.do": 1,
    "net.dz": 1,
    "net.ec": 1,
    "net.eg": 1,
    "net.et": 1,
    "net.eu.org": 1,
    "net.ge": 1,
    "net.gg": 1,
    "net.gl": 1,
    "net.gn": 1,
    "net.gp": 1,
    "net.gr": 1,
    "net.gt": 1,
    "net.gy": 1,
    "net.hk": 1,
    "net.hn": 1,
    "net.ht": 1,
    "net.id": 1,
    "net.il": 1,
    "net.im": 1,
    "net.in": 1,
    "net.iq": 1,
    "net.ir": 1,
    "net.is": 1,
    "net.je": 1,
    "net.jo": 1,
    "net.kg": 1,
    "net.ki": 1,
    "net.kn": 1,
    "net.ky": 1,
    "net.kz": 1,
    "net.la": 1,
    "net.lb": 1,
    "net.lc": 1,
    "net.lk": 1,
    "net.lr": 1,
    "net.lv": 1,
    "net.ly": 1,
    "net.ma": 1,
    "net.me": 1,
    "net.mk": 1,
    "net.ml": 1,
    "net.mo": 1,
    "net.ms": 1,
    "net.mt": 1,
    "net.mu": 1,
    "net.mv": 1,
    "net.mw": 1,
    "net.mx": 1,
    "net.my": 1,
    "net.nf": 1,
    "net.ng": 1,
    "net.ni": 1,
    "net.nr": 1,
    "net.nz": 1,
    "net.om": 1,
    "net.pa": 1,
    "net.pe": 1,
    "net.ph": 1,
    "net.pk": 1,
    "net.pl": 1,
    "net.pn": 1,
    "net.pr": 1,
    "net.ps": 1,
    "net.pt": 1,
    "net.py": 1,
    "net.qa": 1,
    "net.ru": 1,
    "net.rw": 1,
    "net.sa": 1,
    "net.sb": 1,
    "net.sc": 1,
    "net.sd": 1,
    "net.sg": 1,
    "net.sh": 1,
    "net.sl": 1,
    "net.so": 1,
    "net.st": 1,
    "net.sy": 1,
    "net.th": 1,
    "net.tj": 1,
    "net.tm": 1,
    "net.tn": 1,
    "net.to": 1,
    "net.tr": 1,
    "net.tt": 1,
    "net.tw": 1,
    "net.ua": 1,
    "net.uk": 1,
    "net.uy": 1,
    "net.uz": 1,
    "net.vc": 1,
    "net.ve": 1,
    "net.vi": 1,
    "net.vn": 1,
    "net.vu": 1,
    "net.ws": 1,
    "net.za": 1,
    "neues.museum": 1,
    "newhampshire.museum": 1,
    "newjersey.museum": 1,
    "newmexico.museum": 1,
    "newport.museum": 1,
    "news.hu": 1,
    "newspaper.museum": 1,
    "newyork.museum": 1,
    "neyagawa.osaka.jp": 1,
    "nf.ca": 1,
    "nfshost.com": 1,
    "ng.eu.org": 1,
    "ngo.lk": 1,
    "ngo.ph": 1,
    "ngo.za": 1,
    "ngrok.io": 1,
    "nh.us": 1,
    "nhs.uk": 1,
    "nic.in": 1,
    "nic.tj": 1,
    "nichinan.miyazaki.jp": 1,
    "nichinan.tottori.jp": 1,
    "nid.io": 1,
    "niepce.museum": 1,
    "nieruchomosci.pl": 1,
    "niigata.jp": 1,
    "niigata.niigata.jp": 1,
    "niihama.ehime.jp": 1,
    "niikappu.hokkaido.jp": 1,
    "niimi.okayama.jp": 1,
    "niiza.saitama.jp": 1,
    "nikaho.akita.jp": 1,
    "niki.hokkaido.jp": 1,
    "nikko.tochigi.jp": 1,
    "nikolaev.ua": 1,
    "ninohe.iwate.jp": 1,
    "ninomiya.kanagawa.jp": 1,
    "nirasaki.yamanashi.jp": 1,
    "nis.za": 1,
    "nishi.fukuoka.jp": 1,
    "nishi.osaka.jp": 1,
    "nishiaizu.fukushima.jp": 1,
    "nishiarita.saga.jp": 1,
    "nishiawakura.okayama.jp": 1,
    "nishiazai.shiga.jp": 1,
    "nishigo.fukushima.jp": 1,
    "nishihara.kumamoto.jp": 1,
    "nishihara.okinawa.jp": 1,
    "nishiizu.shizuoka.jp": 1,
    "nishikata.tochigi.jp": 1,
    "nishikatsura.yamanashi.jp": 1,
    "nishikawa.yamagata.jp": 1,
    "nishimera.miyazaki.jp": 1,
    "nishinomiya.hyogo.jp": 1,
    "nishinoomote.kagoshima.jp": 1,
    "nishinoshima.shimane.jp": 1,
    "nishio.aichi.jp": 1,
    "nishiokoppe.hokkaido.jp": 1,
    "nishitosa.kochi.jp": 1,
    "nishiwaki.hyogo.jp": 1,
    "nissedal.no": 1,
    "nisshin.aichi.jp": 1,
    "nittedal.no": 1,
    "niyodogawa.kochi.jp": 1,
    "nj.us": 1,
    "nkz.ru": 1,
    "nl.ca": 1,
    "nl.eu.org": 1,
    "nl.no": 1,
    "nm.cn": 1,
    "nm.us": 1,
    "nnov.ru": 1,
    "no.com": 1,
    "no.eu.org": 1,
    "no.it": 1,
    "nobeoka.miyazaki.jp": 1,
    "noboribetsu.hokkaido.jp": 1,
    "noda.chiba.jp": 1,
    "noda.iwate.jp": 1,
    "nogata.fukuoka.jp": 1,
    "nogi.tochigi.jp": 1,
    "noheji.aomori.jp": 1,
    "nom.ad": 1,
    "nom.ag": 1,
    "nom.br": 2,
    "nom.co": 1,
    "nom.es": 1,
    "nom.fr": 1,
    "nom.km": 1,
    "nom.mg": 1,
    "nom.ni": 1,
    "nom.pa": 1,
    "nom.pe": 1,
    "nom.pl": 1,
    "nom.re": 1,
    "nom.ro": 1,
    "nom.tm": 1,
    "nom.za": 1,
    "nome.pt": 1,
    "nomi.ishikawa.jp": 1,
    "nonoichi.ishikawa.jp": 1,
    "nord-aurdal.no": 1,
    "nord-fron.no": 1,
    "nord-odal.no": 1,
    "norddal.no": 1,
    "nordkapp.no": 1,
    "nordre-land.no": 1,
    "nordreisa.no": 1,
    "nore-og-uvdal.no": 1,
    "norfolk.museum": 1,
    "norilsk.ru": 1,
    "north.museum": 1,
    "nose.osaka.jp": 1,
    "nosegawa.nara.jp": 1,
    "noshiro.akita.jp": 1,
    "not.br": 1,
    "notaires.fr": 1,
    "notaires.km": 1,
    "noto.ishikawa.jp": 1,
    "notodden.no": 1,
    "notogawa.shiga.jp": 1,
    "notteroy.no": 1,
    "nov.ru": 1,
    "nov.su": 1,
    "novara.it": 1,
    "novosibirsk.ru": 1,
    "nowaruda.pl": 1,
    "nozawaonsen.nagano.jp": 1,
    "np": 2,
    "nrw.museum": 1,
    "ns.ca": 1,
    "nsk.ru": 1,
    "nsn.us": 1,
    "nsw.au": 1,
    "nsw.edu.au": 1,
    "nt.au": 1,
    "nt.ca": 1,
    "nt.edu.au": 1,
    "nt.no": 1,
    "nt.ro": 1,
    "ntr.br": 1,
    "nu.ca": 1,
    "nu.it": 1,
    "nuernberg.museum": 1,
    "numata.gunma.jp": 1,
    "numata.hokkaido.jp": 1,
    "numazu.shizuoka.jp": 1,
    "nuoro.it": 1,
    "nuremberg.museum": 1,
    "nv.us": 1,
    "nx.cn": 1,
    "ny.us": 1,
    "nyc.mn": 1,
    "nyc.museum": 1,
    "nyny.museum": 1,
    "nysa.pl": 1,
    "nyuzen.toyama.jp": 1,
    "nz.eu.org": 1,
    "n\u00e1vuotna.no": 1,
    "n\u00e5\u00e5mesjevuemie.no": 1,
    "n\u00e6r\u00f8y.no": 1,
    "n\u00f8tter\u00f8y.no": 1,
    "o.bg": 1,
    "o.se": 1,
    "oamishirasato.chiba.jp": 1,
    "oarai.ibaraki.jp": 1,
    "obama.fukui.jp": 1,
    "obama.nagasaki.jp": 1,
    "obanazawa.yamagata.jp": 1,
    "obihiro.hokkaido.jp": 1,
    "obira.hokkaido.jp": 1,
    "obninsk.su": 1,
    "obu.aichi.jp": 1,
    "obuse.nagano.jp": 1,
    "oceanographic.museum": 1,
    "oceanographique.museum": 1,
    "ochi.kochi.jp": 1,
    "od.ua": 1,
    "odate.akita.jp": 1,
    "odawara.kanagawa.jp": 1,
    "odda.no": 1,
    "odesa.ua": 1,
    "odessa.ua": 1,
    "odo.br": 1,
    "oe.yamagata.jp": 1,
    "of.by": 1,
    "of.no": 1,
    "off.ai": 1,
    "office-on-the.net": 1,
    "ofunato.iwate.jp": 1,
    "og.ao": 1,
    "og.it": 1,
    "oga.akita.jp": 1,
    "ogaki.gifu.jp": 1,
    "ogano.saitama.jp": 1,
    "ogasawara.tokyo.jp": 1,
    "ogata.akita.jp": 1,
    "ogawa.ibaraki.jp": 1,
    "ogawa.nagano.jp": 1,
    "ogawa.saitama.jp": 1,
    "ogawara.miyagi.jp": 1,
    "ogi.saga.jp": 1,
    "ogimi.okinawa.jp": 1,
    "ogliastra.it": 1,
    "ogori.fukuoka.jp": 1,
    "ogose.saitama.jp": 1,
    "oguchi.aichi.jp": 1,
    "oguni.kumamoto.jp": 1,
    "oguni.yamagata.jp": 1,
    "oh.us": 1,
    "oharu.aichi.jp": 1,
    "ohda.shimane.jp": 1,
    "ohi.fukui.jp": 1,
    "ohira.miyagi.jp": 1,
    "ohira.tochigi.jp": 1,
    "ohkura.yamagata.jp": 1,
    "ohtawara.tochigi.jp": 1,
    "oi.kanagawa.jp": 1,
    "oirase.aomori.jp": 1,
    "oirm.gov.pl": 1,
    "oishida.yamagata.jp": 1,
    "oiso.kanagawa.jp": 1,
    "oita.jp": 1,
    "oita.oita.jp": 1,
    "oizumi.gunma.jp": 1,
    "oji.nara.jp": 1,
    "ojiya.niigata.jp": 1,
    "ok.us": 1,
    "okagaki.fukuoka.jp": 1,
    "okawa.fukuoka.jp": 1,
    "okawa.kochi.jp": 1,
    "okaya.nagano.jp": 1,
    "okayama.jp": 1,
    "okayama.okayama.jp": 1,
    "okazaki.aichi.jp": 1,
    "okegawa.saitama.jp": 1,
    "oketo.hokkaido.jp": 1,
    "oki.fukuoka.jp": 1,
    "okinawa.jp": 1,
    "okinawa.okinawa.jp": 1,
    "okinoshima.shimane.jp": 1,
    "okoppe.hokkaido.jp": 1,
    "oksnes.no": 1,
    "okuizumo.shimane.jp": 1,
    "okuma.fukushima.jp": 1,
    "okutama.tokyo.jp": 1,
    "ol.no": 1,
    "olawa.pl": 1,
    "olbia-tempio.it": 1,
    "olbiatempio.it": 1,
    "olecko.pl": 1,
    "olkusz.pl": 1,
    "olsztyn.pl": 1,
    "omachi.nagano.jp": 1,
    "omachi.saga.jp": 1,
    "omaezaki.shizuoka.jp": 1,
    "omaha.museum": 1,
    "omasvuotna.no": 1,
    "ome.tokyo.jp": 1,
    "omi.nagano.jp": 1,
    "omi.niigata.jp": 1,
    "omigawa.chiba.jp": 1,
    "omihachiman.shiga.jp": 1,
    "omitama.ibaraki.jp": 1,
    "omiya.saitama.jp": 1,
    "omotego.fukushima.jp": 1,
    "omsk.ru": 1,
    "omura.nagasaki.jp": 1,
    "omuta.fukuoka.jp": 1,
    "on-the-web.tv": 1,
    "on.ca": 1,
    "onagawa.miyagi.jp": 1,
    "onga.fukuoka.jp": 1,
    "onjuku.chiba.jp": 1,
    "online.museum": 1,
    "onna.okinawa.jp": 1,
    "ono.fukui.jp": 1,
    "ono.fukushima.jp": 1,
    "ono.hyogo.jp": 1,
    "onojo.fukuoka.jp": 1,
    "onomichi.hiroshima.jp": 1,
    "ontario.museum": 1,
    "ookuwa.nagano.jp": 1,
    "ooshika.nagano.jp": 1,
    "openair.museum": 1,
    "operaunite.com": 1,
    "opoczno.pl": 1,
    "opole.pl": 1,
    "oppdal.no": 1,
    "oppegard.no": 1,
    "oppeg\u00e5rd.no": 1,
    "or.at": 1,
    "or.bi": 1,
    "or.ci": 1,
    "or.cr": 1,
    "or.id": 1,
    "or.it": 1,
    "or.jp": 1,
    "or.kr": 1,
    "or.mu": 1,
    "or.na": 1,
    "or.pw": 1,
    "or.th": 1,
    "or.tz": 1,
    "or.ug": 1,
    "or.us": 1,
    "ora.gunma.jp": 1,
    "oregon.museum": 1,
    "oregontrail.museum": 1,
    "orenburg.ru": 1,
    "org.ac": 1,
    "org.ae": 1,
    "org.af": 1,
    "org.ag": 1,
    "org.ai": 1,
    "org.al": 1,
    "org.ar": 1,
    "org.au": 1,
    "org.az": 1,
    "org.ba": 1,
    "org.bb": 1,
    "org.bh": 1,
    "org.bi": 1,
    "org.bm": 1,
    "org.bo": 1,
    "org.br": 1,
    "org.bs": 1,
    "org.bt": 1,
    "org.bw": 1,
    "org.bz": 1,
    "org.ci": 1,
    "org.cn": 1,
    "org.co": 1,
    "org.cu": 1,
    "org.cw": 1,
    "org.cy": 1,
    "org.dm": 1,
    "org.do": 1,
    "org.dz": 1,
    "org.ec": 1,
    "org.ee": 1,
    "org.eg": 1,
    "org.es": 1,
    "org.et": 1,
    "org.ge": 1,
    "org.gg": 1,
    "org.gh": 1,
    "org.gi": 1,
    "org.gl": 1,
    "org.gn": 1,
    "org.gp": 1,
    "org.gr": 1,
    "org.gt": 1,
    "org.gy": 1,
    "org.hk": 1,
    "org.hn": 1,
    "org.ht": 1,
    "org.hu": 1,
    "org.il": 1,
    "org.im": 1,
    "org.in": 1,
    "org.iq": 1,
    "org.ir": 1,
    "org.is": 1,
    "org.je": 1,
    "org.jo": 1,
    "org.kg": 1,
    "org.ki": 1,
    "org.km": 1,
    "org.kn": 1,
    "org.kp": 1,
    "org.ky": 1,
    "org.kz": 1,
    "org.la": 1,
    "org.lb": 1,
    "org.lc": 1,
    "org.lk": 1,
    "org.lr": 1,
    "org.ls": 1,
    "org.lv": 1,
    "org.ly": 1,
    "org.ma": 1,
    "org.me": 1,
    "org.mg": 1,
    "org.mk": 1,
    "org.ml": 1,
    "org.mn": 1,
    "org.mo": 1,
    "org.ms": 1,
    "org.mt": 1,
    "org.mu": 1,
    "org.mv": 1,
    "org.mw": 1,
    "org.mx": 1,
    "org.my": 1,
    "org.na": 1,
    "org.ng": 1,
    "org.ni": 1,
    "org.nr": 1,
    "org.nz": 1,
    "org.om": 1,
    "org.pa": 1,
    "org.pe": 1,
    "org.pf": 1,
    "org.ph": 1,
    "org.pk": 1,
    "org.pl": 1,
    "org.pn": 1,
    "org.pr": 1,
    "org.ps": 1,
    "org.pt": 1,
    "org.py": 1,
    "org.qa": 1,
    "org.ro": 1,
    "org.rs": 1,
    "org.ru": 1,
    "org.sa": 1,
    "org.sb": 1,
    "org.sc": 1,
    "org.sd": 1,
    "org.se": 1,
    "org.sg": 1,
    "org.sh": 1,
    "org.sl": 1,
    "org.sn": 1,
    "org.so": 1,
    "org.st": 1,
    "org.sv": 1,
    "org.sy": 1,
    "org.sz": 1,
    "org.tj": 1,
    "org.tm": 1,
    "org.tn": 1,
    "org.to": 1,
    "org.tr": 1,
    "org.tt": 1,
    "org.tw": 1,
    "org.ua": 1,
    "org.ug": 1,
    "org.uk": 1,
    "org.uy": 1,
    "org.uz": 1,
    "org.vc": 1,
    "org.ve": 1,
    "org.vi": 1,
    "org.vn": 1,
    "org.vu": 1,
    "org.ws": 1,
    "org.za": 1,
    "oristano.it": 1,
    "orkanger.no": 1,
    "orkdal.no": 1,
    "orland.no": 1,
    "orskog.no": 1,
    "orsta.no": 1,
    "oryol.ru": 1,
    "os.hedmark.no": 1,
    "os.hordaland.no": 1,
    "osaka.jp": 1,
    "osakasayama.osaka.jp": 1,
    "osaki.miyagi.jp": 1,
    "osakikamijima.hiroshima.jp": 1,
    "osen.no": 1,
    "oseto.nagasaki.jp": 1,
    "oshima.tokyo.jp": 1,
    "oshima.yamaguchi.jp": 1,
    "oshino.yamanashi.jp": 1,
    "oshu.iwate.jp": 1,
    "oskol.ru": 1,
    "oslo.no": 1,
    "osoyro.no": 1,
    "osteroy.no": 1,
    "oster\u00f8y.no": 1,
    "ostre-toten.no": 1,
    "ostroda.pl": 1,
    "ostroleka.pl": 1,
    "ostrowiec.pl": 1,
    "ostrowwlkp.pl": 1,
    "os\u00f8yro.no": 1,
    "ot.it": 1,
    "ota.gunma.jp": 1,
    "ota.tokyo.jp": 1,
    "otago.museum": 1,
    "otake.hiroshima.jp": 1,
    "otaki.chiba.jp": 1,
    "otaki.nagano.jp": 1,
    "otaki.saitama.jp": 1,
    "otama.fukushima.jp": 1,
    "otari.nagano.jp": 1,
    "otaru.hokkaido.jp": 1,
    "other.nf": 1,
    "oto.fukuoka.jp": 1,
    "otobe.hokkaido.jp": 1,
    "otofuke.hokkaido.jp": 1,
    "otoineppu.hokkaido.jp": 1,
    "otoyo.kochi.jp": 1,
    "otsu.shiga.jp": 1,
    "otsuchi.iwate.jp": 1,
    "otsuki.kochi.jp": 1,
    "otsuki.yamanashi.jp": 1,
    "ouchi.saga.jp": 1,
    "ouda.nara.jp": 1,
    "oum.gov.pl": 1,
    "oumu.hokkaido.jp": 1,
    "outsystemscloud.com": 1,
    "overhalla.no": 1,
    "ovre-eiker.no": 1,
    "owani.aomori.jp": 1,
    "owariasahi.aichi.jp": 1,
    "oxford.museum": 1,
    "oyabe.toyama.jp": 1,
    "oyama.tochigi.jp": 1,
    "oyamazaki.kyoto.jp": 1,
    "oyer.no": 1,
    "oygarden.no": 1,
    "oyodo.nara.jp": 1,
    "oystre-slidre.no": 1,
    "oz.au": 1,
    "ozora.hokkaido.jp": 1,
    "ozu.ehime.jp": 1,
    "ozu.kumamoto.jp": 1,
    "p.bg": 1,
    "p.se": 1,
    "pa.gov.pl": 1,
    "pa.it": 1,
    "pa.us": 1,
    "pacific.museum": 1,
    "paderborn.museum": 1,
    "padova.it": 1,
    "padua.it": 1,
    "pagefrontapp.com": 1,
    "pagespeedmobilizer.com": 1,
    "palace.museum": 1,
    "palana.ru": 1,
    "paleo.museum": 1,
    "palermo.it": 1,
    "palmsprings.museum": 1,
    "panama.museum": 1,
    "pantheon.io": 1,
    "parachuting.aero": 1,
    "paragliding.aero": 1,
    "paris.eu.org": 1,
    "paris.museum": 1,
    "parliament.cy": 1,
    "parliament.nz": 1,
    "parma.it": 1,
    "paroch.k12.ma.us": 1,
    "parti.se": 1,
    "pasadena.museum": 1,
    "passenger-association.aero": 1,
    "pavia.it": 1,
    "pb.ao": 1,
    "pc.it": 1,
    "pc.pl": 1,
    "pd.it": 1,
    "pe.ca": 1,
    "pe.it": 1,
    "pe.kr": 1,
    "penza.ru": 1,
    "penza.su": 1,
    "per.la": 1,
    "per.nf": 1,
    "per.sg": 1,
    "perm.ru": 1,
    "perso.ht": 1,
    "perso.sn": 1,
    "perso.tn": 1,
    "perugia.it": 1,
    "pesaro-urbino.it": 1,
    "pesarourbino.it": 1,
    "pescara.it": 1,
    "pg": 2,
    "pg.it": 1,
    "pharmacien.fr": 1,
    "pharmaciens.km": 1,
    "pharmacy.museum": 1,
    "philadelphia.museum": 1,
    "philadelphiaarea.museum": 1,
    "philately.museum": 1,
    "phoenix.museum": 1,
    "photography.museum": 1,
    "pi.it": 1,
    "piacenza.it": 1,
    "piedmont.it": 1,
    "piemonte.it": 1,
    "pila.pl": 1,
    "pilot.aero": 1,
    "pilots.museum": 1,
    "pinb.gov.pl": 1,
    "pippu.hokkaido.jp": 1,
    "pisa.it": 1,
    "pistoia.it": 1,
    "pisz.pl": 1,
    "pittsburgh.museum": 1,
    "piw.gov.pl": 1,
    "pl.eu.org": 1,
    "pl.ua": 1,
    "planetarium.museum": 1,
    "plantation.museum": 1,
    "plants.museum": 1,
    "platform.sh": 2,
    "plaza.museum": 1,
    "plc.co.im": 1,
    "plc.ly": 1,
    "plc.uk": 1,
    "plo.ps": 1,
    "pmn.it": 1,
    "pn.it": 1,
    "po.gov.pl": 1,
    "po.it": 1,
    "podhale.pl": 1,
    "podlasie.pl": 1,
    "podzone.net": 1,
    "podzone.org": 1,
    "pokrovsk.su": 1,
    "pol.dz": 1,
    "pol.ht": 1,
    "pol.tr": 1,
    "police.uk": 1,
    "polkowice.pl": 1,
    "poltava.ua": 1,
    "pomorskie.pl": 1,
    "pomorze.pl": 1,
    "pordenone.it": 1,
    "porsanger.no": 1,
    "porsangu.no": 1,
    "porsgrunn.no": 1,
    "pors\u00e1\u014bgu.no": 1,
    "port.fr": 1,
    "portal.museum": 1,
    "portland.museum": 1,
    "portlligat.museum": 1,
    "posts-and-telecommunications.museum": 1,
    "potenza.it": 1,
    "powiat.pl": 1,
    "poznan.pl": 1,
    "pp.az": 1,
    "pp.ru": 1,
    "pp.se": 1,
    "pp.ua": 1,
    "ppg.br": 1,
    "pr.it": 1,
    "pr.us": 1,
    "prato.it": 1,
    "prd.fr": 1,
    "prd.km": 1,
    "prd.mg": 1,
    "preservation.museum": 1,
    "presidio.museum": 1,
    "press.aero": 1,
    "press.cy": 1,
    "press.ma": 1,
    "press.museum": 1,
    "press.se": 1,
    "presse.ci": 1,
    "presse.fr": 1,
    "presse.km": 1,
    "presse.ml": 1,
    "pri.ee": 1,
    "principe.st": 1,
    "priv.at": 1,
    "priv.hu": 1,
    "priv.me": 1,
    "priv.no": 1,
    "priv.pl": 1,
    "pro.az": 1,
    "pro.br": 1,
    "pro.cy": 1,
    "pro.ec": 1,
    "pro.ht": 1,
    "pro.mv": 1,
    "pro.na": 1,
    "pro.om": 1,
    "pro.pr": 1,
    "pro.tt": 1,
    "pro.vn": 1,
    "prochowice.pl": 1,
    "production.aero": 1,
    "prof.pr": 1,
    "project.museum": 1,
    "pruszkow.pl": 1,
    "przeworsk.pl": 1,
    "psc.br": 1,
    "psi.br": 1,
    "psp.gov.pl": 1,
    "psse.gov.pl": 1,
    "pt.eu.org": 1,
    "pt.it": 1,
    "ptz.ru": 1,
    "pu.it": 1,
    "pub.sa": 1,
    "publ.pt": 1,
    "public.museum": 1,
    "pubol.museum": 1,
    "pug.it": 1,
    "puglia.it": 1,
    "pulawy.pl": 1,
    "pup.gov.pl": 1,
    "pv.it": 1,
    "pvt.ge": 1,
    "pvt.k12.ma.us": 1,
    "pyatigorsk.ru": 1,
    "pz.it": 1,
    "q-a.eu.org": 1,
    "q.bg": 1,
    "qa2.com": 1,
    "qc.ca": 1,
    "qc.com": 1,
    "qh.cn": 1,
    "qld.au": 1,
    "qld.edu.au": 1,
    "qld.gov.au": 1,
    "qsl.br": 1,
    "quebec.museum": 1,
    "r.bg": 1,
    "r.cdn77.net": 1,
    "r.se": 1,
    "ra.it": 1,
    "rackmaze.com": 1,
    "rackmaze.net": 1,
    "rade.no": 1,
    "radio.br": 1,
    "radom.pl": 1,
    "radoy.no": 1,
    "rad\u00f8y.no": 1,
    "ragusa.it": 1,
    "rahkkeravju.no": 1,
    "raholt.no": 1,
    "railroad.museum": 1,
    "railway.museum": 1,
    "raisa.no": 1,
    "rakkestad.no": 1,
    "ralingen.no": 1,
    "rana.no": 1,
    "randaberg.no": 1,
    "rankoshi.hokkaido.jp": 1,
    "ranzan.saitama.jp": 1,
    "rauma.no": 1,
    "ravenna.it": 1,
    "rawa-maz.pl": 1,
    "rc.it": 1,
    "re.it": 1,
    "re.kr": 1,
    "readmyblog.org": 1,
    "realestate.pl": 1,
    "rebun.hokkaido.jp": 1,
    "rec.br": 1,
    "rec.co": 1,
    "rec.nf": 1,
    "rec.ro": 1,
    "rec.ve": 1,
    "recht.pro": 1,
    "recreation.aero": 1,
    "red.sv": 1,
    "reggio-calabria.it": 1,
    "reggio-emilia.it": 1,
    "reggiocalabria.it": 1,
    "reggioemilia.it": 1,
    "reklam.hu": 1,
    "rel.ht": 1,
    "rel.pl": 1,
    "rendalen.no": 1,
    "rennebu.no": 1,
    "rennesoy.no": 1,
    "rennes\u00f8y.no": 1,
    "rep.kp": 1,
    "repbody.aero": 1,
    "res.aero": 1,
    "res.in": 1,
    "research.aero": 1,
    "research.museum": 1,
    "resistance.museum": 1,
    "rg.it": 1,
    "rhcloud.com": 1,
    "ri.it": 1,
    "ri.us": 1,
    "rieti.it": 1,
    "rifu.miyagi.jp": 1,
    "riik.ee": 1,
    "rikubetsu.hokkaido.jp": 1,
    "rikuzentakata.iwate.jp": 1,
    "rimini.it": 1,
    "rindal.no": 1,
    "ringebu.no": 1,
    "ringerike.no": 1,
    "ringsaker.no": 1,
    "riodejaneiro.museum": 1,
    "rishiri.hokkaido.jp": 1,
    "rishirifuji.hokkaido.jp": 1,
    "risor.no": 1,
    "rissa.no": 1,
    "ris\u00f8r.no": 1,
    "ritto.shiga.jp": 1,
    "rivne.ua": 1,
    "rl.no": 1,
    "rm.it": 1,
    "rn.it": 1,
    "rnd.ru": 1,
    "rnrt.tn": 1,
    "rns.tn": 1,
    "rnu.tn": 1,
    "ro.com": 1,
    "ro.eu.org": 1,
    "ro.it": 1,
    "roan.no": 1,
    "rochester.museum": 1,
    "rockart.museum": 1,
    "rodoy.no": 1,
    "rokunohe.aomori.jp": 1,
    "rollag.no": 1,
    "roma.it": 1,
    "roma.museum": 1,
    "rome.it": 1,
    "romsa.no": 1,
    "romskog.no": 1,
    "roros.no": 1,
    "rost.no": 1,
    "rotorcraft.aero": 1,
    "rovigo.it": 1,
    "rovno.ua": 1,
    "royken.no": 1,
    "royrvik.no": 1,
    "rs.ba": 1,
    "rsc.cdn77.org": 1,
    "ru.com": 1,
    "ru.eu.org": 1,
    "rubtsovsk.ru": 1,
    "ruovat.no": 1,
    "russia.museum": 1,
    "rv.ua": 1,
    "ryazan.ru": 1,
    "rybnik.pl": 1,
    "rygge.no": 1,
    "ryokami.saitama.jp": 1,
    "ryugasaki.ibaraki.jp": 1,
    "ryuoh.shiga.jp": 1,
    "rzeszow.pl": 1,
    "rzgw.gov.pl": 1,
    "r\u00e1hkker\u00e1vju.no": 1,
    "r\u00e1isa.no": 1,
    "r\u00e5de.no": 1,
    "r\u00e5holt.no": 1,
    "r\u00e6lingen.no": 1,
    "r\u00f8d\u00f8y.no": 1,
    "r\u00f8mskog.no": 1,
    "r\u00f8ros.no": 1,
    "r\u00f8st.no": 1,
    "r\u00f8yken.no": 1,
    "r\u00f8yrvik.no": 1,
    "s.bg": 1,
    "s.se": 1,
    "s3-ap-northeast-1.amazonaws.com": 1,
    "s3-ap-northeast-2.amazonaws.com": 1,
    "s3-ap-southeast-1.amazonaws.com": 1,
    "s3-ap-southeast-2.amazonaws.com": 1,
    "s3-eu-central-1.amazonaws.com": 1,
    "s3-eu-west-1.amazonaws.com": 1,
    "s3-external-1.amazonaws.com": 1,
    "s3-external-2.amazonaws.com": 1,
    "s3-fips-us-gov-west-1.amazonaws.com": 1,
    "s3-sa-east-1.amazonaws.com": 1,
    "s3-us-gov-west-1.amazonaws.com": 1,
    "s3-us-west-1.amazonaws.com": 1,
    "s3-us-west-2.amazonaws.com": 1,
    "s3.amazonaws.com": 1,
    "s3.ap-northeast-2.amazonaws.com": 1,
    "s3.cn-north-1.amazonaws.com.cn": 1,
    "s3.eu-central-1.amazonaws.com": 1,
    "sa-east-1.compute.amazonaws.com": 1,
    "sa.au": 1,
    "sa.com": 1,
    "sa.cr": 1,
    "sa.edu.au": 1,
    "sa.gov.au": 1,
    "sa.gov.pl": 1,
    "sa.it": 1,
    "sabae.fukui.jp": 1,
    "sado.niigata.jp": 1,
    "safety.aero": 1,
    "saga.jp": 1,
    "saga.saga.jp": 1,
    "sagae.yamagata.jp": 1,
    "sagamihara.kanagawa.jp": 1,
    "saigawa.fukuoka.jp": 1,
    "saijo.ehime.jp": 1,
    "saikai.nagasaki.jp": 1,
    "saiki.oita.jp": 1,
    "saintlouis.museum": 1,
    "saitama.jp": 1,
    "saitama.saitama.jp": 1,
    "saito.miyazaki.jp": 1,
    "saka.hiroshima.jp": 1,
    "sakado.saitama.jp": 1,
    "sakae.chiba.jp": 1,
    "sakae.nagano.jp": 1,
    "sakahogi.gifu.jp": 1,
    "sakai.fukui.jp": 1,
    "sakai.ibaraki.jp": 1,
    "sakai.osaka.jp": 1,
    "sakaiminato.tottori.jp": 1,
    "sakaki.nagano.jp": 1,
    "sakata.yamagata.jp": 1,
    "sakawa.kochi.jp": 1,
    "sakegawa.yamagata.jp": 1,
    "sakhalin.ru": 1,
    "saku.nagano.jp": 1,
    "sakuho.nagano.jp": 1,
    "sakura.chiba.jp": 1,
    "sakura.tochigi.jp": 1,
    "sakuragawa.ibaraki.jp": 1,
    "sakurai.nara.jp": 1,
    "sakyo.kyoto.jp": 1,
    "salangen.no": 1,
    "salat.no": 1,
    "salem.museum": 1,
    "salerno.it": 1,
    "saltdal.no": 1,
    "salvadordali.museum": 1,
    "salzburg.museum": 1,
    "samara.ru": 1,
    "samegawa.fukushima.jp": 1,
    "samnanger.no": 1,
    "samukawa.kanagawa.jp": 1,
    "sanagochi.tokushima.jp": 1,
    "sanda.hyogo.jp": 1,
    "sandcats.io": 1,
    "sande.more-og-romsdal.no": 1,
    "sande.m\u00f8re-og-romsdal.no": 1,
    "sande.vestfold.no": 1,
    "sandefjord.no": 1,
    "sandiego.museum": 1,
    "sandnes.no": 1,
    "sandnessjoen.no": 1,
    "sandnessj\u00f8en.no": 1,
    "sandoy.no": 1,
    "sand\u00f8y.no": 1,
    "sanfrancisco.museum": 1,
    "sango.nara.jp": 1,
    "sanjo.niigata.jp": 1,
    "sannan.hyogo.jp": 1,
    "sannohe.aomori.jp": 1,
    "sano.tochigi.jp": 1,
    "sanok.pl": 1,
    "santabarbara.museum": 1,
    "santacruz.museum": 1,
    "santafe.museum": 1,
    "sanuki.kagawa.jp": 1,
    "saotome.st": 1,
    "sapporo.jp": 2,
    "sar.it": 1,
    "saratov.ru": 1,
    "sardegna.it": 1,
    "sardinia.it": 1,
    "saroma.hokkaido.jp": 1,
    "sarpsborg.no": 1,
    "sarufutsu.hokkaido.jp": 1,
    "sasaguri.fukuoka.jp": 1,
    "sasayama.hyogo.jp": 1,
    "sasebo.nagasaki.jp": 1,
    "saskatchewan.museum": 1,
    "sassari.it": 1,
    "satosho.okayama.jp": 1,
    "satsumasendai.kagoshima.jp": 1,
    "satte.saitama.jp": 1,
    "satx.museum": 1,
    "sauda.no": 1,
    "sauherad.no": 1,
    "savannahga.museum": 1,
    "saves-the-whales.com": 1,
    "savona.it": 1,
    "sayama.osaka.jp": 1,
    "sayama.saitama.jp": 1,
    "sayo.hyogo.jp": 1,
    "sb.ua": 1,
    "sc.cn": 1,
    "sc.kr": 1,
    "sc.tz": 1,
    "sc.ug": 1,
    "sc.us": 1,
    "sch.ae": 1,
    "sch.id": 1,
    "sch.ir": 1,
    "sch.jo": 1,
    "sch.lk": 1,
    "sch.ly": 1,
    "sch.ng": 1,
    "sch.qa": 1,
    "sch.sa": 1,
    "sch.uk": 2,
    "schlesisches.museum": 1,
    "schoenbrunn.museum": 1,
    "schokoladen.museum": 1,
    "school.museum": 1,
    "school.na": 1,
    "school.nz": 1,
    "school.za": 1,
    "schweiz.museum": 1,
    "sci.eg": 1,
    "science-fiction.museum": 1,
    "science.museum": 1,
    "scienceandhistory.museum": 1,
    "scienceandindustry.museum": 1,
    "sciencecenter.museum": 1,
    "sciencecenters.museum": 1,
    "sciencehistory.museum": 1,
    "sciences.museum": 1,
    "sciencesnaturelles.museum": 1,
    "scientist.aero": 1,
    "scotland.museum": 1,
    "scrapper-site.net": 1,
    "scrapping.cc": 1,
    "sd.cn": 1,
    "sd.us": 1,
    "sdn.gov.pl": 1,
    "se.com": 1,
    "se.eu.org": 1,
    "se.net": 1,
    "seaport.museum": 1,
    "sebastopol.ua": 1,
    "sec.ps": 1,
    "seihi.nagasaki.jp": 1,
    "seika.kyoto.jp": 1,
    "seiro.niigata.jp": 1,
    "seirou.niigata.jp": 1,
    "seiyo.ehime.jp": 1,
    "sejny.pl": 1,
    "seki.gifu.jp": 1,
    "sekigahara.gifu.jp": 1,
    "sekikawa.niigata.jp": 1,
    "sel.no": 1,
    "selbu.no": 1,
    "selfip.biz": 1,
    "selfip.com": 1,
    "selfip.info": 1,
    "selfip.net": 1,
    "selfip.org": 1,
    "selje.no": 1,
    "seljord.no": 1,
    "sells-for-less.com": 1,
    "sells-for-u.com": 1,
    "sells-it.net": 1,
    "sellsyourhome.org": 1,
    "semboku.akita.jp": 1,
    "semine.miyagi.jp": 1,
    "sendai.jp": 2,
    "sennan.osaka.jp": 1,
    "seoul.kr": 1,
    "sera.hiroshima.jp": 1,
    "seranishi.hiroshima.jp": 1,
    "servebbs.com": 1,
    "servebbs.net": 1,
    "servebbs.org": 1,
    "serveftp.net": 1,
    "serveftp.org": 1,
    "servegame.org": 1,
    "service.gov.uk": 1,
    "services.aero": 1,
    "setagaya.tokyo.jp": 1,
    "seto.aichi.jp": 1,
    "setouchi.okayama.jp": 1,
    "settlement.museum": 1,
    "settlers.museum": 1,
    "settsu.osaka.jp": 1,
    "sevastopol.ua": 1,
    "sex.hu": 1,
    "sex.pl": 1,
    "sf.no": 1,
    "sh.cn": 1,
    "shacknet.nu": 1,
    "shakotan.hokkaido.jp": 1,
    "shari.hokkaido.jp": 1,
    "shell.museum": 1,
    "sherbrooke.museum": 1,
    "shibata.miyagi.jp": 1,
    "shibata.niigata.jp": 1,
    "shibecha.hokkaido.jp": 1,
    "shibetsu.hokkaido.jp": 1,
    "shibukawa.gunma.jp": 1,
    "shibuya.tokyo.jp": 1,
    "shichikashuku.miyagi.jp": 1,
    "shichinohe.aomori.jp": 1,
    "shiga.jp": 1,
    "shiiba.miyazaki.jp": 1,
    "shijonawate.osaka.jp": 1,
    "shika.ishikawa.jp": 1,
    "shikabe.hokkaido.jp": 1,
    "shikama.miyagi.jp": 1,
    "shikaoi.hokkaido.jp": 1,
    "shikatsu.aichi.jp": 1,
    "shiki.saitama.jp": 1,
    "shikokuchuo.ehime.jp": 1,
    "shima.mie.jp": 1,
    "shimabara.nagasaki.jp": 1,
    "shimada.shizuoka.jp": 1,
    "shimamaki.hokkaido.jp": 1,
    "shimamoto.osaka.jp": 1,
    "shimane.jp": 1,
    "shimane.shimane.jp": 1,
    "shimizu.hokkaido.jp": 1,
    "shimizu.shizuoka.jp": 1,
    "shimoda.shizuoka.jp": 1,
    "shimodate.ibaraki.jp": 1,
    "shimofusa.chiba.jp": 1,
    "shimogo.fukushima.jp": 1,
    "shimoichi.nara.jp": 1,
    "shimoji.okinawa.jp": 1,
    "shimokawa.hokkaido.jp": 1,
    "shimokitayama.nara.jp": 1,
    "shimonita.gunma.jp": 1,
    "shimonoseki.yamaguchi.jp": 1,
    "shimosuwa.nagano.jp": 1,
    "shimotsuke.tochigi.jp": 1,
    "shimotsuma.ibaraki.jp": 1,
    "shinagawa.tokyo.jp": 1,
    "shinanomachi.nagano.jp": 1,
    "shingo.aomori.jp": 1,
    "shingu.fukuoka.jp": 1,
    "shingu.hyogo.jp": 1,
    "shingu.wakayama.jp": 1,
    "shinichi.hiroshima.jp": 1,
    "shinjo.nara.jp": 1,
    "shinjo.okayama.jp": 1,
    "shinjo.yamagata.jp": 1,
    "shinjuku.tokyo.jp": 1,
    "shinkamigoto.nagasaki.jp": 1,
    "shinonsen.hyogo.jp": 1,
    "shinshinotsu.hokkaido.jp": 1,
    "shinshiro.aichi.jp": 1,
    "shinto.gunma.jp": 1,
    "shintoku.hokkaido.jp": 1,
    "shintomi.miyazaki.jp": 1,
    "shinyoshitomi.fukuoka.jp": 1,
    "shiogama.miyagi.jp": 1,
    "shiojiri.nagano.jp": 1,
    "shioya.tochigi.jp": 1,
    "shirahama.wakayama.jp": 1,
    "shirakawa.fukushima.jp": 1,
    "shirakawa.gifu.jp": 1,
    "shirako.chiba.jp": 1,
    "shiranuka.hokkaido.jp": 1,
    "shiraoi.hokkaido.jp": 1,
    "shiraoka.saitama.jp": 1,
    "shirataka.yamagata.jp": 1,
    "shiriuchi.hokkaido.jp": 1,
    "shiroi.chiba.jp": 1,
    "shiroishi.miyagi.jp": 1,
    "shiroishi.saga.jp": 1,
    "shirosato.ibaraki.jp": 1,
    "shishikui.tokushima.jp": 1,
    "shiso.hyogo.jp": 1,
    "shisui.chiba.jp": 1,
    "shitara.aichi.jp": 1,
    "shiwa.iwate.jp": 1,
    "shizukuishi.iwate.jp": 1,
    "shizuoka.jp": 1,
    "shizuoka.shizuoka.jp": 1,
    "shobara.hiroshima.jp": 1,
    "shonai.fukuoka.jp": 1,
    "shonai.yamagata.jp": 1,
    "shoo.okayama.jp": 1,
    "shop.ht": 1,
    "shop.hu": 1,
    "shop.pl": 1,
    "show.aero": 1,
    "showa.fukushima.jp": 1,
    "showa.gunma.jp": 1,
    "showa.yamanashi.jp": 1,
    "shunan.yamaguchi.jp": 1,
    "si.eu.org": 1,
    "si.it": 1,
    "sibenik.museum": 1,
    "sic.it": 1,
    "sicilia.it": 1,
    "sicily.it": 1,
    "siellak.no": 1,
    "siena.it": 1,
    "sigdal.no": 1,
    "siljan.no": 1,
    "silk.museum": 1,
    "simbirsk.ru": 1,
    "simple-url.com": 1,
    "sinaapp.com": 1,
    "siracusa.it": 1,
    "sirdal.no": 1,
    "sk.ca": 1,
    "sk.eu.org": 1,
    "skanit.no": 1,
    "skanland.no": 1,
    "skaun.no": 1,
    "skedsmo.no": 1,
    "skedsmokorset.no": 1,
    "ski.museum": 1,
    "ski.no": 1,
    "skien.no": 1,
    "skierva.no": 1,
    "skierv\u00e1.no": 1,
    "skiptvet.no": 1,
    "skjak.no": 1,
    "skjervoy.no": 1,
    "skjerv\u00f8y.no": 1,
    "skj\u00e5k.no": 1,
    "sklep.pl": 1,
    "sko.gov.pl": 1,
    "skoczow.pl": 1,
    "skodje.no": 1,
    "skole.museum": 1,
    "skydiving.aero": 1,
    "sk\u00e1nit.no": 1,
    "sk\u00e5nland.no": 1,
    "slask.pl": 1,
    "slattum.no": 1,
    "sld.do": 1,
    "sld.pa": 1,
    "slg.br": 1,
    "slupsk.pl": 1,
    "sm.ua": 1,
    "smola.no": 1,
    "smolensk.ru": 1,
    "sm\u00f8la.no": 1,
    "sn.cn": 1,
    "snaase.no": 1,
    "snasa.no": 1,
    "snillfjord.no": 1,
    "snoasa.no": 1,
    "snz.ru": 1,
    "sn\u00e5ase.no": 1,
    "sn\u00e5sa.no": 1,
    "so.gov.pl": 1,
    "so.it": 1,
    "sobetsu.hokkaido.jp": 1,
    "soc.lk": 1,
    "sochi.su": 1,
    "society.museum": 1,
    "sodegaura.chiba.jp": 1,
    "soeda.fukuoka.jp": 1,
    "software.aero": 1,
    "sogndal.no": 1,
    "sogne.no": 1,
    "soja.okayama.jp": 1,
    "soka.saitama.jp": 1,
    "sokndal.no": 1,
    "sola.no": 1,
    "sologne.museum": 1,
    "solund.no": 1,
    "soma.fukushima.jp": 1,
    "somna.no": 1,
    "sondre-land.no": 1,
    "sondrio.it": 1,
    "songdalen.no": 1,
    "soni.nara.jp": 1,
    "soo.kagoshima.jp": 1,
    "sopot.pl": 1,
    "sor-aurdal.no": 1,
    "sor-fron.no": 1,
    "sor-odal.no": 1,
    "sor-varanger.no": 1,
    "sorfold.no": 1,
    "sorreisa.no": 1,
    "sortland.no": 1,
    "sorum.no": 1,
    "sos.pl": 1,
    "sosa.chiba.jp": 1,
    "sosnowiec.pl": 1,
    "soundandvision.museum": 1,
    "southcarolina.museum": 1,
    "southwest.museum": 1,
    "sowa.ibaraki.jp": 1,
    "sp.it": 1,
    "space-to-rent.com": 1,
    "space.museum": 1,
    "spb.ru": 1,
    "spb.su": 1,
    "spjelkavik.no": 1,
    "sport.hu": 1,
    "spy.museum": 1,
    "spydeberg.no": 1,
    "square.museum": 1,
    "sr.gov.pl": 1,
    "sr.it": 1,
    "srv.br": 1,
    "ss.it": 1,
    "ssl.origin.cdn77-secure.org": 1,
    "st.no": 1,
    "stadt.museum": 1,
    "stalbans.museum": 1,
    "stalowa-wola.pl": 1,
    "stange.no": 1,
    "starachowice.pl": 1,
    "stargard.pl": 1,
    "starnberg.museum": 1,
    "starostwo.gov.pl": 1,
    "stat.no": 1,
    "state.museum": 1,
    "stateofdelaware.museum": 1,
    "stathelle.no": 1,
    "station.museum": 1,
    "stavanger.no": 1,
    "stavern.no": 1,
    "stavropol.ru": 1,
    "steam.museum": 1,
    "steiermark.museum": 1,
    "steigen.no": 1,
    "steinkjer.no": 1,
    "stjohn.museum": 1,
    "stjordal.no": 1,
    "stjordalshalsen.no": 1,
    "stj\u00f8rdal.no": 1,
    "stj\u00f8rdalshalsen.no": 1,
    "stockholm.museum": 1,
    "stokke.no": 1,
    "stor-elvdal.no": 1,
    "stord.no": 1,
    "stordal.no": 1,
    "store.bb": 1,
    "store.nf": 1,
    "store.ro": 1,
    "store.st": 1,
    "store.ve": 1,
    "storfjord.no": 1,
    "stpetersburg.museum": 1,
    "strand.no": 1,
    "stranda.no": 1,
    "stryn.no": 1,
    "student.aero": 1,
    "stuff-4-sale.org": 1,
    "stuff-4-sale.us": 1,
    "stuttgart.museum": 1,
    "stv.ru": 1,
    "sue.fukuoka.jp": 1,
    "suedtirol.it": 1,
    "suginami.tokyo.jp": 1,
    "sugito.saitama.jp": 1,
    "suifu.ibaraki.jp": 1,
    "suisse.museum": 1,
    "suita.osaka.jp": 1,
    "sukagawa.fukushima.jp": 1,
    "sukumo.kochi.jp": 1,
    "sula.no": 1,
    "suldal.no": 1,
    "suli.hu": 1,
    "sumida.tokyo.jp": 1,
    "sumita.iwate.jp": 1,
    "sumoto.hyogo.jp": 1,
    "sumoto.kumamoto.jp": 1,
    "sumy.ua": 1,
    "sunagawa.hokkaido.jp": 1,
    "sund.no": 1,
    "sunndal.no": 1,
    "surgeonshall.museum": 1,
    "surgut.ru": 1,
    "surnadal.no": 1,
    "surrey.museum": 1,
    "susaki.kochi.jp": 1,
    "susono.shizuoka.jp": 1,
    "suwa.nagano.jp": 1,
    "suwalki.pl": 1,
    "suzaka.nagano.jp": 1,
    "suzu.ishikawa.jp": 1,
    "suzuka.mie.jp": 1,
    "sv.it": 1,
    "svalbard.no": 1,
    "sveio.no": 1,
    "svelvik.no": 1,
    "svizzera.museum": 1,
    "sweden.museum": 1,
    "swidnica.pl": 1,
    "swiebodzin.pl": 1,
    "swinoujscie.pl": 1,
    "sx.cn": 1,
    "sydney.museum": 1,
    "sykkylven.no": 1,
    "synology.me": 1,
    "syzran.ru": 1,
    "szczecin.pl": 1,
    "szczytno.pl": 1,
    "szex.hu": 1,
    "szkola.pl": 1,
    "s\u00e1lat.no": 1,
    "s\u00e1l\u00e1t.no": 1,
    "s\u00f8gne.no": 1,
    "s\u00f8mna.no": 1,
    "s\u00f8ndre-land.no": 1,
    "s\u00f8r-aurdal.no": 1,
    "s\u00f8r-fron.no": 1,
    "s\u00f8r-odal.no": 1,
    "s\u00f8r-varanger.no": 1,
    "s\u00f8rfold.no": 1,
    "s\u00f8rreisa.no": 1,
    "s\u00f8rum.no": 1,
    "t.bg": 1,
    "t.se": 1,
    "ta.it": 1,
    "taa.it": 1,
    "tabayama.yamanashi.jp": 1,
    "tabuse.yamaguchi.jp": 1,
    "tachiarai.fukuoka.jp": 1,
    "tachikawa.tokyo.jp": 1,
    "tadaoka.osaka.jp": 1,
    "tado.mie.jp": 1,
    "tadotsu.kagawa.jp": 1,
    "tagajo.miyagi.jp": 1,
    "tagami.niigata.jp": 1,
    "tagawa.fukuoka.jp": 1,
    "tahara.aichi.jp": 1,
    "taiji.wakayama.jp": 1,
    "taiki.hokkaido.jp": 1,
    "taiki.mie.jp": 1,
    "tainai.niigata.jp": 1,
    "taira.toyama.jp": 1,
    "taishi.hyogo.jp": 1,
    "taishi.osaka.jp": 1,
    "taishin.fukushima.jp": 1,
    "taito.tokyo.jp": 1,
    "taiwa.miyagi.jp": 1,
    "tajimi.gifu.jp": 1,
    "tajiri.osaka.jp": 1,
    "taka.hyogo.jp": 1,
    "takagi.nagano.jp": 1,
    "takahagi.ibaraki.jp": 1,
    "takahama.aichi.jp": 1,
    "takahama.fukui.jp": 1,
    "takaharu.miyazaki.jp": 1,
    "takahashi.okayama.jp": 1,
    "takahata.yamagata.jp": 1,
    "takaishi.osaka.jp": 1,
    "takamatsu.kagawa.jp": 1,
    "takamori.kumamoto.jp": 1,
    "takamori.nagano.jp": 1,
    "takanabe.miyazaki.jp": 1,
    "takanezawa.tochigi.jp": 1,
    "takaoka.toyama.jp": 1,
    "takarazuka.hyogo.jp": 1,
    "takasago.hyogo.jp": 1,
    "takasaki.gunma.jp": 1,
    "takashima.shiga.jp": 1,
    "takasu.hokkaido.jp": 1,
    "takata.fukuoka.jp": 1,
    "takatori.nara.jp": 1,
    "takatsuki.osaka.jp": 1,
    "takatsuki.shiga.jp": 1,
    "takayama.gifu.jp": 1,
    "takayama.gunma.jp": 1,
    "takayama.nagano.jp": 1,
    "takazaki.miyazaki.jp": 1,
    "takehara.hiroshima.jp": 1,
    "taketa.oita.jp": 1,
    "taketomi.okinawa.jp": 1,
    "taki.mie.jp": 1,
    "takikawa.hokkaido.jp": 1,
    "takino.hyogo.jp": 1,
    "takinoue.hokkaido.jp": 1,
    "takko.aomori.jp": 1,
    "tako.chiba.jp": 1,
    "taku.saga.jp": 1,
    "tama.tokyo.jp": 1,
    "tamakawa.fukushima.jp": 1,
    "tamaki.mie.jp": 1,
    "tamamura.gunma.jp": 1,
    "tamano.okayama.jp": 1,
    "tamatsukuri.ibaraki.jp": 1,
    "tamayu.shimane.jp": 1,
    "tamba.hyogo.jp": 1,
    "tambov.ru": 1,
    "tana.no": 1,
    "tanabe.kyoto.jp": 1,
    "tanabe.wakayama.jp": 1,
    "tanagura.fukushima.jp": 1,
    "tananger.no": 1,
    "tank.museum": 1,
    "tanohata.iwate.jp": 1,
    "tara.saga.jp": 1,
    "tarama.okinawa.jp": 1,
    "taranto.it": 1,
    "targi.pl": 1,
    "tarnobrzeg.pl": 1,
    "tarui.gifu.jp": 1,
    "tarumizu.kagoshima.jp": 1,
    "tas.au": 1,
    "tas.edu.au": 1,
    "tas.gov.au": 1,
    "tatarstan.ru": 1,
    "tatebayashi.gunma.jp": 1,
    "tateshina.nagano.jp": 1,
    "tateyama.chiba.jp": 1,
    "tateyama.toyama.jp": 1,
    "tatsuno.hyogo.jp": 1,
    "tatsuno.nagano.jp": 1,
    "tawaramoto.nara.jp": 1,
    "taxi.br": 1,
    "tcm.museum": 1,
    "te.it": 1,
    "te.ua": 1,
    "teaches-yoga.com": 1,
    "tec.ve": 1,
    "technology.museum": 1,
    "tel.tr": 1,
    "teledata.mz": 0,
    "telekommunikation.museum": 1,
    "television.museum": 1,
    "tempio-olbia.it": 1,
    "tempioolbia.it": 1,
    "tendo.yamagata.jp": 1,
    "tenei.fukushima.jp": 1,
    "tenkawa.nara.jp": 1,
    "tenri.nara.jp": 1,
    "teo.br": 1,
    "teramo.it": 1,
    "terni.it": 1,
    "ternopil.ua": 1,
    "teshikaga.hokkaido.jp": 1,
    "test.ru": 1,
    "test.tj": 1,
    "texas.museum": 1,
    "textile.museum": 1,
    "tgory.pl": 1,
    "theater.museum": 1,
    "thruhere.net": 1,
    "time.museum": 1,
    "time.no": 1,
    "timekeeping.museum": 1,
    "tingvoll.no": 1,
    "tinn.no": 1,
    "tj.cn": 1,
    "tjeldsund.no": 1,
    "tjome.no": 1,
    "tj\u00f8me.no": 1,
    "tm.cy": 1,
    "tm.fr": 1,
    "tm.hu": 1,
    "tm.km": 1,
    "tm.mc": 1,
    "tm.mg": 1,
    "tm.no": 1,
    "tm.pl": 1,
    "tm.ro": 1,
    "tm.se": 1,
    "tm.za": 1,
    "tmp.br": 1,
    "tn.it": 1,
    "tn.us": 1,
    "to.it": 1,
    "toba.mie.jp": 1,
    "tobe.ehime.jp": 1,
    "tobetsu.hokkaido.jp": 1,
    "tobishima.aichi.jp": 1,
    "tochigi.jp": 1,
    "tochigi.tochigi.jp": 1,
    "tochio.niigata.jp": 1,
    "toda.saitama.jp": 1,
    "toei.aichi.jp": 1,
    "toga.toyama.jp": 1,
    "togakushi.nagano.jp": 1,
    "togane.chiba.jp": 1,
    "togitsu.nagasaki.jp": 1,
    "togliatti.su": 1,
    "togo.aichi.jp": 1,
    "togura.nagano.jp": 1,
    "tohma.hokkaido.jp": 1,
    "tohnosho.chiba.jp": 1,
    "toho.fukuoka.jp": 1,
    "tokai.aichi.jp": 1,
    "tokai.ibaraki.jp": 1,
    "tokamachi.niigata.jp": 1,
    "tokashiki.okinawa.jp": 1,
    "toki.gifu.jp": 1,
    "tokigawa.saitama.jp": 1,
    "tokke.no": 1,
    "tokoname.aichi.jp": 1,
    "tokorozawa.saitama.jp": 1,
    "tokushima.jp": 1,
    "tokushima.tokushima.jp": 1,
    "tokuyama.yamaguchi.jp": 1,
    "tokyo.jp": 1,
    "tolga.no": 1,
    "tom.ru": 1,
    "tomakomai.hokkaido.jp": 1,
    "tomari.hokkaido.jp": 1,
    "tome.miyagi.jp": 1,
    "tomi.nagano.jp": 1,
    "tomigusuku.okinawa.jp": 1,
    "tomika.gifu.jp": 1,
    "tomioka.gunma.jp": 1,
    "tomisato.chiba.jp": 1,
    "tomiya.miyagi.jp": 1,
    "tomobe.ibaraki.jp": 1,
    "tomsk.ru": 1,
    "tonaki.okinawa.jp": 1,
    "tonami.toyama.jp": 1,
    "tondabayashi.osaka.jp": 1,
    "tone.ibaraki.jp": 1,
    "tono.iwate.jp": 1,
    "tonosho.kagawa.jp": 1,
    "tonsberg.no": 1,
    "toon.ehime.jp": 1,
    "topology.museum": 1,
    "torahime.shiga.jp": 1,
    "toride.ibaraki.jp": 1,
    "torino.it": 1,
    "torino.museum": 1,
    "torsken.no": 1,
    "tos.it": 1,
    "tosa.kochi.jp": 1,
    "tosashimizu.kochi.jp": 1,
    "toscana.it": 1,
    "toshima.tokyo.jp": 1,
    "tosu.saga.jp": 1,
    "tottori.jp": 1,
    "tottori.tottori.jp": 1,
    "touch.museum": 1,
    "tourism.pl": 1,
    "tourism.tn": 1,
    "towada.aomori.jp": 1,
    "town.museum": 1,
    "toya.hokkaido.jp": 1,
    "toyako.hokkaido.jp": 1,
    "toyama.jp": 1,
    "toyama.toyama.jp": 1,
    "toyo.kochi.jp": 1,
    "toyoake.aichi.jp": 1,
    "toyohashi.aichi.jp": 1,
    "toyokawa.aichi.jp": 1,
    "toyonaka.osaka.jp": 1,
    "toyone.aichi.jp": 1,
    "toyono.osaka.jp": 1,
    "toyooka.hyogo.jp": 1,
    "toyosato.shiga.jp": 1,
    "toyota.aichi.jp": 1,
    "toyota.yamaguchi.jp": 1,
    "toyotomi.hokkaido.jp": 1,
    "toyotsu.fukuoka.jp": 1,
    "toyoura.hokkaido.jp": 1,
    "tozawa.yamagata.jp": 1,
    "tozsde.hu": 1,
    "tp.it": 1,
    "tr.eu.org": 1,
    "tr.it": 1,
    "tr.no": 1,
    "tra.kp": 1,
    "trader.aero": 1,
    "trading.aero": 1,
    "traeumtgerade.de": 1,
    "trainer.aero": 1,
    "trana.no": 1,
    "tranby.no": 1,
    "trani-andria-barletta.it": 1,
    "trani-barletta-andria.it": 1,
    "traniandriabarletta.it": 1,
    "tranibarlettaandria.it": 1,
    "tranoy.no": 1,
    "transport.museum": 1,
    "tran\u00f8y.no": 1,
    "trapani.it": 1,
    "travel.pl": 1,
    "travel.tt": 1,
    "trd.br": 1,
    "tree.museum": 1,
    "trentino-a-adige.it": 1,
    "trentino-aadige.it": 1,
    "trentino-alto-adige.it": 1,
    "trentino-altoadige.it": 1,
    "trentino-s-tirol.it": 1,
    "trentino-stirol.it": 1,
    "trentino-sud-tirol.it": 1,
    "trentino-sudtirol.it": 1,
    "trentino-sued-tirol.it": 1,
    "trentino-suedtirol.it": 1,
    "trentino.it": 1,
    "trentinoa-adige.it": 1,
    "trentinoaadige.it": 1,
    "trentinoalto-adige.it": 1,
    "trentinoaltoadige.it": 1,
    "trentinos-tirol.it": 1,
    "trentinostirol.it": 1,
    "trentinosud-tirol.it": 1,
    "trentinosudtirol.it": 1,
    "trentinosued-tirol.it": 1,
    "trentinosuedtirol.it": 1,
    "trento.it": 1,
    "treviso.it": 1,
    "trieste.it": 1,
    "troandin.no": 1,
    "trogstad.no": 1,
    "troitsk.su": 1,
    "trolley.museum": 1,
    "tromsa.no": 1,
    "tromso.no": 1,
    "troms\u00f8.no": 1,
    "trondheim.no": 1,
    "trust.museum": 1,
    "trustee.museum": 1,
    "trysil.no": 1,
    "tr\u00e6na.no": 1,
    "tr\u00f8gstad.no": 1,
    "ts.it": 1,
    "tsaritsyn.ru": 1,
    "tsk.ru": 1,
    "tsu.mie.jp": 1,
    "tsubame.niigata.jp": 1,
    "tsubata.ishikawa.jp": 1,
    "tsubetsu.hokkaido.jp": 1,
    "tsuchiura.ibaraki.jp": 1,
    "tsuga.tochigi.jp": 1,
    "tsugaru.aomori.jp": 1,
    "tsuiki.fukuoka.jp": 1,
    "tsukigata.hokkaido.jp": 1,
    "tsukiyono.gunma.jp": 1,
    "tsukuba.ibaraki.jp": 1,
    "tsukui.kanagawa.jp": 1,
    "tsukumi.oita.jp": 1,
    "tsumagoi.gunma.jp": 1,
    "tsunan.niigata.jp": 1,
    "tsuno.kochi.jp": 1,
    "tsuno.miyazaki.jp": 1,
    "tsuru.yamanashi.jp": 1,
    "tsuruga.fukui.jp": 1,
    "tsurugashima.saitama.jp": 1,
    "tsurugi.ishikawa.jp": 1,
    "tsuruoka.yamagata.jp": 1,
    "tsuruta.aomori.jp": 1,
    "tsushima.aichi.jp": 1,
    "tsushima.nagasaki.jp": 1,
    "tsuwano.shimane.jp": 1,
    "tsuyama.okayama.jp": 1,
    "tt.im": 1,
    "tula.ru": 1,
    "tula.su": 1,
    "tur.ar": 1,
    "tur.br": 1,
    "turek.pl": 1,
    "turen.tn": 1,
    "turin.it": 1,
    "turystyka.pl": 1,
    "tuscany.it": 1,
    "tuva.ru": 1,
    "tuva.su": 1,
    "tv.bb": 1,
    "tv.bo": 1,
    "tv.br": 1,
    "tv.im": 1,
    "tv.it": 1,
    "tv.na": 1,
    "tv.sd": 1,
    "tv.tr": 1,
    "tv.tz": 1,
    "tvedestrand.no": 1,
    "tver.ru": 1,
    "tw.cn": 1,
    "tx.us": 1,
    "tychy.pl": 1,
    "tydal.no": 1,
    "tynset.no": 1,
    "tysfjord.no": 1,
    "tysnes.no": 1,
    "tysvar.no": 1,
    "tysv\u00e6r.no": 1,
    "tyumen.ru": 1,
    "t\u00f8nsberg.no": 1,
    "u.bg": 1,
    "u.se": 1,
    "ube.yamaguchi.jp": 1,
    "uchihara.ibaraki.jp": 1,
    "uchiko.ehime.jp": 1,
    "uchinada.ishikawa.jp": 1,
    "uchinomi.kagawa.jp": 1,
    "ud.it": 1,
    "uda.nara.jp": 1,
    "udine.it": 1,
    "udm.ru": 1,
    "udmurtia.ru": 1,
    "udono.mie.jp": 1,
    "ueda.nagano.jp": 1,
    "ueno.gunma.jp": 1,
    "uenohara.yamanashi.jp": 1,
    "ug.gov.pl": 1,
    "ugim.gov.pl": 1,
    "uhren.museum": 1,
    "uji.kyoto.jp": 1,
    "ujiie.tochigi.jp": 1,
    "ujitawara.kyoto.jp": 1,
    "uk.com": 1,
    "uk.eu.org": 1,
    "uk.net": 1,
    "uki.kumamoto.jp": 1,
    "ukiha.fukuoka.jp": 1,
    "ulan-ude.ru": 1,
    "ullensaker.no": 1,
    "ullensvang.no": 1,
    "ulm.museum": 1,
    "ulsan.kr": 1,
    "ulvik.no": 1,
    "um.gov.pl": 1,
    "umaji.kochi.jp": 1,
    "umb.it": 1,
    "umbria.it": 1,
    "umi.fukuoka.jp": 1,
    "umig.gov.pl": 1,
    "unazuki.toyama.jp": 1,
    "unbi.ba": 1,
    "undersea.museum": 1,
    "union.aero": 1,
    "univ.sn": 1,
    "university.museum": 1,
    "unjarga.no": 1,
    "unj\u00e1rga.no": 1,
    "unnan.shimane.jp": 1,
    "unsa.ba": 1,
    "unzen.nagasaki.jp": 1,
    "uonuma.niigata.jp": 1,
    "uozu.toyama.jp": 1,
    "upow.gov.pl": 1,
    "uppo.gov.pl": 1,
    "urakawa.hokkaido.jp": 1,
    "urasoe.okinawa.jp": 1,
    "urausu.hokkaido.jp": 1,
    "urawa.saitama.jp": 1,
    "urayasu.chiba.jp": 1,
    "urbino-pesaro.it": 1,
    "urbinopesaro.it": 1,
    "ureshino.mie.jp": 1,
    "uri.arpa": 1,
    "urn.arpa": 1,
    "uruma.okinawa.jp": 1,
    "uryu.hokkaido.jp": 1,
    "us-east-1.amazonaws.com": 1,
    "us-gov-west-1.compute.amazonaws.com": 1,
    "us-west-1.compute.amazonaws.com": 1,
    "us-west-2.compute.amazonaws.com": 1,
    "us.com": 1,
    "us.eu.org": 1,
    "us.gov.pl": 1,
    "us.na": 1,
    "us.org": 1,
    "usa.museum": 1,
    "usa.oita.jp": 1,
    "usantiques.museum": 1,
    "usarts.museum": 1,
    "uscountryestate.museum": 1,
    "usculture.museum": 1,
    "usdecorativearts.museum": 1,
    "usgarden.museum": 1,
    "ushiku.ibaraki.jp": 1,
    "ushistory.museum": 1,
    "ushuaia.museum": 1,
    "uslivinghistory.museum": 1,
    "ustka.pl": 1,
    "usui.fukuoka.jp": 1,
    "usuki.oita.jp": 1,
    "ut.us": 1,
    "utah.museum": 1,
    "utashinai.hokkaido.jp": 1,
    "utazas.hu": 1,
    "utazu.kagawa.jp": 1,
    "uto.kumamoto.jp": 1,
    "utsira.no": 1,
    "utsunomiya.tochigi.jp": 1,
    "uvic.museum": 1,
    "uw.gov.pl": 1,
    "uwajima.ehime.jp": 1,
    "uy.com": 1,
    "uz.ua": 1,
    "uzhgorod.ua": 1,
    "uzs.gov.pl": 1,
    "v.bg": 1,
    "va.it": 1,
    "va.no": 1,
    "va.us": 1,
    "vaapste.no": 1,
    "vadso.no": 1,
    "vads\u00f8.no": 1,
    "vaga.no": 1,
    "vagan.no": 1,
    "vagsoy.no": 1,
    "vaksdal.no": 1,
    "val-d-aosta.it": 1,
    "val-daosta.it": 1,
    "vald-aosta.it": 1,
    "valdaosta.it": 1,
    "valer.hedmark.no": 1,
    "valer.ostfold.no": 1,
    "valle-aosta.it": 1,
    "valle-d-aosta.it": 1,
    "valle-daosta.it": 1,
    "valle.no": 1,
    "valleaosta.it": 1,
    "valled-aosta.it": 1,
    "valledaosta.it": 1,
    "vallee-aoste.it": 1,
    "valleeaoste.it": 1,
    "valley.museum": 1,
    "vang.no": 1,
    "vantaa.museum": 1,
    "vanylven.no": 1,
    "vao.it": 1,
    "vardo.no": 1,
    "vard\u00f8.no": 1,
    "varese.it": 1,
    "varggat.no": 1,
    "varoy.no": 1,
    "vb.it": 1,
    "vc.it": 1,
    "vda.it": 1,
    "vdonsk.ru": 1,
    "ve.it": 1,
    "vefsn.no": 1,
    "vega.no": 1,
    "vegarshei.no": 1,
    "veg\u00e5rshei.no": 1,
    "ven.it": 1,
    "veneto.it": 1,
    "venezia.it": 1,
    "venice.it": 1,
    "vennesla.no": 1,
    "verbania.it": 1,
    "vercelli.it": 1,
    "verdal.no": 1,
    "verona.it": 1,
    "verran.no": 1,
    "versailles.museum": 1,
    "vestby.no": 1,
    "vestnes.no": 1,
    "vestre-slidre.no": 1,
    "vestre-toten.no": 1,
    "vestvagoy.no": 1,
    "vestv\u00e5g\u00f8y.no": 1,
    "vet.br": 1,
    "veterinaire.fr": 1,
    "veterinaire.km": 1,
    "vevelstad.no": 1,
    "vf.no": 1,
    "vgs.no": 1,
    "vi.it": 1,
    "vi.us": 1,
    "vibo-valentia.it": 1,
    "vibovalentia.it": 1,
    "vic.au": 1,
    "vic.edu.au": 1,
    "vic.gov.au": 1,
    "vicenza.it": 1,
    "video.hu": 1,
    "vik.no": 1,
    "viking.museum": 1,
    "vikna.no": 1,
    "village.museum": 1,
    "vindafjord.no": 1,
    "vinnica.ua": 1,
    "vinnytsia.ua": 1,
    "vipsinaapp.com": 1,
    "virginia.museum": 1,
    "virtual.museum": 1,
    "virtuel.museum": 1,
    "viterbo.it": 1,
    "vlaanderen.museum": 1,
    "vladikavkaz.ru": 1,
    "vladikavkaz.su": 1,
    "vladimir.ru": 1,
    "vladimir.su": 1,
    "vladivostok.ru": 1,
    "vlog.br": 1,
    "vn.ua": 1,
    "voagat.no": 1,
    "volda.no": 1,
    "volgograd.ru": 1,
    "volkenkunde.museum": 1,
    "vologda.ru": 1,
    "vologda.su": 1,
    "volyn.ua": 1,
    "voronezh.ru": 1,
    "voss.no": 1,
    "vossevangen.no": 1,
    "vr.it": 1,
    "vrn.ru": 1,
    "vs.it": 1,
    "vt.it": 1,
    "vt.us": 1,
    "vv.it": 1,
    "vyatka.ru": 1,
    "v\u00e1rgg\u00e1t.no": 1,
    "v\u00e5gan.no": 1,
    "v\u00e5gs\u00f8y.no": 1,
    "v\u00e5g\u00e5.no": 1,
    "v\u00e5ler.hedmark.no": 1,
    "v\u00e5ler.\u00f8stfold.no": 1,
    "v\u00e6r\u00f8y.no": 1,
    "w.bg": 1,
    "w.se": 1,
    "wa.au": 1,
    "wa.edu.au": 1,
    "wa.gov.au": 1,
    "wa.us": 1,
    "wada.nagano.jp": 1,
    "wajiki.tokushima.jp": 1,
    "wajima.ishikawa.jp": 1,
    "wakasa.fukui.jp": 1,
    "wakasa.tottori.jp": 1,
    "wakayama.jp": 1,
    "wakayama.wakayama.jp": 1,
    "wake.okayama.jp": 1,
    "wakkanai.hokkaido.jp": 1,
    "wakuya.miyagi.jp": 1,
    "walbrzych.pl": 1,
    "wales.museum": 1,
    "wallonie.museum": 1,
    "wanouchi.gifu.jp": 1,
    "war.museum": 1,
    "warabi.saitama.jp": 1,
    "warmia.pl": 1,
    "warszawa.pl": 1,
    "washingtondc.museum": 1,
    "wassamu.hokkaido.jp": 1,
    "watarai.mie.jp": 1,
    "watari.miyagi.jp": 1,
    "watch-and-clock.museum": 1,
    "watchandclock.museum": 1,
    "waw.pl": 1,
    "wazuka.kyoto.jp": 1,
    "web.co": 1,
    "web.do": 1,
    "web.id": 1,
    "web.lk": 1,
    "web.nf": 1,
    "web.ni": 1,
    "web.pk": 1,
    "web.tj": 1,
    "web.tr": 1,
    "web.ve": 1,
    "web.za": 1,
    "webhop.biz": 1,
    "webhop.info": 1,
    "webhop.net": 1,
    "webhop.org": 1,
    "wegrow.pl": 1,
    "western.museum": 1,
    "westfalen.museum": 1,
    "whaling.museum": 1,
    "wi.us": 1,
    "wielun.pl": 1,
    "wif.gov.pl": 1,
    "wiih.gov.pl": 1,
    "wiki.br": 1,
    "wildlife.museum": 1,
    "williamsburg.museum": 1,
    "winb.gov.pl": 1,
    "windmill.museum": 1,
    "wios.gov.pl": 1,
    "witd.gov.pl": 1,
    "withgoogle.com": 1,
    "withyoutube.com": 1,
    "wiw.gov.pl": 1,
    "wlocl.pl": 1,
    "wloclawek.pl": 1,
    "wodzislaw.pl": 1,
    "wolomin.pl": 1,
    "workinggroup.aero": 1,
    "works.aero": 1,
    "workshop.museum": 1,
    "worse-than.tv": 1,
    "writesthisblog.com": 1,
    "wroc.pl": 1,
    "wroclaw.pl": 1,
    "ws.na": 1,
    "wsa.gov.pl": 1,
    "wskr.gov.pl": 1,
    "wuoz.gov.pl": 1,
    "wv.us": 1,
    "www.ck": 0,
    "www.ro": 1,
    "wy.us": 1,
    "wzmiuw.gov.pl": 1,
    "x.bg": 1,
    "x.se": 1,
    "xen.prgmr.com": 1,
    "xenapponazure.com": 1,
    "xj.cn": 1,
    "xz.cn": 1,
    "y.bg": 1,
    "y.se": 1,
    "yabu.hyogo.jp": 1,
    "yabuki.fukushima.jp": 1,
    "yachimata.chiba.jp": 1,
    "yachiyo.chiba.jp": 1,
    "yachiyo.ibaraki.jp": 1,
    "yaese.okinawa.jp": 1,
    "yahaba.iwate.jp": 1,
    "yahiko.niigata.jp": 1,
    "yaita.tochigi.jp": 1,
    "yaizu.shizuoka.jp": 1,
    "yakage.okayama.jp": 1,
    "yakumo.hokkaido.jp": 1,
    "yakumo.shimane.jp": 1,
    "yakutia.ru": 1,
    "yalta.ua": 1,
    "yamada.fukuoka.jp": 1,
    "yamada.iwate.jp": 1,
    "yamada.toyama.jp": 1,
    "yamaga.kumamoto.jp": 1,
    "yamagata.gifu.jp": 1,
    "yamagata.ibaraki.jp": 1,
    "yamagata.jp": 1,
    "yamagata.nagano.jp": 1,
    "yamagata.yamagata.jp": 1,
    "yamaguchi.jp": 1,
    "yamakita.kanagawa.jp": 1,
    "yamal.ru": 1,
    "yamamoto.miyagi.jp": 1,
    "yamanakako.yamanashi.jp": 1,
    "yamanashi.jp": 1,
    "yamanashi.yamanashi.jp": 1,
    "yamanobe.yamagata.jp": 1,
    "yamanouchi.nagano.jp": 1,
    "yamashina.kyoto.jp": 1,
    "yamato.fukushima.jp": 1,
    "yamato.kanagawa.jp": 1,
    "yamato.kumamoto.jp": 1,
    "yamatokoriyama.nara.jp": 1,
    "yamatotakada.nara.jp": 1,
    "yamatsuri.fukushima.jp": 1,
    "yamazoe.nara.jp": 1,
    "yame.fukuoka.jp": 1,
    "yanagawa.fukuoka.jp": 1,
    "yanaizu.fukushima.jp": 1,
    "yao.osaka.jp": 1,
    "yaotsu.gifu.jp": 1,
    "yaroslavl.ru": 1,
    "yasaka.nagano.jp": 1,
    "yashio.saitama.jp": 1,
    "yashiro.hyogo.jp": 1,
    "yasu.shiga.jp": 1,
    "yasuda.kochi.jp": 1,
    "yasugi.shimane.jp": 1,
    "yasuoka.nagano.jp": 1,
    "yatomi.aichi.jp": 1,
    "yatsuka.shimane.jp": 1,
    "yatsushiro.kumamoto.jp": 1,
    "yawara.ibaraki.jp": 1,
    "yawata.kyoto.jp": 1,
    "yawatahama.ehime.jp": 1,
    "yazu.tottori.jp": 1,
    "ye": 2,
    "yekaterinburg.ru": 1,
    "yk.ca": 1,
    "yn.cn": 1,
    "yoichi.hokkaido.jp": 1,
    "yoita.niigata.jp": 1,
    "yoka.hyogo.jp": 1,
    "yokaichiba.chiba.jp": 1,
    "yokawa.hyogo.jp": 1,
    "yokkaichi.mie.jp": 1,
    "yokohama.jp": 2,
    "yokoshibahikari.chiba.jp": 1,
    "yokosuka.kanagawa.jp": 1,
    "yokote.akita.jp": 1,
    "yokoze.saitama.jp": 1,
    "yolasite.com": 1,
    "yomitan.okinawa.jp": 1,
    "yonabaru.okinawa.jp": 1,
    "yonago.tottori.jp": 1,
    "yonaguni.okinawa.jp": 1,
    "yonezawa.yamagata.jp": 1,
    "yono.saitama.jp": 1,
    "yorii.saitama.jp": 1,
    "york.museum": 1,
    "yorkshire.museum": 1,
    "yoro.gifu.jp": 1,
    "yosemite.museum": 1,
    "yoshida.saitama.jp": 1,
    "yoshida.shizuoka.jp": 1,
    "yoshikawa.saitama.jp": 1,
    "yoshimi.saitama.jp": 1,
    "yoshino.nara.jp": 1,
    "yoshinogari.saga.jp": 1,
    "yoshioka.gunma.jp": 1,
    "yotsukaido.chiba.jp": 1,
    "youth.museum": 1,
    "yuasa.wakayama.jp": 1,
    "yufu.oita.jp": 1,
    "yugawa.fukushima.jp": 1,
    "yugawara.kanagawa.jp": 1,
    "yuki.ibaraki.jp": 1,
    "yukuhashi.fukuoka.jp": 1,
    "yura.wakayama.jp": 1,
    "yurihonjo.akita.jp": 1,
    "yusuhara.kochi.jp": 1,
    "yusui.kagoshima.jp": 1,
    "yuu.yamaguchi.jp": 1,
    "yuza.yamagata.jp": 1,
    "yuzawa.niigata.jp": 1,
    "yuzhno-sakhalinsk.ru": 1,
    "z-1.compute-1.amazonaws.com": 1,
    "z-2.compute-1.amazonaws.com": 1,
    "z.bg": 1,
    "z.se": 1,
    "za.bz": 1,
    "za.com": 1,
    "za.net": 1,
    "za.org": 1,
    "zachpomor.pl": 1,
    "zagan.pl": 1,
    "zakopane.pl": 1,
    "zama.kanagawa.jp": 1,
    "zamami.okinawa.jp": 1,
    "zao.miyagi.jp": 1,
    "zaporizhzhe.ua": 1,
    "zaporizhzhia.ua": 1,
    "zarow.pl": 1,
    "zentsuji.kagawa.jp": 1,
    "zgora.pl": 1,
    "zgorzelec.pl": 1,
    "zgrad.ru": 1,
    "zhitomir.ua": 1,
    "zhytomyr.ua": 1,
    "zj.cn": 1,
    "zlg.br": 1,
    "zm": 2,
    "zoological.museum": 1,
    "zoology.museum": 1,
    "zp.gov.pl": 1,
    "zp.ua": 1,
    "zt.ua": 1,
    "zushi.kanagawa.jp": 1,
    "zw": 2,
    "\u00e1k\u014boluokta.no": 1,
    "\u00e1laheadju.no": 1,
    "\u00e1lt\u00e1.no": 1,
    "\u00e5fjord.no": 1,
    "\u00e5krehamn.no": 1,
    "\u00e5l.no": 1,
    "\u00e5lesund.no": 1,
    "\u00e5lg\u00e5rd.no": 1,
    "\u00e5mli.no": 1,
    "\u00e5mot.no": 1,
    "\u00e5rdal.no": 1,
    "\u00e5s.no": 1,
    "\u00e5seral.no": 1,
    "\u00e5snes.no": 1,
    "\u00f8ksnes.no": 1,
    "\u00f8rland.no": 1,
    "\u00f8rskog.no": 1,
    "\u00f8rsta.no": 1,
    "\u00f8stre-toten.no": 1,
    "\u00f8vre-eiker.no": 1,
    "\u00f8yer.no": 1,
    "\u00f8ygarden.no": 1,
    "\u00f8ystre-slidre.no": 1,
    "\u010d\u00e1hcesuolo.no": 1,
    "\u0430\u043a.\u0441\u0440\u0431": 1,
    "\u0438\u043a\u043e\u043c.museum": 1,
    "\u043e\u0431\u0440.\u0441\u0440\u0431": 1,
    "\u043e\u0434.\u0441\u0440\u0431": 1,
    "\u043e\u0440\u0433.\u0441\u0440\u0431": 1,
    "\u043f\u0440.\u0441\u0440\u0431": 1,
    "\u0443\u043f\u0440.\u0441\u0440\u0431": 1,
    "\u05d9\u05e8\u05d5\u05e9\u05dc\u05d9\u05dd.museum": 1,
    "\u0627\u064a\u0631\u0627\u0646.ir": 1,
    "\u0627\u06cc\u0631\u0627\u0646.ir": 1,
    "\u4e09\u91cd.jp": 1,
    "\u4e2a\u4eba.hk": 1,
    "\u4eac\u90fd.jp": 1,
    "\u4f50\u8cc0.jp": 1,
    "\u500b\u4eba.hk": 1,
    "\u516c\u53f8.cn": 1,
    "\u516c\u53f8.hk": 1,
    "\u5175\u5eab.jp": 1,
    "\u5317\u6d77\u9053.jp": 1,
    "\u5343\u8449.jp": 1,
    "\u548c\u6b4c\u5c71.jp": 1,
    "\u5546\u696d.tw": 1,
    "\u57fc\u7389.jp": 1,
    "\u5927\u5206.jp": 1,
    "\u5927\u962a.jp": 1,
    "\u5948\u826f.jp": 1,
    "\u5bae\u57ce.jp": 1,
    "\u5bae\u5d0e.jp": 1,
    "\u5bcc\u5c71.jp": 1,
    "\u5c71\u53e3.jp": 1,
    "\u5c71\u5f62.jp": 1,
    "\u5c71\u68a8.jp": 1,
    "\u5c90\u961c.jp": 1,
    "\u5ca1\u5c71.jp": 1,
    "\u5ca9\u624b.jp": 1,
    "\u5cf6\u6839.jp": 1,
    "\u5e83\u5cf6.jp": 1,
    "\u5fb3\u5cf6.jp": 1,
    "\u611b\u5a9b.jp": 1,
    "\u611b\u77e5.jp": 1,
    "\u653f\u5e9c.hk": 1,
    "\u654e\u80b2.hk": 1,
    "\u6559\u80b2.hk": 1,
    "\u65b0\u6f5f.jp": 1,
    "\u6771\u4eac.jp": 1,
    "\u6803\u6728.jp": 1,
    "\u6c96\u7e04.jp": 1,
    "\u6ecb\u8cc0.jp": 1,
    "\u718a\u672c.jp": 1,
    "\u77f3\u5ddd.jp": 1,
    "\u795e\u5948\u5ddd.jp": 1,
    "\u798f\u4e95.jp": 1,
    "\u798f\u5ca1.jp": 1,
    "\u798f\u5cf6.jp": 1,
    "\u79cb\u7530.jp": 1,
    "\u7b87\u4eba.hk": 1,
    "\u7d44\u7e54.hk": 1,
    "\u7d44\u7e54.tw": 1,
    "\u7d44\u7ec7.hk": 1,
    "\u7db2\u7d61.cn": 1,
    "\u7db2\u7d61.hk": 1,
    "\u7db2\u7edc.hk": 1,
    "\u7db2\u8def.tw": 1,
    "\u7ec4\u7e54.hk": 1,
    "\u7ec4\u7ec7.hk": 1,
    "\u7f51\u7d61.hk": 1,
    "\u7f51\u7edc.cn": 1,
    "\u7f51\u7edc.hk": 1,
    "\u7fa4\u99ac.jp": 1,
    "\u8328\u57ce.jp": 1,
    "\u9577\u5d0e.jp": 1,
    "\u9577\u91ce.jp": 1,
    "\u9752\u68ee.jp": 1,
    "\u9759\u5ca1.jp": 1,
    "\u9999\u5ddd.jp": 1,
    "\u9ad8\u77e5.jp": 1,
    "\u9ce5\u53d6.jp": 1,
    "\u9e7f\u5150\u5cf6.jp": 1
};

/**
 *
 *  Secure Hash Algorithm (SHA1)
 *  http://www.webtoolkit.info/
 *
 **/

function SHA1(msg) {

    function rotate_left(n,s) {
        var t4 = ( n<<s ) | (n>>>(32-s));
        return t4;
    };

    function lsb_hex(val) {
        var str="";
        var i;
        var vh;
        var vl;

        for( i=0; i<=6; i+=2 ) {
            vh = (val>>>(i*4+4))&0x0f;
            vl = (val>>>(i*4))&0x0f;
            str += vh.toString(16) + vl.toString(16);
        }
        return str;
    };

    function cvt_hex(val) {
        var str="";
        var i;
        var v;

        for( i=7; i>=0; i-- ) {
            v = (val>>>(i*4))&0x0f;
            str += v.toString(16);
        }
        return str;
    };


    function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    };

    var blockstart;
    var i, j;
    var W = new Array(80);
    var H0 = 0x67452301;
    var H1 = 0xEFCDAB89;
    var H2 = 0x98BADCFE;
    var H3 = 0x10325476;
    var H4 = 0xC3D2E1F0;
    var A, B, C, D, E;
    var temp;

    msg = Utf8Encode(msg);

    var msg_len = msg.length;

    var word_array = new Array();
    for( i=0; i<msg_len-3; i+=4 ) {
        j = msg.charCodeAt(i)<<24 | msg.charCodeAt(i+1)<<16 |
        msg.charCodeAt(i+2)<<8 | msg.charCodeAt(i+3);
        word_array.push( j );
    }

    switch( msg_len % 4 ) {
        case 0:
            i = 0x080000000;
        break;
        case 1:
            i = msg.charCodeAt(msg_len-1)<<24 | 0x0800000;
        break;

        case 2:
            i = msg.charCodeAt(msg_len-2)<<24 | msg.charCodeAt(msg_len-1)<<16 | 0x08000;
        break;

        case 3:
            i = msg.charCodeAt(msg_len-3)<<24 | msg.charCodeAt(msg_len-2)<<16 | msg.charCodeAt(msg_len-1)<<8	| 0x80;
        break;
    }

    word_array.push( i );

    while( (word_array.length % 16) != 14 ) word_array.push( 0 );

    word_array.push( msg_len>>>29 );
    word_array.push( (msg_len<<3)&0x0ffffffff );


    for ( blockstart=0; blockstart<word_array.length; blockstart+=16 ) {

        for( i=0; i<16; i++ ) W[i] = word_array[blockstart+i];
        for( i=16; i<=79; i++ ) W[i] = rotate_left(W[i-3] ^ W[i-8] ^ W[i-14] ^ W[i-16], 1);

        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;

        for( i= 0; i<=19; i++ ) {
            temp = (rotate_left(A,5) + ((B&C) | (~B&D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }

        for( i=20; i<=39; i++ ) {
            temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }

        for( i=40; i<=59; i++ ) {
            temp = (rotate_left(A,5) + ((B&C) | (B&D) | (C&D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }

        for( i=60; i<=79; i++ ) {
            temp = (rotate_left(A,5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B,30);
            B = A;
            A = temp;
        }

        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;

    }

    var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);

    return temp.toLowerCase();
}

/*
 * Copyright (c) 2003-2005  Tom Wu
 * All Rights Reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY
 * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
 *
 * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
 * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
 * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
 * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
 * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 *
 * In addition, the following condition applies:
 *
 * All redistributions must retain an intact copy of this copyright notice
 * and disclaimer.
 */

// Basic JavaScript BN library - subset useful for RSA encryption.

// Bits per digit
var dbits;

// JavaScript engine analysis
var canary = 0xdeadbeefcafe;
var j_lm = ((canary&0xffffff)==0xefcafe);

// (public) Constructor
function BigInteger(a,b,c) {
  if(a != null)
    if("number" == typeof a) this.fromNumber(a,b,c);
    else if(b == null && "string" != typeof a) this.fromString(a,256);
    else this.fromString(a,b);
}

// return new, unset BigInteger
function nbi() { return new BigInteger(null); }

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i,x,w,j,c,n) {
  while(--n >= 0) {
    var v = x*this[i++]+w[j]+c;
    c = Math.floor(v/0x4000000);
    w[j++] = v&0x3ffffff;
  }
  return c;
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i,x,w,j,c,n) {
  var xl = x&0x7fff, xh = x>>15;
  while(--n >= 0) {
    var l = this[i]&0x7fff;
    var h = this[i++]>>15;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
    c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
    w[j++] = l&0x3fffffff;
  }
  return c;
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i,x,w,j,c,n) {
  var xl = x&0x3fff, xh = x>>14;
  while(--n >= 0) {
    var l = this[i]&0x3fff;
    var h = this[i++]>>14;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x3fff)<<14)+w[j]+c;
    c = (l>>28)+(m>>14)+xh*h;
    w[j++] = l&0xfffffff;
  }
  return c;
}
if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
  BigInteger.prototype.am = am2;
  dbits = 30;
}
else if(j_lm && (navigator.appName != "Netscape")) {
  BigInteger.prototype.am = am1;
  dbits = 26;
}
else { // Mozilla/Netscape seems to prefer am3
  BigInteger.prototype.am = am3;
  dbits = 28;
}

BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = ((1<<dbits)-1);
BigInteger.prototype.DV = (1<<dbits);

var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2,BI_FP);
BigInteger.prototype.F1 = BI_FP-dbits;
BigInteger.prototype.F2 = 2*dbits-BI_FP;

// Digit conversions
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr,vv;
rr = "0".charCodeAt(0);
for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

function int2char(n) { return BI_RM.charAt(n); }
function intAt(s,i) {
  var c = BI_RC[s.charCodeAt(i)];
  return (c==null)?-1:c;
}

// (protected) copy this to r
function bnpCopyTo(r) {
  for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
  r.t = this.t;
  r.s = this.s;
}

// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x) {
  this.t = 1;
  this.s = (x<0)?-1:0;
  if(x > 0) this[0] = x;
  else if(x < -1) this[0] = x+DV;
  else this.t = 0;
}

// return bigint initialized to value
function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

// (protected) set from string and radix
function bnpFromString(s,b) {
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 256) k = 8; // byte array
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else { this.fromRadix(s,b); return; }
  this.t = 0;
  this.s = 0;
  var i = s.length, mi = false, sh = 0;
  while(--i >= 0) {
    var x = (k==8)?s.charCodeAt(i)&0xff:intAt(s,i);   /** MODIFIED **/
    if(x < 0) {
      if(s.charAt(i) == "-") mi = true;
      continue;
    }
    mi = false;
    if(sh == 0)
      this[this.t++] = x;
    else if(sh+k > this.DB) {
      this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
      this[this.t++] = (x>>(this.DB-sh));
    }
    else
      this[this.t-1] |= x<<sh;
    sh += k;
    if(sh >= this.DB) sh -= this.DB;
  }
  if(k == 8 && (s[0]&0x80) != 0) {
    this.s = -1;
    if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
  }
  this.clamp();
  if(mi) BigInteger.ZERO.subTo(this,this);
}

// (protected) clamp off excess high words
function bnpClamp() {
  var c = this.s&this.DM;
  while(this.t > 0 && this[this.t-1] == c) --this.t;
}

// (public) return string representation in given radix
function bnToString(b) {
  if(this.s < 0) return "-"+this.negate().toString(b);
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 256) k = 8; // byte array      /** MODIFIED **/
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else return this.toRadix(b);
  var km = (1<<k)-1, d, m = false, r = "", i = this.t;
  var p = this.DB-(i*this.DB)%k;
  if(i-- > 0) {
    if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = (k==8)?String.fromCharCode(d):int2char(d); }   /** MODIFIED **/
    while(i >= 0) {
      if(p < k) {
        d = (this[i]&((1<<p)-1))<<(k-p);
        d |= this[--i]>>(p+=this.DB-k);
      }
      else {
        d = (this[i]>>(p-=k))&km;
        if(p <= 0) { p += this.DB; --i; }
      }
      if(d > 0) m = true;
      if(m) r += (k==8)?String.fromCharCode(d):int2char(d);    /** MODIFIED **/
    }
  }
  return m?r:"0";
}

// (public) -this
function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

// (public) |this|
function bnAbs() { return (this.s<0)?this.negate():this; }

// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a) {
  var r = this.s-a.s;
  if(r != 0) return r;
  var i = this.t;
  r = i-a.t;
  if(r != 0) return r;
  while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
  return 0;
}

// returns bit length of the integer x
function nbits(x) {
  var r = 1, t;
  if((t=x>>>16) != 0) { x = t; r += 16; }
  if((t=x>>8) != 0) { x = t; r += 8; }
  if((t=x>>4) != 0) { x = t; r += 4; }
  if((t=x>>2) != 0) { x = t; r += 2; }
  if((t=x>>1) != 0) { x = t; r += 1; }
  return r;
}

// (public) return the number of bits in "this"
function bnBitLength() {
  if(this.t <= 0) return 0;
  return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
}

// (protected) r = this << n*DB
function bnpDLShiftTo(n,r) {
  var i;
  for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
  for(i = n-1; i >= 0; --i) r[i] = 0;
  r.t = this.t+n;
  r.s = this.s;
}

// (protected) r = this >> n*DB
function bnpDRShiftTo(n,r) {
  for(var i = n; i < this.t; ++i) r[i-n] = this[i];
  r.t = Math.max(this.t-n,0);
  r.s = this.s;
}

// (protected) r = this << n
function bnpLShiftTo(n,r) {
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<cbs)-1;
  var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
  for(i = this.t-1; i >= 0; --i) {
    r[i+ds+1] = (this[i]>>cbs)|c;
    c = (this[i]&bm)<<bs;
  }
  for(i = ds-1; i >= 0; --i) r[i] = 0;
  r[ds] = c;
  r.t = this.t+ds+1;
  r.s = this.s;
  r.clamp();
}

// (protected) r = this >> n
function bnpRShiftTo(n,r) {
  r.s = this.s;
  var ds = Math.floor(n/this.DB);
  if(ds >= this.t) { r.t = 0; return; }
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<bs)-1;
  r[0] = this[ds]>>bs;
  for(var i = ds+1; i < this.t; ++i) {
    r[i-ds-1] |= (this[i]&bm)<<cbs;
    r[i-ds] = this[i]>>bs;
  }
  if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
  r.t = this.t-ds;
  r.clamp();
}

// (protected) r = this - a
function bnpSubTo(a,r) {
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this[i]-a[i];
    r[i++] = c&this.DM;
    c >>= this.DB;
  }
  if(a.t < this.t) {
    c -= a.s;
    while(i < this.t) {
      c += this[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += this.s;
  }
  else {
    c += this.s;
    while(i < a.t) {
      c -= a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    c -= a.s;
  }
  r.s = (c<0)?-1:0;
  if(c < -1) r[i++] = this.DV+c;
  else if(c > 0) r[i++] = c;
  r.t = i;
  r.clamp();
}

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
function bnpMultiplyTo(a,r) {
  var x = this.abs(), y = a.abs();
  var i = x.t;
  r.t = i+y.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
  r.s = 0;
  r.clamp();
  if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
}

// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r) {
  var x = this.abs();
  var i = r.t = 2*x.t;
  while(--i >= 0) r[i] = 0;
  for(i = 0; i < x.t-1; ++i) {
    var c = x.am(i,x[i],r,2*i,0,1);
    if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
      r[i+x.t] -= x.DV;
      r[i+x.t+1] = 1;
    }
  }
  if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
  r.s = 0;
  r.clamp();
}

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m,q,r) {
  var pm = m.abs();
  if(pm.t <= 0) return;
  var pt = this.abs();
  if(pt.t < pm.t) {
    if(q != null) q.fromInt(0);
    if(r != null) this.copyTo(r);
    return;
  }
  if(r == null) r = nbi();
  var y = nbi(), ts = this.s, ms = m.s;
  var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
  if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
  else { pm.copyTo(y); pt.copyTo(r); }
  var ys = y.t;
  var y0 = y[ys-1];
  if(y0 == 0) return;
  var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
  var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
  var i = r.t, j = i-ys, t = (q==null)?nbi():q;
  y.dlShiftTo(j,t);
  if(r.compareTo(t) >= 0) {
    r[r.t++] = 1;
    r.subTo(t,r);
  }
  BigInteger.ONE.dlShiftTo(ys,t);
  t.subTo(y,y);	// "negative" y so we can replace sub with am later
  while(y.t < ys) y[y.t++] = 0;
  while(--j >= 0) {
    // Estimate quotient digit
    var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
    if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
      y.dlShiftTo(j,t);
      r.subTo(t,r);
      while(r[i] < --qd) r.subTo(t,r);
    }
  }
  if(q != null) {
    r.drShiftTo(ys,q);
    if(ts != ms) BigInteger.ZERO.subTo(q,q);
  }
  r.t = ys;
  r.clamp();
  if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
  if(ts < 0) BigInteger.ZERO.subTo(r,r);
}

// (public) this mod a
function bnMod(a) {
  var r = nbi();
  this.abs().divRemTo(a,null,r);
  if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
  return r;
}

// Modular reduction using "classic" algorithm
function Classic(m) { this.m = m; }
function cConvert(x) {
  if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
  else return x;
}
function cRevert(x) { return x; }
function cReduce(x) { x.divRemTo(this.m,null,x); }
function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
function bnpInvDigit() {
  if(this.t < 1) return 0;
  var x = this[0];
  if((x&1) == 0) return 0;
  var y = x&3;		// y == 1/x mod 2^2
  y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
  y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
  y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
  y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y>0)?this.DV-y:-y;
}

// Montgomery reduction
function Montgomery(m) {
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp&0x7fff;
  this.mph = this.mp>>15;
  this.um = (1<<(m.DB-15))-1;
  this.mt2 = 2*m.t;
}

// xR mod m
function montConvert(x) {
  var r = nbi();
  x.abs().dlShiftTo(this.m.t,r);
  r.divRemTo(this.m,null,r);
  if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
  return r;
}

// x/R mod m
function montRevert(x) {
  var r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
}

// x = x/R mod m (HAC 14.32)
function montReduce(x) {
  while(x.t <= this.mt2)	// pad x so am has enough room later
    x[x.t++] = 0;
  for(var i = 0; i < this.m.t; ++i) {
    // faster way of calculating u0 = x[i]*mp mod DV
    var j = x[i]&0x7fff;
    var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
    // use am to combine the multiply-shift-add into one call
    j = i+this.m.t;
    x[j] += this.m.am(0,u0,x,i,0,this.m.t);
    // propagate carry
    while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
  }
  x.clamp();
  x.drShiftTo(this.m.t,x);
  if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = "x^2/R mod m"; x != r
function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = "xy/R mod m"; x,y != r
function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;

// (protected) true iff this is even
function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
function bnpExp(e,z) {
  if(e > 0xffffffff || e < 1) return BigInteger.ONE;
  var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
  g.copyTo(r);
  while(--i >= 0) {
    z.sqrTo(r,r2);
    if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
    else { var t = r; r = r2; r2 = t; }
  }
  return z.revert(r);
}

// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e,m) {
  var z;
  if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
  return this.exp(e,z);
}

// protected
BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.isEven = bnpIsEven;
BigInteger.prototype.exp = bnpExp;

// public
BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.modPowInt = bnModPowInt;

// "constants"
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);

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


/**
 * This is a specialized RSA library meant only to verify SHA1-based signatures.
 * It requires jsbn.js and sha1.js to work.
 */

(function(globalObj)
{
  // Define ASN.1 templates for the data structures used
  function seq()
  {
    return {type: 0x30, children: Array.prototype.slice.call(arguments)};
  }
  function obj(id)
  {
    return {type: 0x06, content: id};
  }
  function bitStr(contents)
  {
    return {type: 0x03, encapsulates: contents};
  }
  function intResult(id)
  {
    return {type: 0x02, out: id};
  }
  function octetResult(id)
  {
    return {type: 0x04, out: id};
  }

  // See http://www.cryptopp.com/wiki/Keys_and_Formats#RSA_PublicKey
  // 2A 86 48 86 F7 0D 01 01 01 means 1.2.840.113549.1.1.1
  var publicKeyTemplate = seq(seq(obj("\x2A\x86\x48\x86\xF7\x0D\x01\x01\x01"), {}), bitStr(seq(intResult("n"), intResult("e"))));

  // See http://tools.ietf.org/html/rfc3447#section-9.2 step 2
  // 2B 0E 03 02 1A means 1.3.14.3.2.26
  var signatureTemplate = seq(seq(obj("\x2B\x0E\x03\x02\x1A"), {}), octetResult("sha1"));

  /**
   * Reads ASN.1 data matching the template passed in. This will throw an
   * exception if the data format doesn't match the template. On success an
   * object containing result properties is returned.
   *
   * See http://luca.ntop.org/Teaching/Appunti/asn1.html for info on the format.
   */
  function readASN1(data, templ)
  {
    var pos = 0;
    function next()
    {
      return data.charCodeAt(pos++);
    }

    function readLength()
    {
      var len = next();
      if (len & 0x80)
      {
        var cnt = len & 0x7F;
        if (cnt > 2 || cnt == 0)
          throw "Unsupported length";

        len = 0;
        for (var i = 0; i < cnt; i++)
          len += next() << (cnt - 1 - i) * 8;
        return len;
      }
      else
        return len;
    }

    function readNode(curTempl)
    {
      var type = next();
      var len = readLength();
      if ("type" in curTempl && curTempl.type != type)
        throw "Unexpected type";
      if ("content" in curTempl && curTempl.content != data.substr(pos, len))
        throw "Unexpected content";
      if ("out" in curTempl)
        out[curTempl.out] = new BigInteger(data.substr(pos, len), 256);
      if ("children" in curTempl)
      {
        var i, end;
        for (i = 0, end = pos + len; pos < end; i++)
        {
          if (i >= curTempl.children.length)
            throw "Too many children";
          readNode(curTempl.children[i]);
        }
        if (i < curTempl.children.length)
          throw "Too few children";
        if (pos > end)
          throw "Children too large";
      }
      else if ("encapsulates" in curTempl)
      {
        if (next() != 0)
          throw "Encapsulation expected";
        readNode(curTempl.encapsulates);
      }
      else
        pos += len;
    }

    var out = {};
    readNode(templ);
    if (pos != data.length)
      throw "Too much data";
    return out;
  }

  /**
   * Reads a BER-encoded RSA public key. On success returns an object with the
   * properties n and e (the components of the key), otherwise null.
   */
  function readPublicKey(key)
  {
    try
    {
      return readASN1(atob(key), publicKeyTemplate);
    }
    catch (e)
    {
      console.log("Invalid RSA public key: " + e);
      return null;
    }
  }

  /**
   * Checks whether the signature is valid for the given public key and data.
   */
  function verifySignature(key, signature, data)
  {
    var keyData = readPublicKey(key);
    if (!keyData)
      return false;

    // We need the exponent as regular number
    keyData.e = parseInt(keyData.e.toString(16), 16);

    // Decrypt signature data using RSA algorithm
    var sigInt = new BigInteger(atob(signature), 256);
    var digest = sigInt.modPowInt(keyData.e, keyData.n).toString(256);

    try
    {
      var pos = 0;
      function next()
      {
        return digest.charCodeAt(pos++);
      }

      // Skip padding, see http://tools.ietf.org/html/rfc3447#section-9.2 step 5
      if (next() != 1)
        throw "Wrong padding in signature digest";
      while (next() == 255) {}
      if (digest.charCodeAt(pos - 1) != 0)
        throw "Wrong padding in signature digest";

      // Rest is an ASN.1 structure, get the SHA1 hash from it and compare to
      // the real one
      var sha1 = readASN1(digest.substr(pos), signatureTemplate).sha1;
      var expected = new BigInteger(SHA1(data), 16);
      return (sha1.compareTo(expected) == 0);
    }
    catch (e)
    {
      console.log("Invalid encrypted signature: " + e);
      return false;
    }
  }

  // Export verifySignature function, everything else is private.
  globalObj.verifySignature = verifySignature;
})(this);
