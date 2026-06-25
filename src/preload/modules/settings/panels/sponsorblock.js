const { el, createToggle } = require('../dom')
const scroll = require('../scroll')
const configManager = require('../../../config')

const viewport = scroll.bindViewport('sponsorblock')

const CATEGORIES = [
    'sponsorblock_sponsor',
    'sponsorblock_selfpromo',
    'sponsorblock_interaction',
    'sponsorblock_intro',
    'sponsorblock_outro',
    'sponsorblock_preview',
    'sponsorblock_music_offtopic',
    'sponsorblock_filler'
]

let locale = null;

function updateInactiveState() {
    const root = document.querySelector('.vt-content-panel[data-panel="sponsorblock"]')
    if (!root) return;

    const isEnabled = !!configManager.get().sponsorblock;

    root.querySelectorAll('.vt-setting-item[data-sb-category="true"]').forEach((item) => {
        item.classList.toggle('vt-setting-item-inactive', !isEnabled)
        item.setAttribute('aria-disabled', isEnabled ? 'false' : 'true')
    })
}

function buildItem(key, idx, cfg, isCategory) {
    const attrs = { className: 'vt-setting-item', dataSetting: key, dataIndex: String(idx) }
    if (isCategory) {
        attrs.dataSbCategory = 'true';
        if (!cfg.sponsorblock) { attrs.className += ' vt-setting-item-inactive'; attrs.ariaDisabled = 'true'; }
    }

    return el('div', attrs, [
        el('div', { className: 'vt-setting-info' }, [
            el('span', { className: 'vt-setting-title', textContent: locale.settings[key].title }),
            el('span', { className: 'vt-setting-description', textContent: locale.settings[key].description })
        ]),
        el('div', { className: 'vt-setting-control' }, [
            createToggle(key, cfg[key])
        ])
    ]);
}

module.exports = {
    id: 'sponsorblock',

    init(ctx) {
        locale = ctx.locale;
    },

    render() {
        const cfg = configManager.get()
        const items = [ buildItem('sponsorblock', 0, cfg, false) ]
        CATEGORIES.forEach((k, i) => items.push(buildItem(k, i + 1, cfg, true)))

        return el('div', { className: 'vt-sponsorblock-section' }, [
            el('div', { className: 'vt-sponsorblock-viewport vt-userstyles-viewport' }, [
                el('div', { className: 'vt-userstyles-list', id: 'vt-sponsorblock-list' }, items),
                el('div', { className: 'vt-scrollbar', id: 'vt-sponsorblock-scrollbar' }, [
                    el('div', { className: 'vt-scrollbar-thumb', id: 'vt-sponsorblock-scrollbar-thumb' })
                ])
            ])
        ]);
    },

    setup() {
        viewport.setup()
    },

    onShow() {
        viewport.reset()
        updateInactiveState()
    },

    onFocusItem(element) {
        viewport.scrollTo(element)
    },

    onConfigUpdate(config) {
        if (!config || config.sponsorblock === undefined) return;
        updateInactiveState()
    }
}
