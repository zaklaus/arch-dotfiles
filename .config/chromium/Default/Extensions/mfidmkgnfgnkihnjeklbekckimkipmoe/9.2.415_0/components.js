function promise(obj, func, ...args) {
    return new Promise((resolve, reject) => {
        args.push(function(...result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError)
            } else {
                resolve(result.length <= 1 ? result[0]: result)
            }
        })
        obj[func](...args)
    })
}

function async(genFunc) {
    return function(...args) {
        var generator = genFunc.apply(this, args)
        return new Promise((resolve, reject) => {
            function resume(method, value) {
                try {
                    var iter = generator[method](value)
                    if (iter.done)
                        resolve(iter.value)
                    else
                        iter.value.then(next, abort)
                }
                catch (err) {
                    reject(err)
                }
            }
            var next = resume.bind(null , 'next')
            var abort = resume.bind(null , 'throw')
            next()
        })
    }
}

function run(genFunc, ...args) {
    return async(genFunc)(...args)
}

function storageSet(obj, area = 'local') {
    return promise(chrome.storage[area], 'set', obj)
}

function storageGet(obj, area = 'local') {
    return promise(chrome.storage[area], 'get', obj)
}

function storageRemove(obj, area = 'local') {
    return promise(chrome.storage[area], 'remove', obj)
}

function storageClear(area = 'local') {
    return promise(chrome.storage[area], 'clear')
}

function getValue(obj, area = 'local') {
    var key = Object.keys(obj)[0]
    return storageGet(obj, area).then(data => data[key])
}

function getBadgeText(details) {
    return promise(chrome.browserAction, 'getBadgeText', details)
}

function setBadgeText(details) {
    chrome.browserAction.setBadgeText(details)
}

function setBadgeBackgroundColor(details) {
    chrome.browserAction.setBadgeBackgroundColor(details)
}

function setBrowserIcon(details) {
    return promise(chrome.browserAction, 'setIcon', details)
}

function createContextMenu(details) {
    return promise(chrome.contextMenus, 'create', details)
}

function removeContextMenus(details) {
    return promise(chrome.contextMenus, 'removeAll')
}

function queryTabs(details) {
    return promise(chrome.tabs, 'query', details)
}

function executeScript(tabId, details) {
    return promise(chrome.tabs, 'executeScript', tabId, details)
}

function getTab(tabId) {
    return promise(chrome.tabs, 'get', tabId)
}

function assert(expr, str) {
    if (!expr) throw new Error(str)
    return expr
}

function escapeChars(str) {
    return str.replace(/[\\^$*+?.()|[\]{}]/g, '\\$&')
}

// http://www.ietf.org/rfc/rfc3986.txt (appendix B)
function splitUrl(str) {
    var [,, scheme = '*',, auth = '', path = '',, query = ''] =
        str.match('^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?')
    return {scheme, auth, path, query}
}

function removeLines(body, strings) {
    var lines = new Set(body.split('\n').map(s => s.trim()))
    for (let str of strings)
        lines.delete(str)
    return Array.from(lines).join('\n')
}

function permittedScheme(url) {
    var [scheme,] = url.split(':')
    return ['http', 'https', 'file', 'ftp'].includes(scheme)
}

var defaults = {}
defaults.player_reblock = true
defaults.placeholder_color = '#464646'
defaults.placeholder_icon = 'pluginlogo.svg'
defaults.badge_counter = true
defaults.menu_indicator = false
defaults.devtools_panel = false
defaults.default_behavior = 'replace'
defaults.context_menu = true

function loadPrefs() {
    return storageGet({prefs: {}}, 'sync')
        .then(({prefs}) => Object.assign({}, defaults, prefs))
}

function getPrefs() {
    if (window.prefs == null)
        window.prefs = loadPrefs()
    return window.prefs
}

function getPref(key) {
    return getPrefs().then(prefs => prefs[key])
}

function setPrefs(obj) {
    return loadPrefs().then(prefs => {
        Object.assign(prefs, obj)
        return storageSet({prefs}, 'sync')
    })
}

function clearPrefs() {
    return storageRemove('prefs', 'sync')
}

function i18nMessage(key, inputs) {
    return chrome.i18n.getMessage(key, inputs)
}

function openOptionsPage() {
    return promise(chrome.runtime, 'openOptionsPage')
}
