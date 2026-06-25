const xhrModifiers = require('../util/xhrModifiers')
const jsonMod = require('../util/jsonModifiers')
const configManager = require('../config')

const config = configManager.get()

function walkArrays(node, fn, depth = 0) {
    if (!node || typeof node !== 'object' || depth > 12) return;

    if (Array.isArray(node)) {
        fn(node)
        for (let item of node) walkArrays(item, fn, depth + 1)
    } else {
        for (let key of Object.keys(node)) walkArrays(node[key], fn, depth + 1)
    }
}

function looksLikeAskButton(item) {
    let b = item?.buttonRenderer || item?.toggleButtonRenderer || item;
    let type = b?.buttonType || item?.buttonType || '';
    let icon = b?.icon?.iconType || '';
    let label = b?.accessibilityData?.accessibilityData?.label
        || b?.text?.runs?.[0]?.text
        || b?.text?.simpleText
        || '';

    return /ASK|GEMINI/i.test(type)
        || /GEMINI|SPARK/i.test(icon)
        || /\bask\b|gemini/i.test(label);
}

module.exports = () => {

    if (config.dismiss_are_you_there) {
        try {
            const key = 'yt.leanback.default::recurring_actions'
            const actions = ['whos_watching_fullscreen_zero_accounts', 'startup-screen-account-selector-with-guest', 'startup-screen-signed-out-welcome-back']
            let store = JSON.parse(localStorage.getItem(key) || '{}')
            let data = store.data || store;
            const farFuture = 1893456000000;
            for (let a of actions) {
                if (data[a]) data[a].lastFired = farFuture;
                else data[a] = { lastFired: farFuture }
            }
            if (store.data) store.data = data; else store = data;
            localStorage.setItem(key, JSON.stringify(store))
        } catch (err) {
            console.error('[Cleanup] failed to defer who-is-watching prompt', err)
        }
    }

    jsonMod.addModifier((json) => {
        try {
            if (config.remove_end_screens && json?.endscreen) {
                json.endscreen = null;
            }

            if (config.remove_info_cards) {
                if (json?.cards) json.cards = null;
                if (json?.cardCollectionRenderer) json.cardCollectionRenderer = null;
            }

            if (json?.paidContentOverlay) {
                json.paidContentOverlay = null;
            }
        } catch (err) {
            console.error('[Cleanup] player-response strip failed', err)
        }

        return json;
    })

    xhrModifiers.addResponseModifier((url, text) => {
        if (!url.startsWith('/youtubei/')) return;

        if (!config.adblock && !config.dismiss_are_you_there && !config.remove_comments && !config.remove_ask_gemini) {
            return;
        }

        let json;
        try {
            json = JSON.parse(text)
        } catch {
            return;
        }

        let changed = false;
        try {
            walkArrays(json, (arr) => {
                for (let i = arr.length - 1; i >= 0; i--) {
                    let item = arr[i]
                    if (!item || typeof item !== 'object') continue;

                    if (config.adblock && (item.tvMastheadRenderer || item.feedNudgeRenderer)) {
                        arr.splice(i, 1); changed = true; continue;
                    }

                    if (config.dismiss_are_you_there && (item.youThereRenderer || item.alertWithActionsRenderer)) {
                        arr.splice(i, 1); changed = true; continue;
                    }

                    if (config.remove_comments && (item.commentsEntryPointHeaderRenderer || item.commentSectionRenderer || item.commentsEntryPointTeaserRenderer)) {
                        arr.splice(i, 1); changed = true; continue;
                    }

                    if (config.remove_ask_gemini && looksLikeAskButton(item)) {
                        arr.splice(i, 1); changed = true; continue;
                    }
                }
            })
        } catch (err) {
            console.error('[Cleanup] response walk failed', err)
        }

        return changed ? JSON.stringify(json) : undefined;
    })
}
