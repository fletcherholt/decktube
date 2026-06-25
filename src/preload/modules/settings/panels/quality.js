const { el } = require('../dom')
const scroll = require('../scroll')
const configManager = require('../../../config')

const viewport = scroll.bindViewport('quality')

const OPTIONS = [
    { value: 'auto', label: 'Auto (let YouTube decide)' },
    { value: 'highest', label: 'Highest available' },
    { value: '1080', label: '1080p' },
    { value: '720', label: '720p' },
    { value: '480', label: '480p' },
    { value: '360', label: '360p' }
]

let locale = null;

function refresh() {
    const list = document.getElementById('vt-quality-list')
    if (!list) return;

    const current = configManager.get().preferred_quality || 'auto';
    list.replaceChildren()

    OPTIONS.forEach((opt, i) => {
        const selected = opt.value === current;
        list.appendChild(el('div', { className: 'vt-userstyle-item', dataValue: opt.value, dataIndex: String(i) }, [
            el('span', { className: 'vt-userstyle-name', textContent: opt.label }),
            el('div', { className: 'vt-userstyle-toggle' }, [
                el('div', { className: `vt-toggle ${selected ? 'vt-toggle-on' : ''}` }, [
                    el('div', { className: 'vt-toggle-track' }, [ el('div', { className: 'vt-toggle-thumb' }) ])
                ])
            ])
        ]))
    })
}

module.exports = {
    id: 'quality',

    init(ctx) {
        locale = ctx.locale;
    },

    render() {
        return el('div', { className: 'vt-userstyles-section' }, [
            el('p', { className: 'vt-userstyles-description', textContent: locale.settings.quality.description }),
            el('div', { className: 'vt-quality-viewport vt-userstyles-viewport' }, [
                el('div', { className: 'vt-userstyles-list', id: 'vt-quality-list' }),
                el('div', { className: 'vt-scrollbar', id: 'vt-quality-scrollbar' }, [
                    el('div', { className: 'vt-scrollbar-thumb', id: 'vt-quality-scrollbar-thumb' })
                ])
            ])
        ]);
    },

    setup() {
        viewport.setup()
    },

    onShow() {
        viewport.reset()
        refresh()
    },

    onFocusItem(element) {
        viewport.scrollTo(element)
    },

    onActivate(element) {
        const value = element?.dataset?.value;
        if (value) {
            configManager.set({ preferred_quality: value })
            refresh()
        }
    }
}
