const { ipcRenderer } = require('electron')
const functions = require('../util/functions')
const localeProvider = require('../util/localeProvider')

module.exports = async () => {
    await localeProvider.waitUntilAvailable()
    const locale = localeProvider.getLocale()

    async function prompt(opts) {
        await functions.waitForCondition(() => !!window.vtShowPrompt)
        window.vtShowPrompt(opts)
    }

    ipcRenderer.on('dt-update-available', (event, version) => {
        prompt({
            title: locale.update.available_title,
            message: locale.update.available_message.replace('{version}', version),
            confirm: locale.update.update_now,
            cancel: locale.update.later,
            onConfirm: () => ipcRenderer.invoke('dt-download-update')
        })
    })

    ipcRenderer.on('dt-update-downloaded', () => {
        prompt({
            title: locale.update.ready_title,
            message: locale.update.ready_message,
            confirm: locale.update.restart_now,
            cancel: locale.update.later,
            onConfirm: () => ipcRenderer.invoke('dt-install-update')
        })
    })
}
