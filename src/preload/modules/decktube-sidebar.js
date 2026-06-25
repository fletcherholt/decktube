const jsonMod = require('../util/jsonModifiers')
const localeProvider = require('../util/localeProvider')

const badgeIcon = `data:image/svg+xml,${encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 34'><rect width='48' height='34' rx='9' fill='#ff0000'/><path d='M19 9 L19 25 L33 17 Z' fill='white'/></svg>"
)}`

module.exports = async () => {
    await localeProvider.waitUntilAvailable()
    const locale = localeProvider.getLocale()
    const label = locale.settings.sidebar?.title || 'DeckTube';

    jsonMod.addModifier((json) => {
        try {
            if (json?.items && Array.isArray(json.items) && json.items[0]?.guideSectionRenderer) {
                let section = json.items[0].guideSectionRenderer;
                if (section.items && !section.__dtInjected) {
                    section.__dtInjected = true;
                    section.items.push({
                        guideEntryRenderer: {
                            title: { runs: [ { text: label } ] },
                            formattedTitle: { runs: [ { text: label } ] },
                            accessibilityText: label,
                            icon: { iconType: 'SETTINGS' },
                            thumbnail: { thumbnails: [ { url: badgeIcon, width: 48, height: 34 } ] },
                            entryData: { guideEntryData: { guideEntryId: 'dt-sidebar-entry' } },
                            navigationEndpoint: {
                                vtConfigOption: 'vt-button',
                                vtConfigValue: () => {
                                    if (window.vtOpenSettingsOverlay) window.vtOpenSettingsOverlay('cleanup')
                                }
                            }
                        }
                    })
                }
            }
        } catch (err) {
            console.error('[Sidebar] inject failed', err)
        }

        return json;
    })
}
