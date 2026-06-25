const configOverrides = require('../util/configOverrides')

module.exports = async () => {
    configOverrides.tectonicConfigOverrides.push({
        featureSwitches: {
            enableDirectSignIn: false
        }
    })
}