// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == 'object' && typeof module == 'object') { // CommonJS
    mod(require('../../lib/codemirror'));
  } else if (typeof define == 'function' && define.amd) { // AMD
    define(['../../lib/codemirror'], mod);
  } else { // Plain browser env
    mod(CodeMirror);
  }
})(function(CodeMirror) {
  'use strict';

  CodeMirror.defineMode('http-headers', function() {

    function failRest(stream, state) {
      stream.skipToEnd();
      state.cur = failRest;
      return 'error';
    }

    function header(stream) {
      if (stream.sol() && !stream.eat(/[ \t]/)) {
        if (stream.match(/^.*?:/)) {
          return 'atom';
        } else {
          stream.skipToEnd();
          return 'error';
        }
      } else {
        stream.skipToEnd();
        return 'string';
      }
    }

    return {
      token: function(stream, state) {
        var cur = state.cur;
        if (!cur || cur !== header && stream.eatSpace()) {
          return null;
        }
        return cur(stream, state);
      },

      blankLine: function(state) {
        state.cur = failRest;
      },

      startState: function() {
        return {
          cur: header
        };
      }
    };
  });
  CodeMirror.defineMIME('message/http-headers', 'http-headers');
});

(function(mod) {
  if (typeof exports == 'object' && typeof module == 'object') { // CommonJS
    mod(require('../../lib/codemirror'));
  } else if (typeof define == 'function' && define.amd) { // AMD
    define(['../../lib/codemirror'], mod);
  } else { // Plain browser env
    mod(CodeMirror);
  }
})(function(CodeMirror) {
  'use strict';

  var Pos = CodeMirror.Pos;
  var accept = [
    '*/*',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'application/xml,application/xhtml+xml,text/html;q=0.9, text/plain;q=0.8,image/png,*/*;q=0.5',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'image/jpeg, application/x-ms-application, image/gif, application/xaml+xml, image/pjpeg, ' +
      'application/x-ms-xbap, application/x-shockwave-flash, application/msword, */*',
    'text/html, application/xml;q=0.9, application/xhtml+xml, image/png, image/webp, image/jpeg,' +
      ' image/gif, image/x-xbitmap, */*;q=0.1',
    'image/png,image/*;q=0.8,*/*;q=0.5',
    'audio/webm, audio/ogg, audio/wav, audio/*;q=0.9, application/ogg;q=0.7, video/*;q=0.6; ' +
      '*/*;q=0.5',
    'video/webm, video/ogg, video/*;q=0.9, application/ogg=0.7, audio/*;q=0.6; */*;q=0.5',
    'application/javascript, */*;q=0.8',
    'text/css,*/*;q=0.1',
    'text/html, application/xml;q=0.9, application/xhtml+xml, image/png, image/webp, image/jpeg' +
      ', image/gif, image/x-xbitmap, */*;q=0.1'
  ];
  var contentTypes = [
    'application/json',
    'application/xml',
    'application/atom+xml',
    'multipart-form-data',
    'application/x-www-form-urlencoded',
    'application/base64',
    'application/octet-stream',
    'text/plain',
    'text/css',
    'text/html',
    'application/javascript'
  ];
  var authorizationHeaders = ['Basic {base64 of user:password}','Bearer {OAuth2 bearer}'];
  var authorizationParams = {
    'base64 of user:password': {
      type: String,
      call: 'authorizationBasic'
    },
    'OAuth2 bearer': {
      type: String,
      call: 'authorizationGoogleOauth2'
    }
  };

  var headersStructure = [{
    key: 'Accept',
    values: accept
  }, {
    key: 'Accept-Charset',
    values: [
      'UTF-8',
      'UTF-16',
      'ISO-8859-1',
      'ISO-8859-1,utf-8;q=0.7,*;q=0.7']
  }, {
    key: 'Accept-Encoding',
    values: [
      'compress',
      'gzip',
      'deflate',
      'identity',
      'br',
      '*',
      'gzip, deflate, sdch']
  }, {
    key: 'Accept-Language',
    values: [
      'en-US',
      'cad',
      'en-gb;q=0.8, en;q=0.7'
    ]
  }, {
    key: 'Authorization',
    values: authorizationHeaders,
    params: authorizationParams
  }, {
    key: 'Access-Control-Request-Method',
    values: ['GET','POST','PUT','DELETE']
  }, {
    key: 'Access-Control-Request-Headers',
    values: ['{list-of-headers}'],
    params: {
      'list-of-headers': {
        type: String
      }
    }
  }, {
    key: 'Cache-Control',
    values: [
      'no-cache',
      'no-store',
      'max-age={seconds}',
      'max-stale={seconds}',
      'min-fresh={seconds}',
      'no-transform',
      'only-if-cached'
    ],
    params: {
      seconds: {
        type: Number
      }
    }
  }, {
    key: 'Connection',
    values: ['close', 'keep-alive']
  }, {
    key: 'Content-MD5',
    values: ['{md5-of-message}'],
    params: {
      'length-in-bytes': {
        type: String
      }
    }
  }, {
    key: 'Content-Length',
    values: ['{length-in-bytes}'],
    params: {
      'length-in-bytes': {
        type: Number
      }
    }
  }, {
    key: 'Content-Type',
    values: contentTypes /*,
    params: {
      '*': {
        type: String,
        call: 'contentType'
      }
    }*/
  }, {
    key: 'Cookie',
    values: [
      '{cookie name}={cookie value}',
      '{cookie name}={cookie value}; expires={insert GMT date here}; domain={domain.com}; ' +
        'path=/; secure'
    ],
    params: {
      '*': {
        type: String,
        call: 'cookie'
      }
    }
  }, {
    key: 'Date',
    values: [
      '{insert GMT date here}'
    ]
  }, {
    key: 'DNT',
    values: [0, 1]
  }, {
    key: 'Expect',
    values: [
      '200-OK',
      '100-continue'
    ]
  }, {
    key: 'From',
    values: ['user@domain.com']
  }, {
    key: 'Front-End-Https',
    values: ['on', 'off']
  }, {
    key: 'Host',
    values: [
      'www.domain.com',
      'www.domain.com:80'
    ]
  }, {
    key: 'If-Match',
    values: ['{insert entity tag}']
  }, {
    key: 'If-Modified-Since',
    values: ['{insert GMT date here}']
  }, {
    key: 'If-None-Match',
    values: ['{insert entity tag}']
  }, {
    key: 'If-Range',
    values: ['{insert entity tag}', '{insert GMT date here}']
  }, {
    key: 'If-Unmodified-Since',
    values: ['{insert GMT date here}']
  }, {
    key: 'Max-Forwards',
    values: ['{number of forwards}'],
    params: {
      'number of forwards': {
        type: Number
      }
    }
  }, {
    key: 'Origin',
    values: []
  }, {
    key: 'Pragma',
    values: ['no-cache']
  }, {
    key: 'Proxy-Authorization',
    values: authorizationHeaders,
    params: authorizationParams
  }, {
    key: 'Proxy-Connection',
    values: ['close', 'keep-alive']
  }, {
    key: 'Range',
    values: [
      'bytes={from bytes}-{to bytes}',
      'bytes=-{final bytes}'
    ]
  }, {
    key: 'Referer',
    values: ['{http://www.domain.com/}']
  }, {
    key: 'TE',
    values: [
      '{header name}',
      'trailers, deflate;q=0.5'
    ]
  }, {
    key: 'Upgrade',
    values: ['HTTP/2.0, SHTTP/1.3, IRC/6.9, RTA/x11']
  }, {
    key: 'User-Agent',
    values: [
      navigator.userAgent,
      'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:33.0) Gecko/20120101 Firefox/33.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10; rv:33.0) Gecko/20100101 Firefox/33.0',
      'Opera/9.80 (Windows NT 6.0) Presto/2.12.388 Version/12.14',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko)' +
        ' Version/7.0.3 Safari/7046A194A',
      'Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0; WOW64; Trident/4.0; SLCC1)',
      'Mozilla/5.0 (MSIE 10.0; Windows NT 6.1; Trident/5.0)',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gec' +
        'ko) Version/6.0 Mobile/10A5376e Safari/8536.25',
      'Mozilla/5.0 (iPad; CPU OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) ' +
        'Version/6.0 Mobile/10A5376e Safari/8536.25',
      'Mozilla/5.0 (Linux; Android 4.4.2; Nexus 4 Build/KOT49H) AppleWebKit/537.36 (KHTML, ' +
        'like Gecko) Chrome/34.0.1847.114 Mobile Safari/537.36',
      'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM;' +
        ' Touch; NOKIA; Lumia 920)'
    ]
  }, {
    key: 'Via',
    values: []
  }, {
    key: 'Warning',
    values: [
      '{code} {agent} {message} {date}'
    ],
    properties: {
      code: {
        type: Number
      },
      agent: {
        type: String
      },
      message: {
        type: String
      },
      date: {
        type: Date
      }
    }
  }, {
    key: 'X-ATT-DeviceId',
    values: []
  }, {
    key: 'X-Forwarded-For',
    values: []
  }, {
    key: 'X-Forwarded-Proto',
    values: ['http', 'https']
  }, {
    key: 'X-Requested-With',
    values: ['XMLHttpRequest']
  }, {
    key: 'X-Wap-Profile',
    values: []
  }];

  function getToken(editor, cur) {
    return editor.getTokenAt(cur);
  }
  /**
   * Get all keywords (headers names).
   * @param {Array} headersStructure List of possible headers
   * @return {Array} Array of founded header names.
   */
  var getKeywords = function(headersStructure) {
    var keywords = [];
    var clb = function(header, cm, data, completion) {
      cm.replaceRange(completion.text + ': ', data.from, data.to);
      CodeMirror.signal(cm, 'header-key-selected', completion.text);
    };
    for (var i = 0; i < headersStructure.length; i++) {
      keywords.push({
        text: headersStructure[i].key,
        hint: clb.bind(this, headersStructure[i])
      });
    }
    return keywords;
  };
  var getHeaderValuesFor = function(headersStructure, key) {
    var keywords = [];
    var clb = function(header, cm, data, completion) {
      cm.replaceRange(completion.text, data.from, data.to);
      CodeMirror.signal(cm, 'header-value-selected', completion.text);

      if (header.params && header.params['*'] && header.params['*'].call) {
        let fromChar = Math.min(data.from.ch, data.to.ch);
        let charTo = fromChar + completion.text.length;
        let line = data.from.line;
        cm.setSelection({
          line: line,
          ch: fromChar
        },{
          line: line,
          ch: charTo
        });
        CodeMirror.signal(cm, 'header-value-support', {
          type: header.params['*'],
          key: header.key,
          value: completion.text
        });
      } else {
        let match = completion.text.match(/\{(.*?)\}/);
        if (match) {
          if (header.params && (match[1] in header.params)) {
            let fromChar = Math.min(data.from.ch, data.to.ch);
            let line = data.from.line;
            fromChar += completion.text.indexOf('{');
            let charTo = fromChar + match[1].length + 2;
            cm.setSelection({line: line, ch: fromChar}, {line: line, ch: charTo});
            CodeMirror.signal(cm, 'header-value-support', {
              type: header.params[match[1]],
              key: header.key,
              value: completion.text
            });
          }
        }
      }
    };

    for (var i = 0; i < headersStructure.length; i++) {
      if (headersStructure[i].key.toLowerCase() === key) {
        var valuesLenght = headersStructure[i].values && headersStructure[i].values.length || 0;
        for (var j = 0; j < valuesLenght; j++) {
          let item = headersStructure[i].values[j];
          var completion = {
            text: item,
            hint: clb.bind(this, headersStructure[i])
          };
          keywords.push(completion);
        }
        break;
      }
    }
    return keywords;
  };

  var cleanResults = function(text, keywords) {
    var results = [];
    var i = 0;
    for (i = 0; i < keywords.length; i++) {
      if (keywords[i].text) {
        if (keywords[i].text.toLowerCase().substring(0, text.length) === text) {
          results.push(keywords[i]);
        }
      } else {
        if (keywords[i].toLowerCase().substring(0, text.length) === text) {
          results.push(keywords[i]);
        }
      }
    }
    return results;
  };

  function getHints(editor) {
    var cur = editor.getCursor();
    var token = getToken(editor, cur);
    var tokenString = (!!token.string) ? '' : token.string.trim();
    var keywords = [];
    var i = 0;
    var fromCur = {
      line: cur.line,
      ch: cur.ch + 2
    };
    var toCur = {
      line: cur.line,
      ch: cur.ch
    };
    var flagClean = true;
    var last = editor.getRange({
      line: cur.line,
      ch: cur.ch - 1
    }, cur);
    var last2 = editor.getRange({
      line: cur.line,
      ch: cur.ch - 2
    }, cur);

    if ((last === ':' || last2 === ': ') || (last === ',' || last2 === ', ')) {
      var key = editor.getRange({
        line: cur.line,
        ch: 0
      }, cur);
      if (!key) {
        key = '';
      }
      key = key.substr(0, key.indexOf(':')).trim().toLowerCase();
      keywords = getHeaderValuesFor(headersStructure, key);

    } else if (editor.getRange({
        line: cur.line,
        ch: 0
      }, cur).trim() !== '') {
      var prev = editor.getRange({
        line: cur.line,
        ch: 0
      }, cur).trim();
      if (prev.indexOf(':') > -1) {
        //looking for value
        tokenString = prev.substr(prev.indexOf(':') + 1).trim().toLowerCase();
        keywords = getHeaderValuesFor(headersStructure, key);
      } else {
        //looking for header name starting with...
        tokenString = prev.toLowerCase();
        keywords = getKeywords(headersStructure);
      }
      fromCur.ch = token.start;

    } else {
      for (i = 0; i < headersStructure.length; i++) {
        keywords = getKeywords(headersStructure);
      }
    }

    if (flagClean === true && tokenString.trim() === '') {
      flagClean = false;
    }

    if (flagClean) {
      keywords = cleanResults(tokenString, keywords);
    }
    /*
     * from: replaceToken ? Pos(cur.line, tagStart == null ? token.start : tagStart) : cur,
     to: replaceToken ? Pos(cur.line, token.end) : cur
     */
    return {
      list: keywords,
      from: fromCur,
      to: toCur
    };
  }

  CodeMirror.registerHelper('hint', 'http-headers', getHints);
});

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE
(function(mod) {
  if (typeof exports == 'object' && typeof module == 'object') {// CommonJS
    mod(require('./../lib/codemirror'));
  } else if (typeof define == 'function' && define.amd) {// AMD
    define(['../../lib/codemirror'], mod);
  } else {// Plain browser env
    mod(CodeMirror);
  }
})(function(CodeMirror) {
  'use strict';

  var HINT_ELEMENT_CLASS = 'CodeMirror-hint';
  var ACTIVE_HINT_ELEMENT_CLASS = 'iron-selected';

  // This is the old interface, kept around for now to stay
  // backwards-compatible.
  CodeMirror.showHint = function(cm, getHints, options) {
    if (!getHints) {
      return cm.showHint(options);
    }
    if (options && options.async) {
      getHints.async = true;
    }
    var newOpts = {
      hint: getHints
    };
    if (options) {
      for (var prop in options) {
        newOpts[prop] = options[prop];
      }
    }
    return cm.showHint(newOpts);
  };

  CodeMirror.defineExtension('showHint', function(options) {
    // We want a single cursor position.
    if (this.listSelections().length > 1 || this.somethingSelected()) {
      return;
    }

    if (this.state.completionActive) {
      this.state.completionActive.close();
    }
    var completion = this.state.completionActive = new Completion(this, options);
    if (!completion.options.hint) {
      return;
    }

    CodeMirror.signal(this, 'startCompletion', this);
    completion.update(true);
  });

  function Completion(cm, options) {
    this.cm = cm;
    this.options = this.buildOptions(options);
    this.widget = null;
    this.debounce = 0;
    this.tick = 0;
    this.startPos = this.cm.getCursor();
    this.startLen = this.cm.getLine(this.startPos.line).length;

    var self = this;
    cm.on('cursorActivity', this.activityFunc = function() {
      self.cursorActivity();
    });
  }

  var requestAnimationFrame = window.requestAnimationFrame || function(fn) {
    return setTimeout(fn, 1000 / 60);
  };
  var cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout;

  Completion.prototype = {
    close: function() {
      if (!this.active()) {
        return;
      }
      this.cm.state.completionActive = null;
      this.tick = null;
      this.cm.off('cursorActivity', this.activityFunc);

      if (this.widget && this.data) {
        CodeMirror.signal(this.data, 'close');
      }
      if (this.widget) {
        this.widget.close();
      }
      CodeMirror.signal(this.cm, 'endCompletion', this.cm);
    },

    active: function() {
      return this.cm.state.completionActive == this;
    },

    pick: function(data, i) {
      var completion = data.list[i];
      if (completion.hint) {
        completion.hint(this.cm, data, completion);
      } else {
        this.cm.replaceRange(getText(completion), completion.from || data.from,
          completion.to || data.to, 'complete');
      }
      CodeMirror.signal(data, 'pick', completion);
      this.close();
    },

    cursorActivity: function() {
      if (this.debounce) {
        cancelAnimationFrame(this.debounce);
        this.debounce = 0;
      }

      var pos = this.cm.getCursor();
      var line = this.cm.getLine(pos.line);
      if (pos.line != this.startPos.line ||
        line.length - pos.ch != this.startLen - this.startPos.ch ||
        pos.ch < this.startPos.ch || this.cm.somethingSelected() ||
        (pos.ch && this.options.closeCharacters.test(line.charAt(pos.ch - 1)))) {
        this.close();
      } else {
        var self = this;
        this.debounce = requestAnimationFrame(function() {
          self.update();
        });
        if (this.widget) {
          this.widget.disable();
        }
      }
    },

    update: function(first) {
      if (this.tick == null) {
        return;
      }
      if (this.data) {
        CodeMirror.signal(this.data, 'update');
      }
      if (!this.options.hint.async) {
        this.finishUpdate(this.options.hint(this.cm, this.options), first);
      } else {
        var myTick = ++this.tick;
        var self = this;
        this.options.hint(this.cm, function(data) {
          if (self.tick == myTick) {
            self.finishUpdate(data, first);
          }
        }, this.options);
      }
    },

    finishUpdate: function(data, first) {
      this.data = data;

      var picked = (this.widget && this.widget.picked) || (first && this.options.completeSingle);
      if (this.widget) {
        this.widget.close();
      }
      if (data && data.list.length) {
        if (picked && data.list.length == 1) {
          this.pick(data, 0);
        } else {
          this.widget = new Widget(this, data);
          CodeMirror.signal(data, 'shown');
        }
      }
    },

    buildOptions: function(options) {
      var editor = this.cm.options.hintOptions;
      var out = {};
      for (var prop in defaultOptions) {
        out[prop] = defaultOptions[prop];
      }
      if (editor) {
        for (var prop in editor) {
          if (editor[prop] !== undefined) {
            out[prop] = editor[prop];
          }
        }
      }
      if (options) {
        for (var prop in options) {
          if (options[prop] !== undefined) {
            out[prop] = options[prop];
          }
        }
      }
      return out;
    }
  };

  function getText(completion) {
    if (typeof completion === 'string') {
      return completion;
    } else {
      return completion.text;
    }
  }

  function buildKeyMap(completion, handle) {
    var baseMap = {
      Up: function() {
        handle.moveFocus(-1);
      },
      Down: function() {
        handle.moveFocus(1);
      },
      PageUp: function() {
        handle.moveFocus(-handle.menuSize() + 1, true);
      },
      PageDown: function() {
        handle.moveFocus(handle.menuSize() - 1, true);
      },
      Home: function() {
        handle.setFocus(0);
      },
      End: function() {
        handle.setFocus(handle.length - 1);
      },
      Enter: handle.pick,
      Tab: handle.pick,
      Esc: handle.close
    };
    var custom = completion.options.customKeys;
    var ourMap = custom ? {} : baseMap;

    function addBinding(key, val) {
      var bound;
      if (typeof val !== 'string') {
        bound = function(cm) {
          return val(cm, handle);
        };
        // This mechanism is deprecated
      } else if (baseMap.hasOwnProperty(val)) {
        bound = baseMap[val];
      } else {
        bound = val;
      }
      ourMap[key] = bound;
    }
    if (custom) {
      for (var key in custom) {
        if (custom.hasOwnProperty(key)) {
          addBinding(key, custom[key]);
        }
      }
    }
    var extra = completion.options.extraKeys;
    if (extra) {
      for (var key in extra) {
        if (extra.hasOwnProperty(key)) {
          addBinding(key, extra[key]);
        }
      }
    }
    return ourMap;
  }

  function getHintElement(hintsElement, el) {
    while (el && el != hintsElement) {
      if (el.nodeName.toUpperCase() === 'LI' && el.parentNode === hintsElement) {
        return el;
      }
      el = el.parentNode;
    }
  }

  function Widget(completion, data) {
    this.completion = completion;
    this.data = data;
    this.picked = false;
    var widget = this;
    var cm = completion.cm;

    var hints = this.hints = document.createElement('paper-material');
    hints.className = 'CodeMirror-hints';
    this.selectedHint = data.selectedHint || 0;
    var container = document.createElement('paper-menu');
    container.selected = 0;
    hints.appendChild(container);
    hints.elevation = 2;

    var completions = data.list;
    for (var i = 0; i < completions.length; ++i) {
      var elt = container.appendChild(document.createElement('paper-item'));
      var cur = completions[i];
      var className = HINT_ELEMENT_CLASS + (i != this.selectedHint ? '' : ' ' +
        ACTIVE_HINT_ELEMENT_CLASS);
      if (cur.className != null) {
        className = cur.className + ' ' + className;
      }
      elt.className = className;
      if (cur.render) {
        cur.render(elt, data, cur);
      } else {
        elt.appendChild(document.createTextNode(cur.displayText || getText(cur)));
      }
      elt.hintId = i;
    }

    var pos = cm.cursorCoords(completion.options.alignWithWord ? data.from : null, 'local');
    var left = pos.left;
    var top = pos.bottom;
    var below = true;
    hints.style.left = left + 'px';
    hints.style.top = top + 'px';
    // If we're at the edge of the screen, then we want the menu to appear on the left of the
    // cursor.
    var winW = window.innerWidth || Math.max(document.body.offsetWidth,
      document.documentElement.offsetWidth);
    var winH = window.innerHeight || Math.max(document.body.offsetHeight,
      document.documentElement.offsetHeight);
    (completion.options.container || document.body).appendChild(hints);
    var box = hints.getBoundingClientRect();
    var overlapY = box.bottom - winH;
    if (overlapY > 0) {
      var height = box.bottom - box.top;
      var curTop = pos.top - (pos.bottom - box.top);
      if (curTop - height > 0) { // Fits above cursor
        hints.style.top = (top = pos.top - height) + 'px';
        below = false;
      } else if (height > winH) {
        hints.style.height = (winH - 5) + 'px';
        hints.style.top = (top = pos.bottom - box.top) + 'px';
        var cursor = cm.getCursor();
        if (data.from.ch != cursor.ch) {
          pos = cm.cursorCoords(cursor);
          hints.style.left = (left = pos.left) + 'px';
          box = hints.getBoundingClientRect();
        }
      }
    }
    var overlapX = box.right - winW;
    if (overlapX > 0) {
      if (box.right - box.left > winW) {
        hints.style.width = (winW - 5) + 'px';
        overlapX -= (box.right - box.left) - winW;
      }
      hints.style.left = (left = pos.left - overlapX) + 'px';
    }

    cm.addKeyMap(this.keyMap = buildKeyMap(completion, {
      moveFocus: function(n, avoidWrap) {
        widget.changeActive(widget.selectedHint + n, avoidWrap);
      },
      setFocus: function(n) {
        widget.changeActive(n);
      },
      menuSize: function() {
        return widget.screenAmount();
      },
      length: completions.length,
      close: function() {
        completion.close();
      },
      pick: function() {
        widget.pick();
      },
      data: data
    }));

    if (completion.options.closeOnUnfocus) {
      var closingOnBlur;
      cm.on('blur', this.onBlur = function() {
        closingOnBlur = setTimeout(function() {
          completion.close();
        }, 100);
      });
      cm.on('focus', this.onFocus = function() {
        clearTimeout(closingOnBlur);
      });
    }

    var startScroll = cm.getScrollInfo();
    cm.on('scroll', this.onScroll = function() {
      var curScroll = cm.getScrollInfo();
      var editor = cm.getWrapperElement().getBoundingClientRect();
      var newTop = top + startScroll.top - curScroll.top;
      var point = newTop -
        (window.pageYOffset || (document.documentElement || document.body).scrollTop);
      if (!below) {
        point += hints.offsetHeight;
      }
      if (point <= editor.top || point >= editor.bottom) {
        return completion.close();
      }
      hints.style.top = newTop + 'px';
      hints.style.left = (left + startScroll.left - curScroll.left) + 'px';
    });

    CodeMirror.on(hints, 'dblclick', function(e) {
      var t = getHintElement(hints.children[0], e.target || e.srcElement);
      if (t && t.hintId != null) {
        widget.changeActive(t.hintId);
        widget.pick();
      }
    });

    CodeMirror.on(hints, 'click', function(e) {
      var t = getHintElement(hints.children[0], e.target || e.srcElement);
      if (t && t.hintId != null) {
        widget.changeActive(t.hintId);
        if (completion.options.completeOnSingleClick) {
          widget.pick();
        }
      }
    });

    CodeMirror.on(hints, 'mousedown', function() {
      setTimeout(function() {
        cm.focus();
      }, 20);
    });

    CodeMirror.signal(data, 'select', completions[0], hints.children[0].firstChild);
    return true;
  }

  Widget.prototype = {
    close: function() {
      if (this.completion.widget != this) {
        return;
      }
      this.completion.widget = null;
      this.hints.parentNode.removeChild(this.hints);
      this.completion.cm.removeKeyMap(this.keyMap);

      var cm = this.completion.cm;
      if (this.completion.options.closeOnUnfocus) {
        cm.off('blur', this.onBlur);
        cm.off('focus', this.onFocus);
      }
      cm.off('scroll', this.onScroll);
    },

    disable: function() {
      this.completion.cm.removeKeyMap(this.keyMap);
      var widget = this;
      this.keyMap = {
        Enter: function() {
          widget.picked = true;
        }
      };
      this.completion.cm.addKeyMap(this.keyMap);
    },

    pick: function() {
      this.completion.pick(this.data, this.selectedHint);
    },

    changeActive: function(i, avoidWrap) {
      if (i >= this.data.list.length) {
        i = avoidWrap ? this.data.list.length - 1 : 0;
      } else if (i < 0) {
        i = avoidWrap ? 0 : this.data.list.length - 1;
      }
      if (this.selectedHint == i) {
        return;
      }
      var node = this.hints.children[0].children[this.selectedHint];
      node.className = node.classList.remove(ACTIVE_HINT_ELEMENT_CLASS);
      node = this.hints.children[0].children[this.selectedHint = i];
      node.classList.add(ACTIVE_HINT_ELEMENT_CLASS);
      if (node.offsetTop < this.hints.scrollTop) {
        this.hints.scrollTop = node.offsetTop - 3;
      } else if (node.offsetTop + node.offsetHeight > this.hints.scrollTop +
        this.hints.clientHeight) {
        this.hints.scrollTop = node.offsetTop + node.offsetHeight - this.hints.clientHeight + 3;
      }
      CodeMirror.signal(this.data, 'select', this.data.list[this.selectedHint], node);
    },

    screenAmount: function() {
      return Math.floor(this.hints.clientHeight /
        this.hints.children[0].children[0].offsetHeight) || 1;
    }
  };

  CodeMirror.registerHelper('hint', 'auto', function(cm, options) {
    var helpers = cm.getHelpers(cm.getCursor(), 'hint');
    var words;
    if (helpers.length) {
      for (var i = 0; i < helpers.length; i++) {
        var cur = helpers[i](cm, options);
        if (cur && cur.list.length) {
          return cur;
        }
      }
    } else if (words = cm.getHelper(cm.getCursor(), 'hintWords')) {
      if (words) {
        return CodeMirror.hint.fromList(cm, {
          words: words
        });
      }
    } else if (CodeMirror.hint.anyword) {
      return CodeMirror.hint.anyword(cm, options);
    }
  });

  CodeMirror.registerHelper('hint', 'fromList', function(cm, options) {
    var cur = cm.getCursor();
    var token = cm.getTokenAt(cur);
    var found = [];
    for (var i = 0; i < options.words.length; i++) {
      var word = options.words[i];
      if (word.slice(0, token.string.length) === token.string) {
        found.push(word);
      }
    }

    if (found.length) {
      return {
        list: found,
        from: CodeMirror.Pos(cur.line, token.start),
        to: CodeMirror.Pos(cur.line, token.end)
      };
    }
  });

  CodeMirror.commands.autocomplete = CodeMirror.showHint;

  var defaultOptions = {
    hint: CodeMirror.hint.auto,
    completeSingle: true,
    alignWithWord: true,
    closeCharacters: /[\s()\[\]{};:>,]/,
    closeOnUnfocus: true,
    completeOnSingleClick: false,
    container: null,
    customKeys: null,
    extraKeys: null
  };

  CodeMirror.defineOption('hintOptions', null);
});
