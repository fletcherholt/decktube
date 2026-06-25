const { el, createToggle } = require('../dom')
const scroll = require('../scroll')
const configManager = require('../../../config')

const viewport = scroll.bindViewport('cleanup')

const ITEMS = [
    'hide_shorts',
    'remove_ask_gemini',
    'remove_end_screens',
    'remove_info_cards',
    'disable_autoplay',
    'remove_comments',
    'dismiss_are_you_there'
]

let locale = null;

function buildItem(key, idx, cfg) {
    return el('div', { className: 'vt-setting-item', dataSetting: key, dataIndex: String(idx) }, [
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
    id: 'cleanup',

    init(ctx) {
        locale = ctx.locale;
    },

    render() {
        const cfg = configManager.get()

        return el('div', { className: 'vt-cleanup-section' }, [
            el('p', { className: 'vt-userstyles-description', textContent: locale.settings.cleanup.description }),
            el('div', { className: 'vt-cleanup-viewport vt-userstyles-viewport' }, [
                el('div', { className: 'vt-userstyles-list', id: 'vt-cleanup-list' }, ITEMS.map((k, i) => buildItem(k, i, cfg))),
                el('div', { className: 'vt-scrollbar', id: 'vt-cleanup-scrollbar' }, [
                    el('div', { className: 'vt-scrollbar-thumb', id: 'vt-cleanup-scrollbar-thumb' })
                ])
            ])
        ]);
    },

    setup() {
        viewport.setup()
    },

    onShow() {
        viewport.reset()
    },

    onFocusItem(element) {
        viewport.scrollTo(element)
    }
}
