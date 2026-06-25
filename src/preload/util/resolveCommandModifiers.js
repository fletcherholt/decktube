const inputModifiers = []
const outputModifiers = []

let globalResolveCommand;

let interval = setInterval(() => {
    for (let key in window._yttv) {
        if (window._yttv[key]?.instance?.resolveCommand) {
            let resolveCommand = window._yttv[key].instance.resolveCommand;
            globalResolveCommand = (command) => {
                return window._yttv[key].instance.resolveCommand(command);
            }

            window._yttv[key].instance.resolveCommand = function (command) {
                for (let modifier of inputModifiers) {
                    command = modifier(command)
                    if (command === false) return true;
                }

                let output = resolveCommand.apply(this, [ command ])

                for (let modifier of outputModifiers) {
                    output = modifier(output)
                }

                return output;
            }

            clearInterval(interval)
            return;
        }
    }
}, 100)

function addInputModifier(func) {
    inputModifiers.push(func)
}

function addOutputModifier(func) {
    outputModifiers.push(func)
}

module.exports = {
    resolveCommand: (command) => {
        if (globalResolveCommand) {
            return globalResolveCommand(command);
        } else {
            throw new Error('resolveCommand doesn\'t exist yet, probably called too early');
        }
    },
    addInputModifier,
    addOutputModifier
}