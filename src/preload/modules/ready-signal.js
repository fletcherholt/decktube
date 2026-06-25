const { ipcRenderer } = require('electron')

module.exports = () => {
    let sent = false;

    function fire() {
        if (sent) return;
        sent = true;
        setTimeout(() => ipcRenderer.send('leanback-ready'), 1500)
    }

    if (document.readyState === 'complete') {
        fire()
    } else {
        window.addEventListener('load', fire, { once: true })
    }
}
