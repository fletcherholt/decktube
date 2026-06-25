const functions = require('../util/functions')

let injectedStyles = {}
let ready = false;
let observer;

async function injectStyle(id, text) {
    await functions.waitForCondition(() => ready)

    const styleId = `vt-${id}`

    const existingStyle = document.getElementById(styleId)
    if (existingStyle) {
        existingStyle.remove()
    }

    const style = document.createElement('style')
    style.id = styleId;
    style.type = 'text/css'
    style.textContent = text;

    injectedStyles[id] = style;

    reinjectStylesheets()
}

function deleteStyle(id) {
    const styleId = `vt-${id}`
    const style = document.getElementById(styleId)

    delete injectedStyles[id];

    if (style) {
        style.remove()
    }
}

function reinjectStylesheets() {
    observer.disconnect()

    for (let style of Object.values(injectedStyles)) {
        document.head.appendChild(style)
    }

    observer.observe(document.head, { childList: true })
}

async function main() {
    await functions.waitForCondition(() => !!document.head)

    observer = new MutationObserver(() => {
        reinjectStylesheets()
    })

    observer.observe(document.head, { childList: true })

    ready = true;
}

main()

module.exports = {
    inject: injectStyle,
    delete: deleteStyle
}