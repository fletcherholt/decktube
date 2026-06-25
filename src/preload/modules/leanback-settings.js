const { shell } = require('electron')
const configManager = require('../config')
const jsonMod = require('../util/jsonModifiers')
const rcMod = require('../util/resolveCommandModifiers')
const localeProvider = require('../util/localeProvider')
const functions = require('../util/functions')

let config = configManager.get()

function createSettingButtonRenderer(title, summary, button, callback) {
    return {
        settingActionRenderer: {
            title: {
                runs: [ { text: title } ]
            },
            summary: {
                runs: [ { text: summary } ]
            },
            actionButton: {
                buttonRenderer: {
                    text: {
                        runs: [ { text: button } ]
                    },
                    navigationEndpoint: {
                        vtConfigOption: 'vt-button',
                        vtConfigValue: callback
                    }
                }
            }
        }
    };
}

function createSettingBooleanRenderer(title, summary, configName, dynamicFunction) {
    return {
        settingBooleanRenderer: {
            itemId: 'VOICE_AND_AUDIO_ACTIVITY',
            enabled: config[configName],
            title: {
                runs: [
                    { text: title }
                ]
            },
            summary: {
                runs: [
                    { text: summary }
                ]
            },
            enableServiceEndpoint: {
                vtConfigOption: configName,
                vtConfigValue: true,
                dynamicFunction
            },
            disableServiceEndpoint: {
                vtConfigOption: configName,
                vtConfigValue: false,
                dynamicFunction
            }
        }
    };
}

module.exports = async () => {
    await localeProvider.waitUntilAvailable()
    await functions.waitForCondition(() => !!window.ytcfg)

    let isKids = window.ytcfg.data_.INNERTUBE_CLIENT_NAME === 'TVHTML5_FOR_KIDS'
    let locale = localeProvider.getLocale()

    rcMod.addInputModifier((input) => {
        if (input.vtConfigOption) {
            if (input.vtConfigOption === 'vt-button') {
                input.vtConfigValue()
                return false;
            }

            let newConfig = {}
            newConfig[input.vtConfigOption] = input.vtConfigValue;
            configManager.set(newConfig)
            config = configManager.get()

            for (let key of Object.keys(configOptions)) {
                configOptions[key].settingBooleanRenderer.enabled = config[key]
            }

            if (input.dynamicFunction) {
                input.dynamicFunction(input.vtConfigValue)
            }

            return false;
        }

        return input;
    })

    jsonMod.addModifier((json) => {
        if (json?.items?.[0]?.settingCategoryCollectionRenderer) {
            for (let item of json.items) {
                let category = item.settingCategoryCollectionRenderer;

                                category.items = category.items.filter(c => c.settingReadOnlyItemRenderer?.itemId !== 'ABOUT_OPEN_SOURCE_LICENSES')
            }

            if (isKids) return json;

            json.items[0].settingCategoryCollectionRenderer.title = {
                runs: [
                    { text: 'YouTube' }
                ]
            }

            json.items.unshift(
                {
                    settingCategoryCollectionRenderer: {
                        categoryId: 'SETTINGS_CAT_VACUUMTUBE_OVERLAY',
                        focused: false,
                        items: [
                            createSettingButtonRenderer(
                                locale.settings.generic.title,
                                locale.settings.generic.description,
                                locale.settings.generic.button_label,
                                () => {
                                    if (window.vtOpenSettingsOverlay) {
                                        window.vtOpenSettingsOverlay()
                                    }
                                }
                            ),
                                                    ],
                        title: {
                            runs: [
                                { text: 'DeckTube' }
                            ]
                        }
                    }
                }
            )
        }

        return json;
    })
}