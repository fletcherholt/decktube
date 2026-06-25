const rcMod = require('../util/resolveCommandModifiers')

module.exports = () => {
    rcMod.addInputModifier((command) => {
        if (!command.commandExecutorCommand || !command.commandExecutorCommand.commands) return command;

        let exitCommand = command.commandExecutorCommand.commands.find(c => c.signalAction?.signal === 'EXIT_APP')
        if (!exitCommand) return command;

        window.close()
        return false;
    })
}