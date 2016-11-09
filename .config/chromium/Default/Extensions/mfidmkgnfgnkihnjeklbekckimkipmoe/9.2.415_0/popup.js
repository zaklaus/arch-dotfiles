/*
 * popup menu item
 */
var PopupItem = Object.create(HTMLElement.prototype)

Object.defineProperty(PopupItem, 'type', {
    enumerable: true,
    set: function(type) {
        this.setAttribute('type', type)
    },
    get: function() {
        return this.hasAttribute('type') ? this.getAttribute('type'): 'text'
    }
})

document.registerElement('popup-item', {prototype: PopupItem})

/*
 * popup menu
 */
var PopupMenu = Object.create(HTMLElement.prototype)

PopupMenu.addItems = function(items) {
    var section = document.createElement('section')
    for (let menu of items) {
        let el = $x('popup-item')
        Object.assign(el, menu)
        section.appendChild(el)
    }
    this.appendChild(section)
    return this
}

PopupMenu.addSeparator = function(items) {
    var el = $x('popup-item')
    el.type = 'separator'
    this.appendChild(el)
    return this
}

document.registerElement('popup-menu', {prototype: PopupMenu})

var {getDecodedHostname, RegExpFilter, CombinedMatcher, parseFilters} = adblockplus
var activeTab = queryTabs({lastFocusedWindow: true, active: true}).then(tabs => tabs[0])

function showGlassPane() {
    var node = document.createElement('div')
    node.className = 'glasspane'
    document.body.appendChild(node)
}

function waitForClick(el, selector = '*') {
    return new Promise(resolve => {
        el.onclick = event => {
            var {target} = event
            for (var el of $$(selector)) {
                if (el == target || el.contains(target))
                    resolve(el)
            }
        }
    })
}

function checkMenu(itemId)
{
    for (let el of $$('#allow-page,#allow-site,#allow-session')) {
        let {id, classList} = el
        classList.toggle('checked', !classList.toggle('disabled', id != itemId))
    }
}

handleClicks = async(function* ()
{
    var popup = $('popup-menu')
    var selector = 'popup-item'

    while (true)
    {
        let {id, classList} = yield waitForClick(popup, selector)

        if (id == 'allow-site' || id == 'allow-page' || id == 'allow-session')
        {
            showGlassPane()

            let {id: tabId, url: tabUrl} = yield activeTab
            let enable = classList.contains('checked')

            let wasToggled = false
            if (id == 'allow-session') {
                wasToggled = yield toggleSession(tabUrl, !enable)
            }
            else {
                let type = '@@'
                let area = id.replace(/^\w+-/, '')
                let {length} = yield toggleFilter(tabUrl, !enable, {type, area})
                wasToggled = length > 0
            }
            if (wasToggled)
            {
                yield executeScript(tabId, {
                    file: 'commands/filter.js',
                    matchAboutBlank: true,
                    allFrames: true
                })
            }

            var icon = yield getPref('menu_indicator')
            if (icon) {
                let path = `${enable ? 'block': 'allow'}.svg`
                yield setBrowserIcon({tabId, path})
            }

            break
        }

        if (id == 'settings')
        {
            showGlassPane()
            yield openOptionsPage()

            break
        }
    }
})

setupMenu = async(function* ()
{
    var popup = $('popup-menu')
    popup.addItems([{
        id: 'allow-page',
        innerText: i18nMessage('allow_page')
    }, {
        id: 'allow-site',
        innerText: i18nMessage('allow_site')
    }, {
        id: 'allow-session',
        innerText: i18nMessage('allow_session')
    }])
    .addSeparator()
    .addItems([{
        id: 'settings',
        innerText: i18nMessage('settings')
    }])

    var {url} = yield activeTab
    var uri = new URL(url)
    var hostname = getDecodedHostname(uri)

    assert('chrome.google.com' != hostname)
    assert(!url.startsWith('chrome'))

    var match = yield matchesDocument(uri.origin)
    if (match)
    {
        checkMenu(match.type == 'whitelist' ? 'allow-site': '')
        return
    }

    match = yield matchesDocument(url)
    if (match)
    {
        checkMenu(match.type == 'whitelist' ? 'allow-page': '')
        return
    }

    match = yield matchesSession(url)
    if (match)
        checkMenu('allow-session')
})

run(function* ()
{
    yield setupMenu().catch(() => $('popup-menu').classList.add('error'))
    yield handleClicks()
    window.close()
})
