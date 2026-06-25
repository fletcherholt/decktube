const ui = require('../util/ui')
const rcMod = require('../util/resolveCommandModifiers')
const patchFunction = require('../util/patchFunction')
const localeProvider = require('../util/localeProvider')

module.exports = async () => {
    await localeProvider.waitUntilAvailable()

    let locale = localeProvider.getLocale()

    let shiftHeld = false;
    let enterHeld = false;
    let shiftEnterHeld = false;

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') shiftHeld = true;
        if (e.key === 'Enter') enterHeld = true;

        shiftEnterHeld = shiftHeld && enterHeld;
    }, true)

    document.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') shiftHeld = false;
        if (e.key === 'Enter') enterHeld = false;

        shiftEnterHeld = shiftHeld && enterHeld;
    }, true)

    patchFunction(window, 'setTimeout', function (setTimeout, callback, delay) {
        if (shiftEnterHeld && /^function\(\)\{[^.]+\.[^(]+\([^,]+,[^)]+\)\}$/.test(callback.toString())) {
            delay = 0;
        }

        return setTimeout(function(...args) {
            callback(...args)
        }, delay);
    })

    let lastShortId = null;
    rcMod.addInputModifier((c) => {
        if (c.reelWatchEndpoint) {
            lastShortId = c.reelWatchEndpoint.videoId;
        }

        return c;
    })

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key?.toLowerCase() === 'c') {
            let url;

            let isShort = !!document.querySelector('ytlr-shorts-page')?.classList?.contains('zylon-focus')
            if (isShort && lastShortId) {
                url = `https://youtube.com/shorts/${lastShortId}`
            } else {
                let baseUri = window.yt?.player?.utils?.videoElement_?.baseURI;
                if (!baseUri || !baseUri.includes('/watch?v=')) return;

                let id = baseUri.split('/watch?v=')[1]?.slice(0, 11)
                if (!id) return;

                url = `https://youtu.be/${id}`
            }

            navigator.clipboard.writeText(url)
            ui.toast('DeckTube', locale.general.video_copied)
        }
    })

    let captions = false;
    let captionSettings = { useDefaultTrack: true }

    rcMod.addInputModifier((c) => {
        if (c.selectSubtitlesTrackCommand) {
            if (Object.keys(c.selectSubtitlesTrackCommand).length === 0) {
                captions = false;
            } else {
                captions = true;
                captionSettings = c.selectSubtitlesTrackCommand;
            }
        }

        return c;
    })

    function toggleCaptions() {
        if (captions) {
            rcMod.resolveCommand({
                commandMetadata: {
                    webCommandMetadata: {
                        clientAction: true
                    }
                },
                selectSubtitlesTrackCommand: {}
            })
        } else {
            rcMod.resolveCommand({
                commandMetadata: {
                    webCommandMetadata: {
                        clientAction: true
                    }
                },
                selectSubtitlesTrackCommand: captionSettings
            })
        }
    }

    document.addEventListener('keydown', (e) => {
        if (!document.body.classList.contains('WEB_PAGE_TYPE_WATCH') && !document.body.classList.contains('WEB_PAGE_TYPE_SHORTS')) return;
        if (!e.ctrlKey && !e.shiftKey && !e.metaKey && e.key?.toLowerCase() === 'c') {
            e.stopImmediatePropagation()
            e.stopPropagation()
            toggleCaptions()
        }
    }, true)
}