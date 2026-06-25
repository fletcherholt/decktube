const fs = require('fs')
const path = require('path')
const { ipcRenderer } = require('electron')
const configManager = require('../../config')
const css = require('../../util/css')
const localeProvider = require('../../util/localeProvider')
const functions = require('../../util/functions')
const controller = require('../../util/controller')
const { el, createSettingItem, createTab } = require('./dom')
const { updateViewportScroll, setupTouchScroll } = require('./scroll')

let locale = null;
let config = configManager.get()

let overlayVisible = false;
let currentTabIndex = 0;
let currentItemIndex = 0;
let focusArea = 'content'

let tabs = [
    { id: 'cleanup' },
    { id: 'themes' },
    { id: 'quality' },
    { id: 'sleep_timer' },
    { id: 'sponsorblock' },
    { id: 'adblock' },
    { id: 'dearrow' },
    { id: 'dislikes' },
    { id: 'keep_awake' },
    { id: 'userstyles' },
    { id: 'remove_super_resolution' },
    { id: 'h264ify' },
    { id: 'hardware_decoding' },
    { id: 'wayland_hdr', hide: process.platform !== 'linux' },
    { id: 'low_memory_mode', },
    { id: 'fullscreen', func: (value) => ipcRenderer.invoke('set-fullscreen', value) },
    { id: 'splash' },
    { id: 'no_window_decorations' },
    { id: 'keep_on_top', func: (value) => ipcRenderer.invoke('set-on-top', value) },
    { id: 'pause_on_blur' },
    { id: 'touch_overlay' },
    { id: 'controller_support' },
    { id: 'mac_permissions', hide: process.platform !== 'darwin' }
]

tabs = tabs.filter(t => !t.hide)

const dynamicFunction = {}
for (let item of tabs) {
    if (item.func) {
        dynamicFunction[item.id] = item.func;
    }
}

const panelModules = [
    require('./panels/cleanup'),
    require('./panels/sponsorblock'),
    require('./panels/quality'),
    require('./panels/sleeptimer'),
    require('./panels/h264ify'),
    require('./panels/mac-permissions'),
    require('./panels/themes'),
    require('./panels/userstyles')
]

const panels = {}
for (const panel of panelModules) {
    panels[panel.id] = panel;
}

function createOverlayDOM() {
    const settingsTabs = tabs.map((tab, i) =>
        createTab(tab.id, locale.settings[tab.id].title, i, i === 0)
    )

    const settingsContent = tabs.map((tab, i) => {
        const panel = panels[tab.id]
        const content = panel
            ? panel.render()
            : createSettingItem(tab.id, locale.settings[tab.id].title, locale.settings[tab.id].description, config[tab.id], true)

        return el('div', { className: `vt-content-panel${i === 0 ? ' vt-panel-active' : ''}`, dataPanel: tab.id }, [
            content
        ]);
    })

    return el('div', {
        id: 'vt-settings-overlay-root',
        className: 'vt-settings-hidden',
        tabindex: '-1'
    }, [
        el('div', {
            className: 'vt-settings-backdrop'
        }),
        el('div', {
            className: 'vt-settings-container'
        }, [
            el('div', { className: 'vt-settings-header' }, [
                el('span', { className: 'vt-settings-title', textContent: locale.settings.generic.title }),
                el('span', { className: 'vt-settings-hint', textContent: locale.settings.generic.hint }),
                el('div', { className: 'vt-settings-close', dataAction: 'close' }, [
                    el('span', { textContent: '✕' })
                ])
            ]),
            el('div', { className: 'vt-settings-body' }, [
                el('div', { className: 'vt-tabs-viewport' }, [
                    el('div', { className: 'vt-settings-tabs', id: 'vt-settings-tabs' }, settingsTabs),
                    el('div', { className: 'vt-scrollbar vt-tabs-scrollbar', id: 'vt-tabs-scrollbar' }, [
                        el('div', { className: 'vt-scrollbar-thumb', id: 'vt-tabs-scrollbar-thumb' })
                    ])
                ]),

                el('div', { className: 'vt-settings-content' }, settingsContent)
            ])
        ])
    ]);
}

function getOverlay() {
    return document.getElementById('vt-settings-overlay-root');
}

function getActivePanelElement() {
    return getOverlay()?.querySelector('.vt-content-panel.vt-panel-active') || null;
}

function getActivePanel() {
    const panelElement = getActivePanelElement()
    return panelElement ? panels[panelElement.dataset.panel] : undefined;
}

function showOverlay(targetTabId) {
    const overlay = getOverlay()

    overlayVisible = Date.now()
    overlay.classList.remove('vt-settings-hidden')
    overlay.style.opacity = '1'
    overlay.style.pointerEvents = 'auto'
    overlay.focus()

    for (let panel of panelModules) {
        panel.onShow?.()
    }

    let startIndex = 0;
    if (targetTabId) {
        let found = tabs.findIndex(t => t.id === targetTabId)
        if (found !== -1) startIndex = found;
    }

    currentTabIndex = startIndex;
    currentItemIndex = 0;

    if (startIndex !== 0) {
        selectTab(startIndex)
    }

    updateFocus('content')
}

function hideOverlay() {
    const overlay = getOverlay()
    if (!overlay) return;

    overlayVisible = false;
    overlay.classList.add('vt-settings-hidden')
    overlay.style.opacity = '0'
    overlay.style.pointerEvents = 'none'
    overlay.blur()
}

function updateFocus(area) {
    const overlay = getOverlay()
    if (!overlay) return;

    overlay.querySelectorAll('.vt-tab-focused, .vt-item-focused, .vt-close-focused').forEach((node) => {
        node.classList.remove('vt-tab-focused', 'vt-item-focused', 'vt-close-focused')
    })

    focusArea = area;

    if (area === 'tabs') {
        const tab = overlay.querySelector(`.vt-tab[data-index="${currentTabIndex}"]`)
        if (tab) {
            tab.classList.add('vt-tab-focused')
            updateViewportScroll('.vt-tabs-viewport', '#vt-settings-tabs', tab, '#vt-tabs-scrollbar-thumb')
        }
    } else if (area === 'content') {
        const panel = getActivePanelElement()
        if (panel) {
            const focusedElement =
                panel.querySelector(`.vt-setting-item[data-index="${currentItemIndex}"]`)
                || panel.querySelector(`.vt-userstyle-item[data-index="${currentItemIndex}"]`)
                || panel.querySelector(`.vt-button[data-index="${currentItemIndex}"]`)

            if (focusedElement) {
                focusedElement.classList.add('vt-item-focused')
                panels[panel.dataset.panel]?.onFocusItem?.(focusedElement)
            }
        }
    } else if (area === 'close') {
        const closeBtn = overlay.querySelector('.vt-settings-close')
        if (closeBtn) closeBtn.classList.add('vt-close-focused')
    }
}

function selectTab(index) {
    const overlay = getOverlay()
    if (!overlay) return;

    currentTabIndex = index;
    currentItemIndex = 0;

    overlay.querySelectorAll('.vt-tab').forEach(tab => {
        tab.classList.remove('vt-tab-selected')
    })

    const selectedTab = overlay.querySelector(`.vt-tab[data-index="${index}"]`)
    if (!selectedTab) return;

    selectedTab.classList.add('vt-tab-selected')
    const tabId = selectedTab.dataset.tab

    overlay.querySelectorAll('.vt-content-panel').forEach(panel => {
        panel.classList.remove('vt-panel-active')
    })

    const activePanel = overlay.querySelector(`.vt-content-panel[data-panel="${tabId}"]`)
    if (activePanel) activePanel.classList.add('vt-panel-active')

    panels[tabId]?.onShow?.()
}

function toggleSetting(configKey) {
    const newValue = !config[configKey]
    configManager.set({ [configKey]: newValue })
    config = configManager.get()

    const overlay = getOverlay()
    if (overlay) {
        const toggle = overlay.querySelector(`.vt-toggle[data-config="${configKey}"]`)
        if (toggle) {
            toggle.classList.toggle('vt-toggle-on', newValue)
        }
    }

    if (dynamicFunction[configKey]) {
        dynamicFunction[configKey](newValue)
    }
}

async function handleButtonAction(action) {
    const handler = getActivePanel()?.actions?.[action]
    if (!handler) return;

    try {
        await handler()
    } catch (err) {
        console.error(`[Settings Overlay] Failed to run button action ${action}:`, err)
    }
}

function activateFocusedItem() {
    const panel = getActivePanelElement()
    if (!panel) return;

    const focused = panel.querySelector('.vt-item-focused')
    if (!focused) return;

    if (focused.classList.contains('vt-setting-item')) {
        if (focused.classList.contains('vt-setting-item-inactive')) return;
        if (focused.dataset.setting) toggleSetting(focused.dataset.setting)
    } else if (focused.classList.contains('vt-button')) {
        handleButtonAction(focused.dataset.action)
    } else {
        panels[panel.dataset.panel]?.onActivate?.(focused)
    }
}

function getItemCount() {
    const panel = getActivePanelElement()
    if (!panel) return 0;

    const settingItems = panel.querySelectorAll('.vt-setting-item').length;
    const userstyleItems = panel.querySelectorAll('.vt-userstyle-item').length;
    const buttons = panel.querySelectorAll('.vt-button').length;

    return settingItems + userstyleItems + buttons;
}

function handleKeyDown(e) {
    if (!overlayVisible) return;

    const key = e.key;

    if (key === 'Escape' || key === 'Backspace') {
        e.preventDefault()
        e.stopPropagation()
        hideOverlay()
        return;
    }

    if (key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        if (focusArea === 'tabs') {
            if (currentTabIndex > 0) {
                currentTabIndex--;
                selectTab(currentTabIndex)
                updateFocus('tabs')
            }
        } else if (focusArea === 'content') {
            if (currentItemIndex > 0) {
                currentItemIndex--;
                updateFocus('content')
            } else {

                focusArea = 'close'
                updateFocus('close')
            }
        }
    } else if (key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        if (focusArea === 'close') {

            focusArea = 'content'
            currentItemIndex = 0;
            updateFocus('content')
        } else if (focusArea === 'tabs') {
            if (currentTabIndex < tabs.length - 1) {
                currentTabIndex++;
                selectTab(currentTabIndex)
                updateFocus('tabs')
            }
        } else if (focusArea === 'content') {
            const maxIndex = getItemCount() - 1;
            if (currentItemIndex < maxIndex) {
                currentItemIndex++;
                updateFocus('content')
            }
        }
    } else if (key === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        if (focusArea !== 'close') {
            focusArea = 'tabs'
            updateFocus('tabs')
        }
    } else if (key === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        if (focusArea === 'tabs') {
            focusArea = 'content'
            updateFocus('content')
        } else if (focusArea === 'content') {

            focusArea = 'close'
            updateFocus('close')
        }
    } else if (key === 'Enter' || key === ' ') {
        e.preventDefault()
        e.stopPropagation()
        if (focusArea === 'close') {
            hideOverlay()
        } else if (focusArea === 'tabs') {
            focusArea = 'content'
            updateFocus('content')
        } else if (focusArea === 'content') {
            activateFocusedItem()
        }
    }
}

const gamepadKeyMap = {
    0: 'Enter',
    1: 'Escape',
    12: 'ArrowUp',
    13: 'ArrowDown',
    14: 'ArrowLeft',
    15: 'ArrowRight',

    1012: 'ArrowUp',
    1014: 'ArrowDown',
    1011: 'ArrowLeft',
    1013: 'ArrowRight'
}

function setupEventListeners() {

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'o') {
            e.preventDefault()
            e.stopPropagation()
            toggleSettingsOverlay()
            return;
        }
    }, true)

    document.addEventListener('keydown', (e) => {
        if (overlayVisible) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            handleKeyDown(e)
        }
    }, true)

    document.addEventListener('keyup', (e) => {
        if (overlayVisible) {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
        }
    }, true)

    document.addEventListener('click', (e) => {
        if ((Date.now() - overlayVisible) < 100) return;

        const overlay = getOverlay()
        if (!overlay) return;

        if (e.target.classList.contains('vt-settings-backdrop')) {
            hideOverlay()
            return;
        }

        const closeBtn = e.target.closest('.vt-settings-close')
        if (closeBtn) {
            hideOverlay()
            return;
        }

        const tab = e.target.closest('.vt-tab')
        if (tab) {
            const index = parseInt(tab.dataset.index)
            selectTab(index)
            focusArea = 'content'
            updateFocus('content')

            return;
        }

        const item = e.target.closest('.vt-setting-item')
        if (item) {
            if (item.classList.contains('vt-setting-item-inactive')) return;
            const configKey = item.dataset.setting;
            if (configKey) toggleSetting(configKey)
            return;
        }

        const userstyleItem = e.target.closest('.vt-userstyle-item')
        if (userstyleItem) {
            getActivePanel()?.onActivate?.(userstyleItem)
            return;
        }

        const button = e.target.closest('.vt-button')
        if (button) {
            handleButtonAction(button.dataset.action)
            return;
        }
    }, true)

    controller.on('down', (e) => {
        if ((Date.now() - overlayVisible) < 100) return;

        let key = gamepadKeyMap[e.code]
        if (key) {
            handleKeyDown({ key, preventDefault: () => {}, stopPropagation: () => {} })
        }
    })
}

function openSettingsOverlay(tabId) {
    showOverlay(typeof tabId === 'string' ? tabId : undefined)
}

function toggleSettingsOverlay() {
    if (overlayVisible) {
        hideOverlay()
    } else {
        showOverlay()
    }
}

module.exports = async () => {
    await localeProvider.waitUntilAvailable()
    await functions.waitForCondition(() => !!document.body)

    locale = localeProvider.getLocale()

    for (const panel of panelModules) {
        panel.init?.({ locale })
    }

    const cssPath = path.join(__dirname, 'style.css')
    const text = fs.readFileSync(cssPath, 'utf-8')

    css.inject('settings', text)

    const overlayElement = createOverlayDOM()
    document.body.appendChild(overlayElement)

    setupTouchScroll('.vt-tabs-viewport', '#vt-settings-tabs', '#vt-tabs-scrollbar-thumb')
    for (const panel of panelModules) {
        panel.setup?.()
    }

    setupEventListeners()

    ipcRenderer.on('config-update', (event, newConfig) => {
        config = newConfig;
        const overlay = getOverlay()
        if (overlay) {
            overlay.querySelectorAll('.vt-toggle').forEach(toggle => {
                const configKey = toggle.dataset.config;
                if (configKey && config[configKey] !== undefined) {
                    toggle.classList.toggle('vt-toggle-on', config[configKey])
                }
            })

            for (const panel of panelModules) {
                panel.onConfigUpdate?.(config)
            }
        }
    })

    window.vtOpenSettingsOverlay = openSettingsOverlay;
    window.vtToggleSettingsOverlay = toggleSettingsOverlay;
}

module.exports.openSettingsOverlay = openSettingsOverlay;