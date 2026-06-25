const jsonMod = require('../util/jsonModifiers')
const localeProvider = require('../util/localeProvider')

const badgeIcon = 'https://raw.githubusercontent.com/fletcherholt/decktube/main/assets/icons/256x256.png'

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
                            thumbnail: { thumbnails: [ { url: badgeIcon, width: 256, height: 256 } ] },
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
