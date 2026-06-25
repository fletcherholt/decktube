module.exports = () => {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F11') {
            e.stopImmediatePropagation()
        }
    }, true)
}