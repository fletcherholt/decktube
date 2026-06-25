const jsonMod = require('../util/jsonModifiers')
const configManager = require('../config')
const config = configManager.get()

module.exports = () => {
    jsonMod.addModifier((json) => {
        if (!config.remove_super_resolution) return json;
        if (!json?.streamingData?.adaptiveFormats) return json;

        json.streamingData.adaptiveFormats = json.streamingData.adaptiveFormats.filter(f => f.xtags !== 'CgcKAnNyEgEx')

        return json;
    })
}