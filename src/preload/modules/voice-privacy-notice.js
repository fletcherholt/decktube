const configOverrides = require('../util/configOverrides')

module.exports = () => {
    if (process.platform === 'darwin') return;

    configOverrides.tectonicConfigOverrides.push({
        featureSwitches: {
            hasSamsungVoicePrivacyNotice: true
        }
    })
}