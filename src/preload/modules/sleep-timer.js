const { ipcRenderer } = require('electron')
const ui = require('../util/ui')
const localeProvider = require('../util/localeProvider')
const configManager = require('../config')

module.exports = async () => {
    await localeProvider.waitUntilAvailable()
    const locale = localeProvider.getLocale()

    let config = configManager.get()
    let timer = null;
    let endedHandler = null;

    if (config.sleep_timer && config.sleep_timer !== 'off') {
        configManager.set({ sleep_timer: 'off' })
        config = configManager.get()
    }

    function pausePlayback() {
        document.querySelectorAll('video').forEach(v => {
            try { v.pause() } catch {}
        })
        try { ui.toast('DeckTube', locale.settings.sleep_timer.fired) } catch {}
    }

    function disarm() {
        if (timer) { clearTimeout(timer); timer = null; }
        if (endedHandler) {
            let video = document.querySelector('video')
            if (video) video.removeEventListener('ended', endedHandler)
            endedHandler = null;
        }
    }

    function arm(value) {
        disarm()
        if (!value || value === 'off') return;

        if (value === 'video') {
            let video = document.querySelector('video')
            if (!video) return;
            endedHandler = () => { pausePlayback(); configManager.set({ sleep_timer: 'off' }) }
            video.addEventListener('ended', endedHandler, { once: true })
        } else {
            let minutes = parseInt(value)
            if (isNaN(minutes)) return;
            timer = setTimeout(() => {
                pausePlayback()
                configManager.set({ sleep_timer: 'off' })
            }, minutes * 60 * 1000)
        }
    }

    ipcRenderer.on('config-update', (event, newConfig) => {
        let changed = newConfig.sleep_timer !== config.sleep_timer;
        config = newConfig;
        if (changed) arm(config.sleep_timer)
    })
}
