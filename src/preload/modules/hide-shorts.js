const xhrModifiers = require('../util/xhrModifiers')
const configManager = require('../config')
const config = configManager.get()

function isShortsShelf(shelf) {
    if (!shelf) return false;
    if (shelf.tvhtml5ShelfRendererType === 'TVHTML5_SHELF_RENDERER_TYPE_SHORTS') return true;
    let title = shelf.headerRenderer?.shelfHeaderRenderer?.avatarLockup?.avatarLockupRenderer?.title?.runs?.[0]?.text
        || shelf.title?.runs?.[0]?.text;
    return title === 'Shorts';
}

function isShortsTile(item) {
    return !!(item?.tileRenderer?.onSelectCommand?.reelWatchEndpoint
        || item?.tileRenderer?.tvhtml5ShelfRendererType === 'TVHTML5_TILE_RENDERER_TYPE_SHORTS');
}

module.exports = () => {
    xhrModifiers.addResponseModifier(async (url, text) => {
        if (!config.hide_shorts) return;

        if (!url.startsWith('/youtubei/v1/browse') && !url.startsWith('/youtubei/v1/search')) {
            return;
        }

        let json;
        try {
            json = JSON.parse(text)
        } catch {
            return;
        }

        let sectionList = json.continuationContents?.sectionListContinuation
            || json.contents?.tvBrowseRenderer?.content?.tvSurfaceContentRenderer?.content?.sectionListRenderer
            || json.contents?.sectionListRenderer;
        if (!sectionList?.contents) return;

        sectionList.contents = sectionList.contents.filter(i => !isShortsShelf(i?.shelfRenderer))

        for (let section of sectionList.contents) {
            let horizontal = section?.shelfRenderer?.content?.horizontalListRenderer;
            if (horizontal?.items) {
                horizontal.items = horizontal.items.filter(i => !isShortsTile(i))
            }
        }

        return JSON.stringify(json);
    })
}