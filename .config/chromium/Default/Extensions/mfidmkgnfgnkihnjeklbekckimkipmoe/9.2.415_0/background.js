chrome.runtime.onConnect.addListener(function(port)
{
    var match = port.name.match('^devtools-(\\d+)$')
    if (!match)
        return

    var [, portId] = match

    function logFunc(message, sender)
    {
        var {url, newPlayer} = message
        var {tab: {id: tabId, url: tabUrl}, url: frameUrl} = sender

        if (tabId != portId)
            return

        matchesAny(url, tabUrl, frameUrl).then(match =>
        {
            var {type, text} = match || {}
            port.postMessage({
                cmd: 'log',
                args: {url, frameUrl, newPlayer, type, text}
            })
        })
    }

    function resetFunc(tabId, {status}, {url})
    {
        if (status == 'loading' && tabId == portId) {
            port.postMessage({
                cmd: 'update',
                args: {url}
            })
        }
    }

    chrome.tabs.onUpdated.addListener(resetFunc)
    chrome.runtime.onMessage.addListener(logFunc)

    port.onMessage.addListener(({text, enable}) =>
    {
        storageGet({filters: ''}).then(({filters}) =>
        {
            filters = removeLines(filters, ['', text])
            if (enable)
                filters = `${filters}\n${text}`.trim()
            storageSet({filters})
        })
    })

    port.onDisconnect.addListener(() =>
    {
        chrome.tabs.onUpdated.removeListener(resetFunc)
        chrome.runtime.onMessage.removeListener(logFunc)
    })
})

function setUpdatedTabIcon(tabId, info, tab)
{
    var {status} = info
    if (status != 'loading')
        return

    updateIcon(tab)
}

function setReplacedTabIcon(tabId)
{
    getTab(tabId).then(updateIcon)
}

function setPlayerCounter(message, sender)
{
    var {newPlayer} = message
    var {tab: {id: tabId}} = sender
    if (!newPlayer)
        return

    updateBadge(tabId, true)
}

updateBadge = async(function* (tabId, increment = false)
{
    var text = null
    if (increment)
    {
        text = yield getBadgeText({tabId}).catch(err => null)
        if (text != null) text = Number(text) + 1
    }
    else
    {
        let allFrames = true
        let matchAboutBlank = true
        let file = 'commands/count.js'
        let result = yield executeScript(tabId, {allFrames, matchAboutBlank, file})
        text = result.reduce((a, b) => a + b, 0) || ''
    }

    if (text != null)
    {
        setBadgeBackgroundColor({tabId, color: '#555'})
        setBadgeText({tabId, text: String(text)})
    }
})

updateIcon = async(function* (tab)
{
    var {id: tabId, url} = tab
    if (!permittedScheme(url))
        return

    var match = yield matchesDocument(url)
    var {type, text} = match || {}

    if (!type)
    {
        let session = yield matchesSession(url)
        if (session) type = 'whitelist'
    }

    if (type)
    {
        let path = `skin/${type == 'whitelist' ? 'allow': 'prevent'}.svg`
        setBrowserIcon({tabId, path})
    }
})

function setupToolbarMenu(prefs)
{
    var {menu_indicator, badge_counter} = prefs

    chrome.tabs.onUpdated.removeListener(setUpdatedTabIcon)
    chrome.tabs.onReplaced.removeListener(setReplacedTabIcon)
    if (menu_indicator) {
        chrome.tabs.onUpdated.addListener(setUpdatedTabIcon)
        chrome.tabs.onReplaced.addListener(setReplacedTabIcon)
    }

    chrome.runtime.onMessage.removeListener(setPlayerCounter)
    chrome.tabs.onReplaced.removeListener(updateBadge)
    if (badge_counter) {
        chrome.runtime.onMessage.addListener(setPlayerCounter)
        chrome.tabs.onReplaced.addListener(updateBadge)
    }
}

chrome.storage.onChanged.addListener(function({prefs})
{
    if (prefs)
        setupToolbarMenu(prefs.newValue || defaults)
})

getPrefs().then(setupToolbarMenu)

function setupMenus(prefs)
{
    var task = removeContextMenus()

    var {context_menu} = prefs
    if (!context_menu)
        return

    task.then(() => {
        var contexts = ['page', 'frame']
        var documentUrlPatterns = ['*://*/*']
        createContextMenu({
            id: 'run',
            title: i18nMessage('run_now'),
            contexts,
            documentUrlPatterns
        })
        createContextMenu({
            id: 'separator',
            type: 'separator',
            contexts,
            documentUrlPatterns
        })
        createContextMenu({
            id: 'settings',
            title: i18nMessage('settings'),
            documentUrlPatterns
        })
    })
}

function updateMenus()
{
    getPrefs().then(setupMenus)
}

chrome.contextMenus.onClicked.addListener(function(info, tab)
{
    if (info.menuItemId == 'run')
    {
        let {id, url} = tab
        if (permittedScheme(url)) {
            executeScript(id, {
                file: 'commands/run.js',
                allFrames: true,
                matchAboutBlank: true
            })
        }
    }
    else
    {
        openOptionsPage()
    }
})

chrome.runtime.onStartup.addListener(updateMenus)
chrome.runtime.onInstalled.addListener(updateMenus)
chrome.storage.onChanged.addListener(function({prefs})
{
    if (prefs)
        setupMenus(prefs.newValue || defaults)
})

checkFilter = async(function* (url, tabUrl, frameUrl)
{
    var match = yield matchesAny(url, tabUrl, frameUrl)
    var {type, text} = match || {}

    if (!type)
    {
        let session = yield matchesSession(tabUrl)
        if (session) type = 'whitelist'
    }

    if (!type)
    {
        let behavior = yield getPref('default_behavior')
        if (behavior) type = behavior
    }

    return type
})

chrome.runtime.onStartup.addListener(function()
{
    storageRemove('sessions')
})

chrome.runtime.onMessage.addListener(function({url}, sender, callback)
{
    var {url: frameUrl, tab: {url: tabUrl}} = sender
    checkFilter(url, tabUrl, frameUrl).then(callback, callback)

    return true
})

chrome.storage.onChanged.addListener(function({filters, prefs, sessions})
{
    if (filters) window.filters = null
    if (prefs) window.prefs = null
    if (sessions) window.sessions = null
})
