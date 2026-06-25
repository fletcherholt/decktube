const { ipcRenderer } = require('electron')
const rcMod = require('../util/resolveCommandModifiers')

module.exports = () => {
    rcMod.addInputModifier((command) => {
        if (!command.signalAction || !command.signalAction.signal || command.signalAction.signal !== 'RELOAD_PAGE') return command;

        ipcRenderer.invoke('reload')
        return false;
    })
}