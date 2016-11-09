var adblockplus = Object.assign({},
    require('filterClasses'),
    require('matcher'),
    require('filterValidation'),
    require("url"),
    require('info'))

function loadMatcher(text)
{
    var matcher = adblockplus.defaultMatcher

    matcher.clear()
    var parsed = adblockplus.parseFilters(text.trim())
    parsed.filters.forEach(filter => matcher.add(filter))

    return matcher
}

function getMatcher()
{
    if (window.filters == null)
        window.filters = getValue({filters: ''}).then(loadMatcher)

    return window.filters
}

function getSessions()
{
    if (window.sessions == null)
        window.sessions = getValue({sessions: []})

    return window.sessions
}

matchesSession = async(function* (tabUrl)
{
    var {hostname} = new URL(tabUrl)
    var sessions = yield getSessions()

    return sessions.includes(hostname)
})

matchesDocument = async(function* (tabUrl)
{
    var requestUrl = new URL(tabUrl)
    var matcher = yield getMatcher()

    return matcher.matchesAny(
        adblockplus.stringifyURL(requestUrl),
        adblockplus.RegExpFilter.typeMap.DOCUMENT,
        adblockplus.getDecodedHostname(requestUrl), false, null, false)
})

matchesContent = async(function* (url, tabUrl, frameUrl)
{
    var requestUrl = new URL(url)
    var docDomain = adblockplus.getDecodedHostname(new URL(frameUrl))
    var matcher = yield getMatcher()

    return matcher.matchesAny(
        adblockplus.stringifyURL(requestUrl),
        adblockplus.RegExpFilter.typeMap.OBJECT,
        docDomain,
        adblockplus.isThirdParty(requestUrl, docDomain), null, false)
})

matchesAny = async(function* (url, tabUrl, frameUrl)
{
    var match = yield matchesDocument(tabUrl)
    if (!match)
        match = yield matchesContent(url, tabUrl, frameUrl)

    return match
})
