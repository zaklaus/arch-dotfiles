function isValidType(value)
{
    return value.toLowerCase().match('application/(x-shockwave-fl|futurespl)ash')
}

function isValidData(value)
{
    return value.toLowerCase().match('\.swf\\b')
}

function isValidFallback(element)
{
    var {parentNode} = element
    if (parentNode instanceof HTMLObjectElement)
        return !matchObject(parentNode)

    return true
}

function matchParams(element)
{
    var child = element.lastElementChild
    while (child)
    {
        if (child instanceof HTMLParamElement)
        {
            let {name, value} = child

            if (name == 'type' && isValidType(value))
                return true

            if (name == 'movie' && isValidData(value))
                return true

            if (name == 'src' && isValidData(value))
                return true
        }
        child = child.previousElementSibling
    }
    return false
}

function matchObject(element)
{
    var {type, data, attributes: {classid}} = element

    if (classid)
        return false

    if (isValidType(type))
        return isValidFallback(element)

    if (isValidData(data))
        return isValidFallback(element)

    return matchParams(element)
}

function matchEmbed(element)
{
    var {type, src} = element

    if (isValidType(type))
        return isValidFallback(element)

    if (isValidData(src))
        return isValidFallback(element)
}

function matchPlugin(element)
{
    if (element instanceof HTMLObjectElement)
        return matchObject(element)

    if (element instanceof HTMLEmbedElement)
        return matchEmbed(element)

    return false
}

function getPluginUrl(element)
{
    var node = {value: ''}
    var {attributes: {src = node, data = node}} = element

    if (element instanceof HTMLEmbedElement)
    {
        node = src
    }
    else if (element instanceof HTMLObjectElement)
    {
        node = data
        if (!node.value.trim())
        {
            let child = element.lastElementChild
            while (child)
            {
                if (child instanceof HTMLParamElement)
                {
                    let {name, value} = child
                    if (name == 'src' || name == 'movie')
                    {
                        node = child
                        break
                    }
                }
                child = child.previousElementSibling
            }
        }
    }

    var url = node.value.trim()
    if (url) url = `${new URL(url, element.baseURI)}`

    return url
}

function collectElements(el)
{
    return Array.from(el.querySelectorAll('object,embed')).filter(matchPlugin)
}

function concatElements(el)
{
    var result = []

    if (el instanceof HTMLElement)
    {
        if (matchPlugin(el))
            result.push(el)
        else
            result.push(...collectElements(el))
    }

    return result
}

function getAnchorPoint(el)
{
    var {top, left} = el.getBoundingClientRect()
    var offsetParent = el.offsetParent

    var anchor = {}
    anchor.top = top
    anchor.left = left

    if (getComputedStyle(el, null).position == 'fixed')
    {
        anchor.position = 'fixed'
        return anchor
    }

    anchor.top += scrollY
    anchor.left += scrollX
    anchor.position = 'absolute'

    if (offsetParent instanceof HTMLTableCellElement)
    {
        return anchor
    }

    if (offsetParent)
    {
        let body = document.body
        let origin = body.getBoundingClientRect()
        let position = getComputedStyle(body, null).position

        let top = origin.top + scrollY
        let left = origin.left + scrollX

        if (position == 'static')
        {
            top = 0
            left = 0
        }

        if (offsetParent !== body)
        {
            let offset = offsetParent.getBoundingClientRect()
            top = offset.top + scrollY
            left = offset.left + scrollX
        }

        anchor.top -= top
        anchor.left -= left
    }

    return anchor
}

function waitForResponse(request)
{
    return new Promise((resolve, reject) =>
    {
        chrome.runtime.sendMessage(request, response => {
            chrome.runtime.lastError ?
                reject(response):
                resolve(response)
        })
    })
}

var elementMap = new WeakMap()
var currentDocument = document.documentElement
var subtreeConfig = {childList: true, subtree: true}
var attributeConfig = {attributes: true, attributeFilter: ['style']}

function scanDocument()
{
    collectElements(currentDocument).forEach(filterElement)
}

function disableContent(records)
{
    var el = records[0].target
    var {observer} = elementMap.get(el)

    observer.disconnect()
    el.style.setProperty('display', 'none', 'important')
    observer.observe(el, attributeConfig)
}

function displayReblockButton(el)
{
    return async(function* (event)
    {
        var {fromElement} = event

        var {button} = elementMap.get(el)
        if (!button.parentNode || !button.hidden || button.contains(fromElement)) {
            return
        }

        button.hidden = false

        var anchor = getAnchorPoint(el)
        var {height} = button.getBoundingClientRect()
        var rtop = true

        button.style.top = `${anchor.top - height}px`
        button.style.left = `${anchor.left}px`
        button.style.position = anchor.position

        var box = button.getBoundingClientRect()
        var pointAt = document.elementFromPoint(box.left, box.top)
        if (!button.contains(pointAt))
        {
            rtop = false
            button.style.top = `${anchor.top}px`
        }

        var desc = rtop ?
            '5.211.24999h53.578c2.7483 0 4.961 2.1835 4.961 4.8958v18.604h-63.5v-18.604c0-2.7123 2.2126-4.8958 4.961-4.8958':
            '63.75,0.25 0,18.60379 c 0,2.7123 -2.215217,5.0157 -4.961,4.8958 L 0.25,23.75 l 0,-23.5'
        button.querySelector('#background').setAttribute('d', `m${desc}z`)
    })
}

function loadContent(el, allow)
{
    var {observer} = elementMap.get(el)
    observer.disconnect()
    if (allow)
    {
        el.style.setProperty('display', 'block', 'important')
    }
    else
    {
        el.style.setProperty('display', 'none', 'important')
        observer.observe(el, attributeConfig)
    }
}

function createPlaceholder(el)
{
    var div = document.createElement('div')
    var view = getComputedStyle(el, null)

    var {width, height} = el
    if (!width) width = view.width
    if (!height) height = view.height

    var css = `width:${width.match('%$|px$') ? width: `${width}px`};`
    css += `height:${height.match('%$|px$') ? height: `${height}px`};`
    if (view.position != 'static')
    {
        css += `position:${view.position};left:${view.left};right:${view.right};`
        css += `top:${view.top};bottom:${view.bottom};`
    }

    div.style.cssText = css
    div.className = 'flashcontrol-placeholder'

    div.onclick = trustUserClick(el)

    return div
}

function createReblockbutton(el)
{
    var figure = document.createElement('figure')
    figure.className = 'flashcontrol-button'
    figure.title = i18nMessage('click_to_block')
    figure.hidden = true

    figure.innerHTML =
        `<svg version="1.1" y="0px" x="0px" viewBox="0 0 64 24" width="64px" height="24px">
            <path id="background" stroke="#999" stroke-width=".49998" fill="#363636"/>
            <g id="logo" fill="#f9f9f9" transform="translate(.4 .059471)">
                <path d="m21.46 12.002a9.5222 9.4844 0 0 1 -19.044 0 9.5222 9.4844 0 1 1 19.044 0z" fill="#d54c40"/>
                <path d="m9.2122 9.6787-1.3463 1.3343c-1.1914 1.179-1.1914 3.0773 0 4.2564l.00844.0084-1.2042 1.1919c-.23828.2358-.23828.61555 0 .85136.23829.2358.62196.23579.86024 0l1.205-1.191c1.1921 1.1702 3.1034 1.1679 4.2919-.0084l1.3467-1.3341z"/>
                <path d="m14.086 6.6055c-.15539.0000024-.3125.059844-.43164.17773l-2.373 2.3516-.98047-.96875c-.23828-.2358-.62109-.23579-.85937 0s-.23829.61576 0 .85156l5.5918 5.5332c.23829.2358.62109.23579.85938 0 .23828-.23579.23829-.61576 0-.85156l-.98828-.97656 2.375-2.3535c.23788-.23539.23709-.61373 0-.84961-.23828-.2358-.62303-.23579-.86133 0l-2.373 2.3516-1.9043-1.8848 2.375-2.3535c.239-.2358.239-.61381 0-.84961-.118-.1177-.274-.1775-.429-.1775z"/>
            </g>
            <text id="text" font-size="12px" y="-0.10571289" font-family="arial" fill="#f9f9f9">
                <tspan y="16.294922" x="25.700125">${i18nMessage('close_button')}</tspan>
            </text>
        </svg>`

    figure.addEventListener('animationend', event => figure.hidden = true)
    figure.onclick = trustUserClick(el)
    el.onmouseover = displayReblockButton(el)

    return figure
}

function addPlaceholder(el, prefs)
{
    var {placeholder, button} = elementMap.get(el)

    button.hidden = true

    pluginObserver.disconnect()
    el.parentNode.insertBefore(placeholder, el)
    pluginObserver.observe(currentDocument, subtreeConfig)

    placeholder.innerHTML = ''
    placeholder.title = i18nMessage('click_to_play')

    placeholder.style.cursor = ''
    placeholder.style.zIndex = getComputedStyle(el, null).zIndex
    placeholder.style.backgroundColor = prefs.placeholder_color
    placeholder.style.backgroundImage = prefs.placeholder_icon ?
        `url(${chrome.runtime.getURL(`skin/${prefs.placeholder_icon}`)})`:
        'none'
}

function removePlaceholder(el)
{
    var {placeholder} = elementMap.get(el)

    if (placeholder.parentNode)
    {
        pluginObserver.disconnect()
        placeholder.parentNode.removeChild(placeholder)
        pluginObserver.observe(currentDocument, subtreeConfig)
    }
}

function addReblockButton(el)
{
    var {button} = elementMap.get(el)

    pluginObserver.disconnect()
    el.parentNode.insertBefore(button, el)
    pluginObserver.observe(currentDocument, subtreeConfig)
}

function removeReblockButton(el)
{
    var {button} = elementMap.get(el)

    if (button.parentNode)
    {
        pluginObserver.disconnect()
        button.parentNode.removeChild(button)
        pluginObserver.observe(currentDocument, subtreeConfig)
    }
}

function allowElement(el)
{
    removePlaceholder(el)
    addReblockButton(el)
    loadContent(el, true)
}

function blockElement(el)
{
    removePlaceholder(el)
    removeReblockButton(el)
    loadContent(el, false)
}

function replaceElement(el, prefs)
{
    addPlaceholder(el, prefs)
    removeReblockButton(el)
    loadContent(el, false)
}

function releaseElement(el)
{
    removePlaceholder(el)
    removeReblockButton(el)
}

function testBrokenScript()
{
    return chrome.runtime.getManifest() == null
}

function trustUserClick(el)
{
    return async(function* (event)
    {
        var {isTrusted, currentTarget} = event

        if (!isTrusted) {
            return
        }

        event.preventDefault()
        event.stopPropagation()

        if (testBrokenScript()) {
            allowElement(el)
            return
        }

        var prefs = yield loadPrefs()
        var {placeholder, button} = elementMap.get(el)
        if (currentTarget === button)
        {
            replaceElement(el, prefs)
        }
        else
        {
            let type = yield checkBackgroundFilter(el).catch(() => ({}))
            if (type != 'blocking') allowElement(el)
            else blockElement(el)

            button.style.display = prefs.player_reblock ? 'block': 'none'
        }
    })
}

function checkBackgroundFilter(el)
{
    var details = {}

    details.newPlayer = !elementMap.has(el)
    details.url = getPluginUrl(el) || 'about:blank'

    return waitForResponse(details)
}

filterElement = async(function* (el)
{
    var filter = yield checkBackgroundFilter(el)

    if (!elementMap.has(el))
    {
        let placeholder = createPlaceholder(el)
        let button = createReblockbutton(el)
        let observer = new MutationObserver(disableContent)
        elementMap.set(el, {placeholder, button, observer})
    }

    var prefs = yield loadPrefs()
    var props = elementMap.get(el)

    props.filter = filter

    var {button} = props
    button.style.display = prefs.player_reblock ? 'block': 'none'

    if (filter == 'whitelist') allowElement(el)
    else if (filter == 'blocking') blockElement(el)
    else replaceElement(el, prefs)
})

pluginObserver = new MutationObserver(function(records)
{
    var added = new Set()
    var removed = new Set()

    for (let record of records)
    {
        Array.from(record.addedNodes)
            .filter(el => el.parentNode)
            .forEach(el => concatElements(el).forEach(el => added.add(el)))
        Array.from(record.removedNodes)
            .filter(el => el.parentNode == null)
            .forEach(el => concatElements(el).forEach(el => removed.add(el)))
    }

    added.forEach(filterElement)
    removed.forEach(el => releaseElement(el))
})

documentObserver = new MutationObserver(function(records)
{
    if (currentDocument !== document.documentElement)
    {
        currentDocument = document.documentElement
        scanDocument()
    }
})

documentObserver.observe(document, {'childList': true})
pluginObserver.observe(currentDocument, subtreeConfig)
window.onpopstate = scanDocument

scanDocument()
