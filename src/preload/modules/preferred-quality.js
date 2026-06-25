const configManager = require('../config')

const config = configManager.get()

module.exports = () => {
    let lastApplied = null;

    setInterval(() => {
        if (!config.preferred_quality || config.preferred_quality === 'auto') return;

        let player = document.querySelector('.html5-video-player')
        if (!player || !player.getAvailableQualityData || !player.setPlaybackQualityRange) return;

        let videoId;
        try {
            videoId = player.getVideoData?.()?.video_id;
        } catch {
            return;
        }
        if (!videoId) return;

        let qualities;
        try {
            qualities = player.getAvailableQualityData()
        } catch {
            return;
        }
        if (!qualities || !qualities.length) return;

        let target;
        if (config.preferred_quality === 'highest') {
            target = 'highres';
        } else {
            let cap = parseInt(config.preferred_quality)
            let sorted = qualities
                .map(q => ({ quality: q.quality, n: parseInt(q.qualityLabel) }))
                .filter(x => !isNaN(x.n))
                .sort((a, b) => b.n - a.n)
            let pick = sorted.find(x => x.n <= cap) || sorted[sorted.length - 1]
            target = pick?.quality;
        }
        if (!target) return;

        let signature = `${videoId}:${target}`
        if (signature === lastApplied) return;

        try {
            player.setPlaybackQualityRange(target, target)
            lastApplied = signature;
            console.log('[Quality] set', target, 'for', videoId)
        } catch (err) {
            console.error('[Quality] failed to set', err)
        }
    }, 1000)
}
