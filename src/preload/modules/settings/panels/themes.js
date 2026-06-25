const { el } = require('../dom')
const scroll = require('../scroll')
const configManager = require('../../../config')
const themes = require('../../../themes')

const viewport = scroll.bindViewport('themes')

let locale = null;

function refreshList() {
    const listContainer = document.getElementById('vt-themes-list')
    if (!listContainer) return;

    const current = configManager.get().theme || 'none';

    listContainer.replaceChildren()

    themes.forEach((theme, idx) => {
        const selected = theme.id === current;

        listContainer.appendChild(el('div', {
            className: 'vt-userstyle-item',
            dataTheme: theme.id,
            dataIndex: String(idx)
        }, [
            el('span', { className: 'vt-userstyle-name', textContent: theme.name }),
            el('div', { className: 'vt-userstyle-toggle' }, [
                el('div', { className: `vt-toggle ${selected ? 'vt-toggle-on' : ''}`, dataThemeToggle: theme.id }, [
                    el('div', { className: 'vt-toggle-track' }, [
                        el('div', { className: 'vt-toggle-thumb' })
                    ])
                ])
            ])
        ]))
    })
}

function selectTheme(id) {
    configManager.set({ theme: id })
    refreshList()
}

module.exports = {
    id: 'themes',

    init(ctx) {
        locale = ctx.locale;
    },

    render() {
        return el('div', { className: 'vt-userstyles-section' }, [
            el('p', { className: 'vt-userstyles-description', textContent: locale.settings.themes.description }),
            el('div', { className: 'vt-themes-viewport vt-userstyles-viewport' }, [
                el('div', { className: 'vt-userstyles-list', id: 'vt-themes-list' }),
                el('div', { className: 'vt-scrollbar', id: 'vt-themes-scrollbar' }, [
                    el('div', { className: 'vt-scrollbar-thumb', id: 'vt-themes-scrollbar-thumb' })
                ])
            ])
        ]);
    },

    setup() {
        viewport.setup()
    },

    onShow() {
        viewport.reset()
        refreshList()
    },

    onFocusItem(element) {
        viewport.scrollTo(element)
    },

    onActivate(element) {
        const id = element?.dataset?.theme;
        if (id) selectTheme(id)
    }
}
