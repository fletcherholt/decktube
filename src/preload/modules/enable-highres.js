const { ipcRenderer } = require('electron')
const functions = require('../util/functions')

module.exports = () => {
    window.addEventListener('load', async () => {
        ipcRenderer.invoke('set-zoom', -10)
        await functions.waitForSelector('.html5-main-video')
        ipcRenderer.invoke('set-zoom', 0)
    })
}