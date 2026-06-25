const electron = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const fs = require('fs')
const minimist = require('minimist')
const stringArgv = require('string-argv')
const package = require('../package.json')

const appId = package.build?.appId || 'io.github.fletcherholt.DeckTube'

const argv = minimist(process.argv)

electron.app.setName('DeckTube')

let userData = electron.app.getPath('userData')

let portablePath = portable()
if (portablePath) {
    electron.app.setPath('userData', portablePath)
    userData = electron.app.getPath('userData')
}

const sessionData = path.join(userData, 'sessionData')
electron.app.setPath('sessionData', sessionData)

const configManager = require('./config.js')
const permissions = require('./permissions.js')
const userstyles = require('./userstyles.js')

const youtubeUserAgent = `Mozilla/5.0 (PS4; Leanback Shell) Cobalt/26.lts.0-qa; compatible; DeckTube/${package.version}`
const youtubeClientUserAgent = `Mozilla/5.0 (PS4; Leanback Shell) Cobalt/19.lts.0-qa; compatible; DeckTube/${package.version}`
const userAgent = `DeckTube/${package.version}`

const youtubeUrl = 'https://www.youtube.com/tv'
const runningOnSteam = process.env.SteamOS === '1' && process.env.SteamGamepadUI === '1'

let win;
let splashWin;
let config;

async function main() {
    if (argv['version'] || argv['v']) {
        process.stdout.write(`DeckTube ${package.version}\n`, () => {
            process.exit(0)
        })

        return;
    }

    if (runningOnSteam) {
        electron.app.commandLine.appendSwitch('--no-sandbox')
    }

    electron.app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')

    config = configManager.init(runningOnSteam ? {

        fullscreen: true,
        h264ify: true,
        h264ify_disable_webm: false,
        h264ify_disable_vp8: false,
        h264ify_disable_vp9: false,
        h264ify_disable_av1: true
    } : {})

    if (process.platform === 'linux' && !config.wayland_hdr) {
        electron.app.commandLine.appendSwitch('--disable-features', 'WaylandWpColorManagerV1')
    }

    if (!config.hardware_decoding) {
        electron.app.commandLine.appendSwitch('--disable-accelerated-video-decode')
    }

    if (runningOnSteam) {

        electron.app.commandLine.appendSwitch('ignore-gpu-blocklist')
        electron.app.commandLine.appendSwitch('enable-gpu-rasterization')
        electron.app.commandLine.appendSwitch('enable-zero-copy')
    }

    const flagsPath = path.join(userData, 'flags.txt')
    if (fs.existsSync(flagsPath)) {
        let extraFlags = fs.readFileSync(flagsPath, 'utf-8').trim()
        let arg = stringArgv.parseArgsStringToArgv(extraFlags)
        let parsed = minimist(arg)

        for (let [ key, value ] of Object.entries(parsed)) {
            if (key === '_') {
                continue;
            }

            electron.app.commandLine.appendSwitch(key, value)
        }
    }

    electron.app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') electron.app.quit()
    })

    electron.app.on('before-quit', () => {
        configManager.save()
    })

    await electron.app.whenReady()

    autoUpdater.checkForUpdatesAndNotify()
    permissions.setup({ appId })

    electron.session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        let url = new URL(details.url)
        if (url.host === 'csp.withgoogle.com') return callback({ cancel: true });

        callback({ cancel: false })
    })

    electron.session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        let url = new URL(details.url)
        if (url.host !== 'www.youtube.com') return callback({ cancel: false });

        delete details.responseHeaders['content-security-policy-report-only'];

        if (details.responseHeaders['content-security-policy']) {
            for (let i = 0; i < details.responseHeaders['content-security-policy'].length; i++) {
                let header = details.responseHeaders['content-security-policy'][i]

                let trustedTypesPattern = /require-trusted-types-for\s+'script'/
                let trustedTypesMatch = header.match(trustedTypesPattern)
                if (trustedTypesMatch) {
                    header = header.replace(/require-trusted-types-for\s+'script';?\s*/g, '')
                }

                let styleSrcPattern = /style-src\s([^;]*)/
                let styleSrcMatch = header.match(styleSrcPattern)
                if (styleSrcMatch) {
                    let existing = styleSrcMatch[1]

                    let withoutNonces = existing.replace(/'nonce-[^']*'/g, '').trim()
                    let updated = `style-src ${withoutNonces} 'unsafe-inline' data: *`
                    header = header.replace(styleSrcPattern, updated)
                }

                let fontSrcPattern = /font-src\s([^;]*)/
                let fontSrcMatch = header.match(fontSrcPattern)
                if (fontSrcMatch) {
                    let existing = fontSrcMatch[1]
                    let updated = `font-src ${existing} * data:`
                    header = header.replace(fontSrcPattern, updated)
                }

                let connectPattern = /connect-src\s([^;]*)/
                let connectMatch = header.match(connectPattern)
                if (connectMatch) {
                    let existing = connectMatch[1]
                    let additions = 'sponsor.ajay.app returnyoutubedislikeapi.com data:'
                    let updated = `connect-src ${existing} ${additions}`
                    header = header.replace(connectPattern, updated)
                }

                let imgPattern = /img-src\s([^;]*)/
                let imgMatch = header.match(imgPattern)
                if (imgMatch) {
                    let existing = imgMatch[1]
                    let additions = 'dearrow-thumb.ajay.app raw.githubusercontent.com data:'
                    let updated = `img-src ${existing} ${additions}`
                    header = header.replace(imgPattern, updated)
                }

                details.responseHeaders['content-security-policy'][i] = header;
            }
        }

        callback({
            responseHeaders: details.responseHeaders
        })
    })

    electron.session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        let url = new URL(details.url)
        if (url.host === 'www.youtube.com') {
            details.requestHeaders['User-Agent'] = youtubeUserAgent;
        } else {
            details.requestHeaders['User-Agent'] = userAgent;
        }

        callback({
            requestHeaders: details.requestHeaders
        })
    })

    electron.ipcMain.on('get-config', (event) => {
        event.returnValue = config;
    })

    electron.ipcMain.on('set-config', (event, newConfig) => {
        configManager.update(newConfig)
        config = configManager.get()

        if (win) {
            win.webContents.send('config-update', config)
        }

        event.returnValue = config;
    })

    electron.ipcMain.handle('is-focused', () => {
        if (win) {
            return win.isFocused();
        } else {
            return false;
        }
    })

    electron.ipcMain.handle('is-steam', () => {
        return runningOnSteam;
    })

    electron.ipcMain.handle('reload', () => {
        if (win) {
            win.webContents.reload()
        }
    })

    electron.ipcMain.handle('set-fullscreen', (e, value) => {
        if (win) {
            win.setFullScreen(value)
        }
    })

    electron.ipcMain.handle('set-on-top', (e, value) => {
        if (win) {
            win.setAlwaysOnTop(value)
        }
    })

    electron.ipcMain.handle('set-zoom', (e, amount) => {
        if (win) {
            win.webContents.setZoomLevel(amount)
        }
    })

    electron.ipcMain.handle('get-deeplink', () => {
        let deeplink = argv._[argv._.length - 1]
        if (deeplink) {
            return deeplink;
        } else {
            return null;
        }
    })

    electron.ipcMain.handle('relaunch-app', () => {
        electron.app.relaunch()
        electron.app.quit()
    })

    let keepAwakeBlockerId = null;
    electron.ipcMain.handle('set-keep-awake', (e, on) => {
        if (on) {
            if (keepAwakeBlockerId === null || !electron.powerSaveBlocker.isStarted(keepAwakeBlockerId)) {
                keepAwakeBlockerId = electron.powerSaveBlocker.start('prevent-display-sleep')
            }
        } else if (keepAwakeBlockerId !== null && electron.powerSaveBlocker.isStarted(keepAwakeBlockerId)) {
            electron.powerSaveBlocker.stop(keepAwakeBlockerId)
            keepAwakeBlockerId = null;
        }
    })

    userstyles.setup({ userData, getWindow: () => win })

    await createWindow()

    userstyles.startWatcher()

    electron.app.on('activate', () => {
        if (electron.BrowserWindow.getAllWindows().length === 0) createWindow()
    })
}

async function createWindow() {
    let fullscreen = argv['fullscreen'] || runningOnSteam || config.fullscreen || false;
    let noWindowDecs = argv['no-window-decorations'] || config.no_window_decorations || false;

    const splashEnabled = config.splash && !argv['no-splash'] && !argv['debug-gpu'] && !argv['enable-devtools'];

    win = new electron.BrowserWindow({
        width: 1200,
        height: 675,
        backgroundColor: '#0f0f0f',
        show: false,
        fullscreen,
        fullscreenable: true,
        titleBarStyle: noWindowDecs ? 'hidden' : 'default',
        frame: noWindowDecs ? false : true,
        icon: './assets/icon.png',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: false,
            sandbox: false,
            backgroundThrottling: false,
            nodeIntegrationInSubFrames: true,
            preload: path.join(__dirname, 'preload/index.js')
        },
        title: 'DeckTube'
    })

    const [ outerW, outerH ] = win.getSize()
    const [ innerW, innerH ] = win.getContentSize()
    const extraWidth = outerW - innerW;
    const extraHeight = outerH - innerH;

    const TARGET_RATIO = 16 / 9;
    const isWindows = process.platform === 'win32'

    if (isWindows) {

        win.on('will-resize', (event, newBounds) => {
            event.preventDefault()

            const contentW = newBounds.width - extraWidth;
            const adjustedContentH = Math.round(contentW / TARGET_RATIO)

            win.setBounds({
                width: newBounds.width,
                height: adjustedContentH + extraHeight
            })
        })

        win.setBounds({
            width: outerW,
            height: Math.round((outerW - extraWidth) / TARGET_RATIO) + extraHeight
        })
    } else {

        win.setAspectRatio(TARGET_RATIO)
    }

    win.setMenuBarVisibility(false)
    win.setAutoHideMenuBar(false)

    let revealed = false;
    function revealMain() {
        if (revealed) return;
        revealed = true;

        win.setFullScreen(fullscreen)
        win.setAlwaysOnTop(config.keep_on_top)
        win.show()

        if (splashWin && !splashWin.isDestroyed()) {
            splashWin.webContents.executeJavaScript("document.body.classList.add('fade-out')").catch(() => {})
            setTimeout(closeSplash, 600)
        }
    }

    if (splashEnabled) {
        createSplash(fullscreen)

        const splashStart = Date.now()
        const SPLASH_MIN_MS = 4500;
        const SPLASH_CAP_MS = 12000;

        let leanbackReady = false;
        let minElapsed = false;
        const tryReveal = () => {
            if (leanbackReady && minElapsed) revealMain()
        }

        setTimeout(() => { minElapsed = true; tryReveal() }, SPLASH_MIN_MS)
        electron.ipcMain.once('leanback-ready', () => { leanbackReady = true; tryReveal() })
        setTimeout(revealMain, SPLASH_CAP_MS)
    } else {
        win.once('ready-to-show', revealMain)
    }

    if (argv['debug-gpu']) {
        console.log('Loading chrome://gpu')
        win.loadURL('chrome://gpu', { userAgent })
        return;
    }

    if (argv['enable-devtools']) {
        console.log('Launching with developer tools enabled')
        win.webContents.toggleDevTools()
    }

    console.log(`Loading ${youtubeUrl}`)
    win.loadURL(youtubeUrl, { userAgent: youtubeClientUserAgent })

    win.on('enter-full-screen', () => {
        configManager.update({ fullscreen: true })
        config = configManager.get()
        win.webContents.send('config-update', config)
    })

    win.on('leave-full-screen', () => {
        configManager.update({ fullscreen: false })
        config = configManager.get()
        win.webContents.send('config-update', config)
    })

    win.addListener('focus', () => {
        win.webContents.send('focus')
    })

    win.addListener('blur', () => {
        win.webContents.send('blur')
    })

    win.webContents.on('page-title-updated', () => {
        win.setTitle('DeckTube')
    })
}

function createSplash(fullscreen) {
    splashWin = new electron.BrowserWindow({
        width: 1200,
        height: 675,
        backgroundColor: '#000000',
        show: false,
        frame: false,
        resizable: false,
        movable: false,
        fullscreen,
        fullscreenable: true,
        skipTaskbar: true,
        alwaysOnTop: true,
        title: 'DeckTube'
    })

    splashWin.setMenuBarVisibility(false)
    splashWin.loadFile(path.join(__dirname, '../assets/splash.html'))

    splashWin.once('ready-to-show', () => {
        splashWin.setFullScreen(fullscreen)
        splashWin.show()

        if (win && !win.isDestroyed()) {
            win.setFullScreen(fullscreen)
            win.showInactive()
        }
    })
}

function closeSplash() {
    if (splashWin && !splashWin.isDestroyed()) {
        splashWin.close()
    }

    splashWin = null;
}

function portable() {
    try {
        let exeDir;
        if (process.platform === 'linux' && process.env.APPIMAGE) {
            exeDir = path.dirname(process.env.APPIMAGE)
        } else {
            exeDir = path.dirname(electron.app.getPath('exe'))
        }

        let portablePath = null;
        if (fs.existsSync(path.join(exeDir, './portable.txt'))) {
            let str = fs.readFileSync(path.join(exeDir, './portable.txt'), 'utf-8')
            if (str && str.trim().length !== 0) {
                portablePath = str.trim()
            } else {
                portablePath = path.join(exeDir, 'data')
            }
        } else if (argv['portable'] === true || argv['p'] === true) {
            portablePath = path.join(exeDir , 'data')
        } else if (argv['portable']) {
            portablePath = argv['portable']
        } else if (argv['p']) {
            portablePath = argv['p']
        }

        return portablePath;
    } catch (err) {
        console.error('Failed to detect portable mode, assuming non-portable', err)
        return null;
    }
}

main()