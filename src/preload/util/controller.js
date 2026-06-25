const { ipcRenderer } = require('electron')
const { EventEmitter } = require('tseep/lib/ee-safe')

const emitter = new EventEmitter()

const buttonRepeatInterval = 100;
const buttonRepeatDelay = 500;

const pressedButtons = {}
let buttonRepeatTimeout;
let hasPressedButton = false;

let focused = true;

ipcRenderer.on('focus', () => {
    focused = true;
})

ipcRenderer.on('blur', () => {
    focused = false;
})

requestAnimationFrame(pollGamepads)

function pollGamepads() {
    const gamepads = navigator.getGamepads()
    for (let index in pressedButtons) {
        if (!gamepads[index]) pressedButtons[index] = null;
    }

    const steamInput = gamepads.find(g => g && g.id.endsWith('(STANDARD GAMEPAD Vendor: 28de Product: 11ff)'))
    if (steamInput) {
        handleGamepad(steamInput)
    } else {
        for (let gamepad of gamepads) {
            if (gamepad && gamepad.connected) handleGamepad(gamepad)
        }
    }

    requestAnimationFrame(pollGamepads)
}

function handleGamepad(gamepad) {
    const index = gamepad.index;
    if (!pressedButtons[index]) pressedButtons[index] = {}

    for (let i = 0; i < gamepad.buttons.length; i++) {
        let code = i;

        let button = gamepad.buttons[i]
        let buttonWasPressed = pressedButtons[index][i]

        if (button.pressed && !buttonWasPressed) {
            hasPressedButton = true;
            pressedButtons[index][i] = true;
            buttonDown(code)
            stopKeyRepeat()
            buttonRepeatTimeout = setTimeout(() => startButtonRepeat(code), buttonRepeatDelay)
        } else if (!button.pressed && buttonWasPressed) {
            pressedButtons[index][i] = false;
            buttonUp(code)
            stopKeyRepeat()
        }
    }

    for (let i = 0; i < gamepad.axes.length; i++) {
        let axisValue = gamepad.axes[i]
        let axisIndex = i + gamepad.buttons.length;
        let axisWasPressed = pressedButtons[index][axisIndex]

        let code = null;

        if (i === 0) {
            if (axisValue > 0.5) {
                code = 1013;
            } else if (axisValue < -0.5) {
                code = 1011;
            }
        } else if (i === 1) {
            if (axisValue > 0.5) {
                code = 1014;
            } else if (axisValue < -0.5) {
                code = 1012;
            }
        } if (i === 3) {
            if (axisValue > 0.5) {
                keyCode = 1017;
            } else if (axisValue < -0.5) {
                keyCode = 1015;
            }
        } else if (i === 4) {
            if (axisValue > 0.5) {
                keyCode = 1018;
            } else if (axisValue < -0.5) {
                keyCode = 1016;
            }
        }

        if (code) {
            if (!axisWasPressed) {
                hasPressedButton = true;
                pressedButtons[index][axisIndex] = true;
                buttonDown(code)
                stopKeyRepeat()
                buttonRepeatTimeout = setTimeout(() => startButtonRepeat(code), buttonRepeatDelay)
            }
        } else {
            if (axisWasPressed) {
                pressedButtons[index][axisIndex] = false;
                buttonUp(code)
                stopKeyRepeat()
            }
        }
    }
}

function buttonDown(code) {
    if (!focused) return;
    emitter.emit('down', { code })
}

function buttonUp(code) {
    if (!focused) return;
    emitter.emit('up', { code })
}

function startButtonRepeat(code) {
    clearInterval(buttonRepeatTimeout)
    clearTimeout(buttonRepeatTimeout)
    buttonRepeatTimeout = setInterval(() => buttonDown(code), buttonRepeatInterval)
}

function stopKeyRepeat() {
    clearInterval(buttonRepeatTimeout)
}

module.exports = emitter;