const { ipcRenderer } = require('electron')
const configManager = require('../config')
const css = require('../util/css')
const themes = require('../themes')

let config = configManager.get()

function apply(themeId) {
    const theme = themes.find(t => t.id === themeId)

    if (!theme || !theme.css) {
        css.delete('theme')
        return;
    }

    css.inject('theme', theme.css)
    console.log(`[Themes] Applied: ${theme.id}`)
}

module.exports = () => {
    apply(config.theme)

    ipcRenderer.on('config-update', (event, newConfig) => {
        const changed = newConfig.theme !== config.theme;
        config = newConfig;
        if (changed) apply(config.theme)
    })
}
