toggleSession = async(function* (url, enable)
{
    var {hostname} = new URL(url)
    var sessions = yield getValue({sessions: []})
    var index = sessions.indexOf(hostname)
    var includes = index != -1

    if (enable ? !includes: includes)
    {
        if (includes)
            sessions.splice(index, 1)
        else
            sessions.push(hostname)

        yield storageSet({sessions})

        return true
    }
})

toggleFilter = async(function* (url, enabled, details = {})
{
    var {type = '', area = 'site'} = details
    var lines = []

    var uri = new URL(url)
    var docOrigin = adblockplus.getDecodedHostname(uri)
    var mask = adblockplus.RegExpFilter.typeMap.DOCUMENT

    var matcher = yield getMatcher()
    var list = type == '' ? matcher.blacklist: matcher.whitelist
    var match = list.matchesAny(url, mask, docOrigin)

    while (match)
    {
        lines.push(match.text)
        list.remove(match)
        match = list.matchesAny(url, mask, docOrigin)
    }

    if (!enabled ? lines.length < 1 :lines.length > 0)
    {
        lines.splice(0)
    }
    else
    {
        let filters = yield getValue({filters: ''})
        if (!lines.length)
        {
            let host = ''
            let path = ''
            if (area == 'site') {
                host = uri.hostname
            }
            else {
                host = uri.host
                path = uri.pathname.length > 1 ? uri.pathname: ''
            }
            let text = `${type}||${host.replace(/^www\./, '')}${path}^$document`
            filters = `${text}\n${filters}`.trim()

            lines.splice(0)
            lines.push(text)
        }
        else
        {
            filters = removeLines(filters, ['', ...lines])
        }

        yield storageSet({filters})
    }

    return lines
})
