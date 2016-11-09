/*
 * options panel
 */
var OptionsPanel = Object.create(HTMLElement.prototype)

OptionsPanel.createdCallback = function() {
    var navigation = this.appendChild($x('nav'))
    navigation.appendChild($x('ol')).addEventListener('click', this)
    this.appendChild($x('div'))
    this.widgets = new Map()
}

OptionsPanel.handleEvent = function(event) {
    var {target, currentTarget} = event
    if (target === currentTarget) return
    for (let el of this.widgets) {
        if (el[0] === target) {
            el[0].classList.add('selected')
            el[1].hidden = false
        } else {
            el[0].classList.remove('selected')
            el[1].hidden = true
        }
    }
}

OptionsPanel.addPanel = function(name, panel) {
    var tab = $x('li', {innerText: name})
    $('ol', this.firstElementChild).appendChild(tab)
    var section = $x('section', {hidden: true})
    section.appendChild(panel)
    this.lastElementChild.appendChild(section)
    this.widgets.set(tab, section)
    if (this.widgets.size == 1) {
        tab.classList.add('selected')
        section.hidden = false
    }
    return section
}

document.registerElement('options-panel', {prototype: OptionsPanel})

var optionsMap = new Map()
var optionsPanel = $('options-panel')

function localize(target)
{
    for (var el of $$('[i18n]', target))
        el.innerHTML = i18nMessage(el.attributes.i18n.value)
}

function handleChange(event)
{
    var {target} = event
    var {type, key} = optionsMap.get(target)
    var newVal = null

    if (type == 'checkbox') newVal = target.checked
    else if (type == 'radio') newVal = target.value
    else if (type == 'select') newVal = target.options[target.selectedIndex].value
    else if (type == 'color') newVal = target.value

    if (newVal != null)
        setPrefs({[key]: newVal})
}

function createOption(setting)
{
    var el = $x('div')
    el.onchange = handleChange

    var input
    var {type, key, description} = setting
    if (type == 'checkbox')
    {
        input = $x('input', {type: 'checkbox', id: key})

        let label = $x('label')
        let span = $x('span', {innerText: description})
        label.appendChild(input)
        label.appendChild(span)
        el.appendChild(label)
        el.classList.add('checkbox')
    }
    else if (type == 'radio')
    {
        let {value} = setting
        input = $x('input', {type: 'radio', name: key, value})

        let label = $x('label')
        let span = $x('span', {innerText: description})
        label.appendChild(input)
        label.appendChild(span)
        el.appendChild(label)
        el.classList.add('checkbox')
    }
    else if (type == 'select')
    {
        input = $x('select', {id: key})

        let {options} = setting
        options.forEach((opt, index) =>
        {
            var option = $x('option', {innerText: opt.label, value: opt.value})
            input.appendChild(option)
        })

        let span = $x('span', {innerText: `${description}:`})
        el.appendChild(span)
        el.appendChild(input)
        el.classList.add('settings-row')
    }
    else if (type == 'color')
    {
        input = $x('input', {id: setting.key, type: 'color'})

        let span = $x('span', {innerText: `${setting.description}:`})
        el.appendChild(span)
        el.appendChild(input)
        el.classList.add('settings-row')
    }

    optionsMap.set(input, setting)

    return el
}

function showDialog(id)
{
    var dialog = $(`dialog#${id}`)
    localize(dialog)

    var button = $('button', dialog)
    button.onclick = () => dialog.close()
    button.focus()

    for (let current of $$('dialog[open]'))
        current.close()
    dialog.showModal()
}

function saveTextarea(str = '')
{
    var textarea = $('#exceptions textarea')
    var value = textarea.value

    var filters = removeLines(value, ['', str])
    filters = `${filters}\n${str}`.trim()

    return storageSet({filters})
}

function generatePattern()
{
    var input = $('#exceptions .input-box input').value
    input = input.trim().replace(/^(.+:\/+)?/, 'http://')

    var {auth} = splitUrl(input)
    var pattern = auth.trim()
    if (pattern) pattern = `@@||${pattern}^$document`

    return pattern
}

function initOptionsPanel()
{
    let options =
    [
        $x('h3', {innerText: i18nMessage('browsing')}),
        createOption({
            type: 'radio',
            description: i18nMessage('choose_content'),
            key: 'default_behavior',
            value: 'replace'
        }),
        createOption({
            type: 'radio',
            description: i18nMessage('run_content'),
            key: 'default_behavior',
            value: 'whitelist'
        }),

        $x('h3', {innerText: i18nMessage('content')}),
        createOption({
            type: 'checkbox',
            description: i18nMessage('flash_count'),
            key: 'badge_counter'
        }),
        createOption({
            type: 'checkbox',
            description: i18nMessage('green_icon'),
            key: 'menu_indicator'
        }),
        createOption({
            type: 'checkbox',
            description: i18nMessage('reblock_buttons'),
            key: 'player_reblock'
        }),

        // WARN chrome 49 bug renders select drop-down offscreen
        createOption({
            type: 'select',
            description: i18nMessage('icon_label'),
            key: 'placeholder_icon',
            options: [
                {label: i18nMessage('plugin_logo'), value: 'pluginlogo.svg'},
                {label: i18nMessage('flash_logo'), value: 'flashlogo.svg'},
                {label: i18nMessage('no_logo'), value: ''}
            ]
        }),
        createOption({
            type: 'color',
            description: i18nMessage('color_label'),
            key: 'placeholder_color'
        }),

        $x('h3', {innerText: i18nMessage('tools')}),
        createOption({
            type: 'checkbox',
            description: i18nMessage('context_menu'),
            key: 'context_menu'
        }),
        createOption({
            type: 'checkbox',
            description: i18nMessage('devtools_panel'),
            key: 'devtools_panel'
        })
    ]

    var toolbar = $x('div', {className: 'bottom-bar'})
    toolbar.appendChild($x('button', {id: 'reset_settings', onclick: clearPrefs, innerText: i18nMessage('reset_settings')}))
    options.push(toolbar)

    var fragment = document.createDocumentFragment()
    for (let opt of options)
        fragment.appendChild(opt)

    optionsPanel.addPanel(i18nMessage('settings'), fragment)
}

function initExceptionsPanel()
{
    var fragment = document.createDocumentFragment()
    fragment.appendChild($x('h3', {innerText: i18nMessage('allow_label')}))
    fragment.appendChild($x('span', {innerText: i18nMessage('whitelist_url')}))

    var inputbox = $x('div', {className: 'input-box'})
    var input = inputbox.appendChild($x('input', {spellcheck: false}))
    inputbox.appendChild($x('button', {innerText: i18nMessage('add_button')}))
    fragment.appendChild(inputbox)
    inputbox.onclick = inputbox.onkeyup = event => {
        var {type, target, code} = event
        if (target == inputbox) return
        if ((type == 'keyup' && code == 'Enter') ||
            (type == 'click' && target instanceof HTMLButtonElement)) {
            let pattern = generatePattern()
            if (pattern) saveTextarea(pattern).then(() => input.value = '')
        }
    }

    var filters = $x('div')
    var span = $x('span', {innerHTML: i18nMessage('filters_added')})
    $('a', span).onclick = () => showDialog('syntax-dialog')
    filters.appendChild(span)

    fragment.appendChild($x('h3', {innerText: i18nMessage('rules_label')}))
    fragment.appendChild(filters)

    var readonly = localStorage.read_only_filters == 'true'
    var textarea = fragment.appendChild($x('textarea', {spellcheck: false, disabled: readonly}))
    textarea.addEventListener('input', () => save.disabled = false)
    textarea.addEventListener('keydown', event => {
        var {ctrlKey, which} = event
        if (ctrlKey && which == 83) {
            event.preventDefault()
            save.click()
        }
    })

    var div = $x('div', {style: 'display:flex'})
    var cb = div.appendChild($x('div', {className: 'checkbox', style: 'flex-grow:1;'}))
    var label = cb.appendChild($x('label'))
    var checkbox = label.appendChild($x('input', {id: 'read_only', type: 'checkbox', checked: readonly}))
    label.appendChild($x('span', {innerText: i18nMessage('readonly_label')}))
    var save = div.appendChild($x('button', {id: 'save_filters', innerText: i18nMessage('save_button'), disabled: true}))
    save.onclick = event => saveTextarea().then(() => save.disabled = true)
    checkbox.onchange = () => {
        var readonly = checkbox.checked
        localStorage.read_only_filters = readonly
        textarea.disabled = readonly
    }
    fragment.appendChild(div)

    var panel = optionsPanel.addPanel(i18nMessage('exceptions'), fragment)
    panel.id = 'exceptions'
}

function initAboutPanel()
{
    var fragment = document.createDocumentFragment()
    var el = $x('div')
    var {version} = chrome.runtime.getManifest()
    el.appendChild($x('div', {innerText: `Flashcontrol ${version}`}))
    el.appendChild($x('div', {innerText: navigator.plugins['Shockwave Flash'].description, className: 'flash-version'}))
    el.appendChild($x('div', {innerHTML: i18nMessage('about_license')}))
    el.appendChild($x('div', {innerHTML: i18nMessage('about_engine')}))
    el.appendChild($x('div', {innerHTML: i18nMessage('about_contribute')}))
    fragment.appendChild(el)
    optionsPanel.addPanel(i18nMessage('about'), fragment)
}

updateSettings = async(function* ()
{
    var prefs = yield loadPrefs()
    optionsMap.forEach((setting, el) =>
    {
        var {key, type} = setting
        if (key in prefs)
        {
            let val = prefs[key]
            if (type == 'checkbox')
            {
                $(`#${key}`).checked = val
            }
            else if (type == 'radio')
            {
                let el = $$(`[name=${key}]`)
                el = el.find(e => e.value == val)
                el.checked = true
            }
            else if (type == 'color')
            {
                $(`#${key}`).value = val
            }
            else if (type == 'select')
            {
                let el = $(`#${key}`)
                el.selectedIndex = Array.from(el.options)
                    .findIndex(o => o.value == val)
            }
        }
    })
})

updateFilters = async(function* ()
{
    var text = yield getValue({filters: ''})
    $('#exceptions textarea').value = text
})

run(function* ()
{
    if (localStorage.first_run == null) {
        localStorage.first_run = true
        localStorage.read_only_filters = true
        setTimeout(() => showDialog('firstrun-dialog'), 1000)
    }

    initOptionsPanel()
    initExceptionsPanel()
    initAboutPanel()

    yield updateSettings()
    yield updateFilters()
})

chrome.storage.onChanged.addListener(function(changes, area)
{
    if (changes.filters) updateFilters()
    if (changes.prefs) updateSettings()
})
