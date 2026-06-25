const { el } = require('../dom')
const scroll = require('../scroll')
const configManager = require('../../../config')

const viewport = scroll.bindViewport('sleeptimer')

const OPTIONS = [
    { value: 'off', label: 'Off' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1 hour 30 minutes' },
    { value: 'video', label: 'End of current video' }
]

let locale = null;

function refresh() {
    const list = document.getElementById('vt-sleeptimer-list')
    if (!list) return;

    const current = configManager.get().sleep_timer || 'off';
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
    id: 'sleep_timer',

    init(ctx) {
        locale = ctx.locale;
    },

    render() {
        return el('div', { className: 'vt-userstyles-section' }, [
            el('p', { className: 'vt-userstyles-description', textContent: locale.settings.sleep_timer.description }),
            el('div', { className: 'vt-sleeptimer-viewport vt-userstyles-viewport' }, [
                el('div', { className: 'vt-userstyles-list', id: 'vt-sleeptimer-list' }),
                el('div', { className: 'vt-scrollbar', id: 'vt-sleeptimer-scrollbar' }, [
                    el('div', { className: 'vt-scrollbar-thumb', id: 'vt-sleeptimer-scrollbar-thumb' })
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
            configManager.set({ sleep_timer: value })
            refresh()
        }
    }
}
