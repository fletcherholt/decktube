const configOverrides = require('../util/configOverrides')

module.exports = () => {
    configOverrides.ytcfgOverrides.push({
        INNERTUBE_CONTEXT: {
            client: {
                webpSupport: true
            }
        }
    })
}