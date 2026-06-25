const css = require('../util/css')
const functions = require('../util/functions')
const configManager = require('../config')

const config = configManager.get()

const STEPS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

module.exports = async () => {
    const el = functions.el;
    await functions.waitForCondition(() => !!document.body)

    css.inject('playback-speed', `
        #vt-speed-indicator {
            position: fixed;
            top: 3vh;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.82);
            color: #fff;
            font-family: "YouTube Sans", "Roboto", sans-serif;
            font-size: 2.4vh;
            font-weight: 600;
            padding: 1.2vh 2.4vh;
            border-radius: 1vh;
            border-left: 0.4vh solid #ff0000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
            z-index: 9999;
        }
        #vt-speed-indicator.visible { opacity: 1; }
    `)

    const indicator = el('div', { id: 'vt-speed-indicator' }, [ el('span', { id: 'vt-speed-text' }) ])
    document.body.appendChild(indicator)

    let speed = STEPS.includes(config.playback_speed) ? config.playback_speed : 1;
    let hideTimeout;

    function isWatching() {
        let baseUri = window.yt?.player?.utils?.videoElement_?.baseURI;
        return !!baseUri && baseUri.includes('/watch?v=');
    }

    function apply() {
        let video = document.querySelector('video')
        if (video && video.playbackRate !== speed) {
            video.playbackRate = speed;
        }
    }

    function show() {
        const text = document.getElementById('vt-speed-text')
        if (text) text.textContent = `${speed}x`;
        indicator.classList.add('visible')
        clearTimeout(hideTimeout)
        hideTimeout = setTimeout(() => indicator.classList.remove('visible'), 1500)
    }

    function setSpeed(next) {
        speed = Math.max(STEPS[0], Math.min(STEPS[STEPS.length - 1], next))
        if (config.playback_speed !== speed) {
            configManager.set({ playback_speed: speed })
        }
        apply()
        show()
    }

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey || !isWatching()) return;

        let idx = STEPS.indexOf(speed)
        if (idx === -1) idx = STEPS.indexOf(1)

        if (e.key === ']' || e.key === '.' || e.key === '>') {
            setSpeed(STEPS[Math.min(STEPS.length - 1, idx + 1)])
        } else if (e.key === '[' || e.key === ',' || e.key === '<') {
            setSpeed(STEPS[Math.max(0, idx - 1)])
        } else if (e.key === '\\') {
            setSpeed(1)
        } else {
            return;
        }

        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
    }, true)

    setInterval(apply, 1000)
}
