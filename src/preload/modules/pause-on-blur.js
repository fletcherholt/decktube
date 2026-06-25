const { ipcRenderer } = require('electron')
const configManager = require('../config')
const rcMod = require('../util/resolveCommandModifiers')

module.exports = () => {
    let config = configManager.get()

    document.addEventListener('visibilitychange', (e) => {
        e.stopImmediatePropagation()
    })

    document.addEventListener('webkitvisibilitychange', (e) => {
        e.stopImmediatePropagation()
    })

    ipcRenderer.on('blur', () => {
        if (!config.pause_on_blur) return;

        rcMod.resolveCommand({
            commandMetadata: {
                webCommandMetadata: {
                    clientAction: true
                }
            },
            playerControlAction: {
                playerControlType: 'PLAYER_CONTROL_ACTION_TYPE_PAUSE',
                userInitiated: true
            }
        })
    })
}