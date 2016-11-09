function sendEvent(el, event, detail) {
    return el.dispatchEvent(
        new CustomEvent(event,
            {bubbles: true, cancelable: true, detail: detail}))
}

/*
 * devtools record
 */
var RecordElement = Object.create(HTMLElement.prototype)

RecordElement.createdCallback = function() {
    var address = this.appendChild($x('div', {className: 'address'}))
    address.appendChild($x('div', {className: 'url'}))
    address.appendChild($x('div', {className: 'host'}))
    this.appendChild($x('div', {className: 'filter'}))
    this.appendChild($x('div', {className: 'action'}))
    this.actions = new WeakMap()
    this.addEventListener('click', this)
}

RecordElement.update = function(details) {
    var {url, frameUrl, type, text} = details

    var urlEl = $('.url', this)
    var hostEl = $('.host', this)
    urlEl.innerText = urlEl.title = url
    hostEl.innerText = hostEl.title = new URL(frameUrl).hostname.replace(/^www\./, '')

    this._setFilterText({type, text})
}

RecordElement._setFilterText = function(filter) {
    var {type = '', text = ''} = filter

    var filterEl = $('.filter', this)
    filterEl.innerText = filterEl.title = type ? text: ''

    var actionEl = $('.action', this)
    actionEl.innerHTML = ''

    this.setAttribute('type', type)
    if (type) {
        let button = actionEl.appendChild($x('button', {innerText: i18nMessage('remove_filter')}))
        this.actions.set(button, {text, enable: false})
    }
    else {
        let allowEl = actionEl.appendChild($x('button', {innerText: 'Allow'}))
        let blockEl = actionEl.appendChild($x('button', {innerText: 'Block'}))

        let text = $('.url', this).innerText
            .replace(/^\w+:\/+(www\.)?/, ([,, p2]) => p2 == 'about:blank' ? '': '||')

        this.actions.set(allowEl, {type: 'whitelist', text: `@@${text}`, enable: true})
        this.actions.set(blockEl, {type: 'blocking', text, enable: true})
    }
}

RecordElement.handleEvent = function(event) {
    var el = event.target
    if (el === this) return

    var action = this.actions.get(el)
    if (action)
    {
        sendEvent(this, 'devtoolsAction', action)
        this._setFilterText(action)
    }
}

document.registerElement('devtools-record', {prototype: RecordElement})

/*
 * devtools
 */
var DevTools = Object.create(HTMLElement.prototype)

DevTools.createdCallback = function() {
    var labels = this.appendChild($x('div', {className: 'labels'}))
    this.appendChild($x('div', {className: 'requests'}))
    let record = labels.appendChild($x('devtools-record'))
    $('.url', record).innerText = i18nMessage('address')
    $('.filter', record).innerText = i18nMessage('filter')
    var dividers = this.appendChild($x('div', {className: 'dividers'}))
    dividers.appendChild($x('devtools-record'))
}

DevTools.log = function(details) {
    var el = $x('devtools-record')
    el.update(details)
    $('.requests', this).appendChild(el)
    el.scrollIntoView()
}

DevTools.clear = function() {
    $('.requests', this).innerHTML = ''
}

document.registerElement('devtools-panel', {prototype: DevTools})

var inspectedDomain = ''
var inspectedTabId = chrome.devtools.inspectedWindow.tabId
var messagePort = chrome.runtime.connect({name: `devtools-${inspectedTabId}`})
var devtoolsPanel = $('devtools-panel')

messagePort.onMessage.addListener(function({cmd, args}) {
    if (cmd == 'update') {
        let {url} = args
        let {hostname} = new URL(url)
        if (inspectedDomain != hostname) {
            inspectedDomain = hostname
            devtoolsPanel.clear()
        }
    } else if (cmd == 'log') {
        let {newPlayer} = args
        if (newPlayer)
            devtoolsPanel.log(args)
    }
})

devtoolsPanel.addEventListener('devtoolsAction', function(event) {
    var {detail} = event
    messagePort.postMessage(detail)
})
