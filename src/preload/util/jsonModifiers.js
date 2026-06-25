const modifiers = []
const jsonParse = JSON.parse;

JSON.parse = (...args) => {
    let json = jsonParse.apply(this, args)

    try {
        if (typeof json === 'object') {
            for (let modifier of modifiers) {
                json = modifier(json)
            }
        }

        return json;
    } catch (err) {
        console.error('a json modifier failed', err)
        return json;
    }
}

function addModifier(func) {
    modifiers.push(func)
}

module.exports = {
    addModifier
}