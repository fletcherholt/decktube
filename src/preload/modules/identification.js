const os = require('os')
const package = require('../../../package.json')
const xhrModifiers = require('../util/xhrModifiers')
const configOverrides = require('../util/configOverrides')
const functions = require('../util/functions')

const osPlatform = os.platform()
const osRelease = os.release()
const hostname = os.hostname()

const platformMap = {
    'win32': 'Windows',
    'darwin': 'Macintosh',
    'linux': 'X11'
}

const osName = platformMap[osPlatform] || ''
let osVersion;
if (osPlatform === 'win32') {
    let parts = osRelease.split('.')
    parts = parts.slice(0, 2)
    osVersion = parts.join('.')
} else if (osPlatform === 'darwin') {
    osVersion = '10_15_7'
} else {
    osVersion = ''
}

module.exports = () => {
    configOverrides.environmentOverrides.push({
        platform: 'DESKTOP',
        platform_detail: '__DELETE__',
        brand: 'DeckTube',
        model: package.version,
        engine: 'WebKit',
        browser_engine: 'WebKit',
        browser_engine_version: '537.36',
        browser: 'Chrome',
        browser_version: process.versions.chrome,
        os: osName,
        os_version: osVersion,
        feature_switches: {
            mdx_device_label: `DeckTube on ${hostname}`
        }
    })

    configOverrides.ytcfgOverrides.push({
        INNERTUBE_CONTEXT: {
            client: {
                platform: 'DESKTOP',
                platformDetail: '__DELETE__',
                clientFormFactor: 'UNKNOWN_FORM_FACTOR',
                deviceMake: 'DeckTube',
                deviceModel: package.version,
                browserName: 'Chrome',
                browserVersion: process.versions.chrome,
                osName: osName,
                osVersion: osVersion,
                tvAppInfo: {
                    releaseVehicle: '__DELETE__'
                }
            }
        },
        WEB_PLAYER_CONTEXT_CONFIGS: {
            WEB_PLAYER_CONTEXT_CONFIG_ID_LIVING_ROOM_WATCH: {
                device: {
                    platform: 'DESKTOP',
                    brand: 'DeckTube',
                    model: package.version,
                    browser: 'Chrome',
                    browserVersion: process.versions.chrome,
                    os: osName,
                    cobaltReleaseVehicle: '__DELETE__'
                }
            }
        }
    })

    xhrModifiers.addRequestModifier((url, body) => {
        if (!url.startsWith('/youtubei/')) return body;

        let json;
        try {
            json = JSON.parse(body)
        } catch {
            return body;
        }

        if (json?.context?.client) {
            functions.deepMerge(json.context.client, {
                platform: 'DESKTOP',
                platformDetail: '__DELETE__',
                clientFormFactor: 'UNKNOWN_FORM_FACTOR',
                deviceMake: 'DeckTube',
                deviceModel: package.version,
                browserName: 'Chrome',
                browserVersion: process.versions.chrome,
                osName: osName,
                osVersion: osVersion,
                tvAppInfo: {
                    releaseVehicle: '__DELETE__'
                }
            })

            body = JSON.stringify(json)
        }

        return body;
    })

    xhrModifiers.addResponseModifier((url, text) => {
        if (!url.startsWith('/tv_config')) return;

        let parts = text.split('\n')
        let lastLine = parts[parts.length - 1]
        let json = JSON.parse(lastLine)

        functions.deepMerge(json.webPlayerContextConfig.WEB_PLAYER_CONTEXT_CONFIG_ID_LIVING_ROOM_WATCH.device, {
            platform: 'DESKTOP',
            brand: 'DeckTube',
            model: package.version,
            browser: 'Chrome',
            browserVersion: process.versions.chrome,
            os: osName,
            cobaltReleaseVehicle: '__DELETE__'
        })

        return JSON.stringify(json);
    })
}