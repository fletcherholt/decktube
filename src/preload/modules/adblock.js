const jsonMod = require('../util/jsonModifiers')
const xhrModifiers = require('../util/xhrModifiers')
const configManager = require('../config')
const config = configManager.get()

module.exports = () => {
    xhrModifiers.addResponseModifier((url, text) => {
        if (!config.adblock) return;

        if (
            !url.startsWith('/youtubei/v1/browse') &&
            !url.startsWith('/youtubei/v1/search')
        ) {
            return;
        }

        let json = JSON.parse(text)

        if (url.startsWith('/youtubei/v1/browse')) {
            let homeFeed = json.contents?.tvBrowseRenderer?.content?.tvSurfaceContentRenderer?.content?.sectionListRenderer;
            if (!homeFeed || !homeFeed.contents) return;

            homeFeed.contents = homeFeed.contents.filter(r => !r.adSlotRenderer && !r.promoShelfRenderer && !r.shelfRenderer?.tvhtml5Metadata?.hideLogo)

            for (let feed of homeFeed.contents) {
                let horizontal = feed?.shelfRenderer?.content?.horizontalListRenderer;
                if (!horizontal?.items) continue;

                horizontal.items = horizontal.items.filter(i => !i.adSlotRenderer)
            }
        } else if (url.startsWith('/youtubei/v1/search')) {
            let searchFeed = json.contents?.sectionListRenderer;
            if (!searchFeed || !searchFeed.contents) return;

            for (let feed of searchFeed.contents) {
                let horizontal = feed?.shelfRenderer?.content?.horizontalListRenderer;
                if (!horizontal?.items) continue;

                horizontal.items = horizontal.items.filter(i => !i.adSlotRenderer)
            }
        }

        return JSON.stringify(json);
    })

    jsonMod.addModifier((json) => {
        if (!config.adblock) return json;

        if (json?.adPlacements !== undefined || json?.playerAds !== undefined) {
            json.adPlacements = []
            json.playerAds = false
        }

        if (json?.adSlots) {
            json.adSlots = []
        }

        return json;
    })

    xhrModifiers.addRequestModifier((url, body) => {
        if (!config.adblock) return body;
        if (!url.startsWith('/youtubei/v1/player')) return body;

        let json;
        try {
            json = JSON.parse(body)
        } catch {
            return body;
        }

        let ctx = json?.playbackContext?.contentPlaybackContext;
        if (ctx) {
            ctx.isInlinePlaybackNoAd = true;
            return JSON.stringify(json);
        }

        return body;
    })

    jsonMod.addModifier((json) => {
        if (!config.adblock) return json;

        if (json?.entries && Array.isArray(json.entries)) {
            json.entries = json.entries.filter(e => !e?.command?.reelWatchEndpoint?.adClientParams?.isAd)
        }

        return json;
    })
}