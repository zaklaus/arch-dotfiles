getPref('devtools_panel').then(enabled => {
    if (enabled) {
        chrome.devtools.panels.create(
            'Flashcontrol',
            'skin/48.png',
            'skin/devpanel.html'
        )
    }
})
