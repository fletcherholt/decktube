const { SponsorBlock } = require('sponsorblock-api')
const ui = require('../util/ui')
const localeProvider = require('../util/localeProvider')
const configManager = require('../config')
const config = configManager.get()

module.exports = async () => {
    await localeProvider.waitUntilAvailable()
    let locale = localeProvider.getLocale()

    let sponsorBlock = new SponsorBlock(config.sponsorblock_uuid)
    let sponsorBlockSegments = []

    let activeVideoId = 0;
    let attachVideoTimeout = null;
    let activeVideo = null;
    const attachToVideo = function () {
        clearTimeout(attachVideoTimeout)
        attachVideoTimeout = null;

        activeVideo = document.querySelector('video')
        if (!activeVideo) {
            attachVideoTimeout = setTimeout(attachToVideo, 100)
            return;
        }

        console.log('[SponsorBlock] Attached to video ID', activeVideoId)

        activeVideo.addEventListener('timeupdate', checkForSponsorSkip)
    }

    const checkForSponsorSkip = function () {
        if (!config.sponsorblock || !activeVideo || sponsorBlockSegments.length === 0) return;

        if (activeVideo.paused) return;

        let matchingSegment = sponsorBlockSegments.filter((v) => {

            return activeVideo.currentTime > v.startTime
                && activeVideo.currentTime < v.startTime + 2
                && activeVideo.currentTime < v.endTime;
        }).sort((x, y) => x.startTime - y.startTime)

        if (matchingSegment.length === 0) return;

        console.log('[SponsorBlock] Skipping sponsor segment')

        activeVideo.currentTime = matchingSegment[0].endTime;

        ui.toast('DeckTube', locale.sponsorblock.sponsor_skipped)
    }

    window.addEventListener('hashchange', () => {
        if (!config.sponsorblock) return;

        const pageUrl = new URL(location.hash.substring(1), location.href)

        if (pageUrl.pathname === '/watch') {
            const videoId = pageUrl.searchParams.get('v')

            const allCategories = ['sponsor', 'selfpromo', 'interaction', 'intro', 'outro', 'preview', 'music_offtopic', 'filler']
            let categories = allCategories.filter(c => config[`sponsorblock_${c}`])
            if (categories.length === 0) categories = ['sponsor']

            sponsorBlock.getSegments(videoId, categories).then((segments) => {
                sponsorBlockSegments = segments;
                activeVideoId = videoId;
                attachToVideo()
            })
        } else {
            activeVideo = null;
            activeVideoId = 0;
            sponsorBlockSegments = []
            if (attachVideoTimeout != null) {
                clearTimeout(attachVideoTimeout)
                attachVideoTimeout = null;
            }
        }
    })
}