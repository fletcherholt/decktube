const fs = require('fs')
const crypto = require('crypto')
const electron = require('electron')
const path = require('path')

const userData = electron.app.getPath('userData')
const legacyStateFile = path.join(userData, 'state.json')
const configFile = path.join(userData, 'config.json')

let changed = false;
let config = {}

const defaults = {
    volume: 100,
    adblock: true,
    sponsorblock: false,
    sponsorblock_uuid: crypto.randomUUID(),
    sponsorblock_sponsor: true,
    sponsorblock_selfpromo: false,
    sponsorblock_interaction: false,
    sponsorblock_intro: false,
    sponsorblock_outro: false,
    sponsorblock_preview: false,
    sponsorblock_music_offtopic: false,
    sponsorblock_filler: false,
    dearrow: false,
    dislikes: false,
    remove_super_resolution: false,
    hide_shorts: false,
    h264ify: false,
    h264ify_disable_webm: true,
    h264ify_disable_vp8: true,
    h264ify_disable_vp9: true,
    h264ify_disable_av1: true,
    hardware_decoding: true,
    wayland_hdr: false,
    low_memory_mode: false,
    fullscreen: false,
    splash: true,
    theme: 'none',
    preferred_quality: 'auto',
    sleep_timer: 'off',
    keep_awake: true,
    playback_speed: 1,
    remove_ask_gemini: false,
    remove_end_screens: false,
    remove_info_cards: false,
    disable_autoplay: false,
    remove_comments: false,
    dismiss_are_you_there: true,
    no_window_decorations: false,
    keep_on_top: false,
    pause_on_blur: false,
    userstyles: false,
    disabled_userstyles: [],
    touch_overlay: false,
    controller_support: true,
    dt_touch_reset: true
}

function init(overrides = {}) {
    if (fs.existsSync(legacyStateFile)) {
        console.log('[config] Migrating legacy state.json')
        fs.renameSync(legacyStateFile, configFile)
    }

    if (fs.existsSync(configFile) && isValidJson(configFile)) {
        console.log(`[config] Reading config from ${configFile}`)

        let parsed = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
        if (parsed['0']) {
            console.log('[config] Fixing config bug')

            for (let key of Object.keys(parsed)) {
                if (!isNaN(Number(key))) {
                    delete parsed[key];
                }
            }

            fs.writeFileSync(configFile, JSON.stringify(parsed, null, 4))
        }

        let migrated = false;
        if (parsed.dt_touch_reset !== true) {
            parsed.touch_overlay = false;
            parsed.dt_touch_reset = true;
            migrated = true;
        }

        config = {
            ...defaults,
            ...parsed
        }

        if (migrated) {
            try {
                fs.writeFileSync(configFile, JSON.stringify(config, null, 4))
            } catch (err) {
                console.error('[config] Failed to persist migration', err)
            }
        }

        console.log('[config] Loaded config', config)
    } else {
        console.log('[config] Initializing default config')

        config = {
            ...defaults,
            ...overrides
        }

        try {
            fs.mkdirSync(userData, { recursive: true })
            fs.writeFileSync(configFile, JSON.stringify(config, null, 4))
        } catch (err) {
            console.error('[config] Failed to write config file', err)
        }
    }

    setInterval(save, 500)

    return config;
}

function save() {
    if (changed) {
        console.log('[config] Saving updated config to file')

        try {
            fs.writeFileSync(configFile, JSON.stringify(config, null, 4))
            return true;
        } catch (err) {
            console.error('[config] Failed to write config file', err)
            return false;
        } finally {
            changed = false;
        }
    }
}

function update(newConfig = {}) {
    config = {
        ...defaults,
        ...config,
        ...newConfig
    }

    changed = true;
}

function get() {
    return config;
}

function isValidJson(file) {
    try {
        let text = fs.readFileSync(file, 'utf-8')
        let json = JSON.parse(text)
        if (typeof json !== 'object') throw new Error('Not an object');

        return true;
    } catch {
        return false;
    }
}

module.exports = {
    init,
    save,
    update,
    get
}