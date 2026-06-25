const { ipcRenderer } = require('electron')
const controller = require('../util/controller')
const ui = require('../util/ui')
const localeProvider = require('../util/localeProvider')
const configManager = require('../config')
const config = configManager.get()

module.exports = async () => {
    const gamepadKeyCodeMap = {
        0:  13,
        1:  27,
        2:  170,
        4:  115,
        5:  116,
        6:  113,
        7:  114,
        8:  189,
        9:  187,
        10: 77,
        11: 'vt-settings',
        12: 38,
        13: 40,
        14: 37,
        15: 39,

        1012: 38,
        1014: 40,
        1011: 37,
        1013: 39
    }

    const fallbackKeyCode = 135;
    let hasPressedAnyButton = false;

    let runningOnSteam = await ipcRenderer.invoke('is-steam')
    if (runningOnSteam) {
        setTimeout(async () => {
            if (!hasPressedAnyButton) {
                await localeProvider.waitUntilAvailable()

                const locale = localeProvider.getLocale()
                ui.toast('DeckTube', locale.general.steam_controller_notice)
            }
        }, 15000)
    }

    controller.on('down', (e) => {
        hasPressedAnyButton = true;

        let keyCode = gamepadKeyCodeMap[e.code]
        if (!keyCode) keyCode = fallbackKeyCode;

        simulateKeyDown(keyCode)
    })

    controller.on('up', (e) => {
        let keyCode = gamepadKeyCodeMap[e.code]
        if (!keyCode) keyCode = fallbackKeyCode;

        simulateKeyUp(keyCode)
    })

    function simulateKeyDown(keyCode) {
        if (!config.controller_support) return;

        if (keyCode === 'vt-settings') {
            if (window.vtToggleSettingsOverlay) {
                window.vtToggleSettingsOverlay()
            }

            return;
        }

        let event = new Event('keydown')
        event.keyCode = keyCode;
        document.dispatchEvent(event)
    }

    function simulateKeyUp(keyCode) {
        if (!config.controller_support) return;

        if (keyCode === 'vt-settings') {
            return;
        }

        let event = new Event('keyup')
        event.keyCode = keyCode;
        document.dispatchEvent(event)
    }
}