patch_900 = async(function* ()
{
    function fix(str) {
        str = str.replace(/^(.+:\/+)?/, 'http://')
        var parts = splitUrl(str)
        if (parts.query) parts.path += `?${parts.query}`
        parts.auth = parts.auth.replace(/^www\./, '')
        assert(parts.auth || parts.path || parts.query, 'Invalid url')
        assert(!parts.auth.startsWith('.') && !parts.auth.endsWith('.'), 'Bad host')
        return parts
    }

    function parse(str, docUrl) {
        if (str.startsWith('/') && str.endsWith('/')) return str
        var {auth, path} = fix(str)
        if (docUrl != null) auth = fix(docUrl).auth
        if (auth) auth = `||${auth}`
        var text = auth + path
        if (!path) text += '^'
        return text
    }

    function parseDocs(list, prefix = '') {
        return list.map(({enabled, pattern}) => {
            try {
                var text = parse(pattern) + '$document'
                return `${!enabled ? '!': ''}${prefix}${text}`
            } catch(err) {
                return `! ${err} ${pattern}`
            }
        })
    }

    function parseObjects(list, prefix = '') {
        return list.map(({root, patterns, enabled}) => {
            return patterns.map(({pattern}) => {
                try {
                    var text = parse(pattern)
                    var {auth} = fix(root)
                    if (auth) text += `$domain=${auth}`
                    return `${!enabled ? '!': ''}${prefix}${text}`
                } catch(err) {
                    return `! ${err} ${root} ${pattern}`
                }
            }).join('\n')
        })
    }

    function parseHosts(list, prefix = '') {
        return list.map(({root, patterns, enabled}) => {
            return patterns.map(({pattern}) => {
                try {
                    var text = parse(pattern, root)
                    return `${!enabled ? '!': ''}${prefix}${text}`
                } catch(err) {
                    return `! ${err} ${root} ${pattern}`
                }
            }).join('\n')
        })
    }

    var oldFilters = {
        'data.patternlistA': [],
        'data.patternlistB': [],
        'data.patternlistC': [],
        'data.patternlistD': [],
        'data.patternlistE': [],
        'data.patternlistF': []}
    var oldPrefs = [
        'prefs.panelbgimage',
        'prefs.panelcolor',
        'prefs.plugincounter',
        'prefs.toolbar',
        'prefs.defaultmode']

    var filters = yield storageGet(oldFilters).then(data => {
        var text = [
            ...parseDocs(data['data.patternlistC']),
            ...parseObjects(data['data.patternlistD']),
            ...parseHosts(data['data.patternlistF']),
            ...parseDocs(data['data.patternlistA'], '@@'),
            ...parseObjects(data['data.patternlistB'], '@@'),
            ...parseHosts(data['data.patternlistE'], '@@')
        ]
        text = text.join('\n')
        text = removeLines(text, [''])
        return text
    })

    var prefs = yield storageGet(oldPrefs).then(data => {
        var details = {}
        if (Array.isArray(data['prefs.panelcolor'])) {
            let color = '#'
            for (let c of data['prefs.panelcolor'].slice(0, 3)) {
                c = c.toString(16)
                color += c.length == 1 ? c + c: c
            }
            details.placeholder_color = color
        }
        if (data['prefs.panelbgimage']) {
            let image = data['prefs.panelbgimage']
            if (image == 'flashlogo.svg')
                details.placeholder_icon = image
        }
        if (data['prefs.plugincounter']) {
            details.badge_counter = true
        }
        if (data['prefs.toolbar']) {
            details.player_reblock = true
        }
        if (data['prefs.defaultmode']) {
            details.default_behavior = 'whitelist'
        }
        return details
    })

    yield storageClear()
    yield storageSet({filters})
    yield clearPrefs()
    yield setPrefs(prefs)
})

function patch_90378() {
    return setPrefs({menu_indicator : true})
}

chrome.runtime.onInstalled.addListener(function(details)
{
    var {reason, previousVersion} = details
    if (reason == 'update') {
        let updates = []
        if (previousVersion < '9.0.0')
            updates.push(patch_900)
        if (previousVersion <= '9.0.378')
            updates.push(patch_90378)
        updates.reduce((a, b) => a.then(b), Promise.resolve())
    }
})
