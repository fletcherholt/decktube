const { ipcRenderer } = require('electron')
const configManager = require('../config')

const config = configManager.get()

module.exports = () => {
    let lastState = null;

    setInterval(() => {
        let blocking = false;

        if (config.keep_awake) {
            let video = document.querySelector('video')
            blocking = !!(video && !video.paused && !video.ended && video.readyState > 2)
        }

        if (blocking !== lastState) {
            lastState = blocking;
            ipcRenderer.invoke('set-keep-awake', blocking).catch(() => {})
        }
    }, 2000)
}
