module.exports = () => {
    const ESCAPE_KEYCODE = 27;

    let visible = true;
    let lastUse = 0;

    window.addEventListener('wheel', (e) => {
        e.preventDefault()
    }, { passive: false, capture: true })

    window.addEventListener('mousedown', (e) => {
        if (e.button === 2) {
            simulateKeyDown(ESCAPE_KEYCODE)
            setTimeout(() => simulateKeyUp(ESCAPE_KEYCODE), 50)
        }
    })

    function simulateKeyDown(keyCode) {
        let event = new Event('keydown')
        event.keyCode = keyCode;
        document.dispatchEvent(event)
    }

    function simulateKeyUp(keyCode) {
        let event = new Event('keyup')
        event.keyCode = keyCode;
        document.dispatchEvent(event)
    }

    setInterval(() => {
        if (!visible) return;
        if ((Date.now() - lastUse) >= 3000) {
            hideCursor()
        }
    }, 20)

    window.addEventListener('mousemove', () => {
        lastUse = Date.now()
        showCursor()
    })

    window.addEventListener('mousedown', () => {
        lastUse = Date.now()
        showCursor()
    })

    function showCursor() {
        document.documentElement.style.cursor = 'default'
        visible = true;
    }

    function hideCursor() {
        document.documentElement.style.cursor = 'none'
        visible = false;
    }
}