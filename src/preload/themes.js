function build({ bg, surface, accent, accentText = '#ffffff', text }) {
    return `
body {
    background-color: ${surface} !important;
}

#container,
.ytLrTvBrowseRendererHost,
.ytLrGuideResponseContainer,
.ytLrClassicSearchPageHost,
.ytLrAccountSelectorHost {
    background-color: ${bg} !important;
}

.ytLrTileRendererFocused.ytLrTileRendererFocusAppearanceRing .ytLrTileRendererHeader::after {
    border-color: ${accent} !important;
}

.ytLrButtonListShape.ytLrButtonFocused,
.ytLrToggleButtonShapeButtonToggled {
    background-color: ${accent} !important;
    color: ${accentText} !important;
}

.ytLrTileMetadataRendererHighlighted .ytLrTileMetadataRendererTitle {
    color: ${text} !important;
}

.ytLrTextBoxFocusable {
    border-color: ${accent} !important;
}

.ytLrProgressBarPlayed,
.ytLrProgressBarPlayhead {
    background-color: ${accent} !important;
}
`.trim()
}

const themes = [
    { id: 'none', name: 'Default (YouTube)', css: '' },
    {
        id: 'catppuccin-mocha',
        name: 'Catppuccin Mocha',
        css: build({ bg: '#1e1e2e', surface: '#11111b', accent: '#cba6f7', accentText: '#11111b', text: '#cdd6f4' })
    },
    {
        id: 'oled-black',
        name: 'OLED Black',
        css: build({ bg: '#000000', surface: '#000000', accent: '#ff0000', accentText: '#ffffff', text: '#ffffff' })
    },
    {
        id: 'dracula',
        name: 'Dracula',
        css: build({ bg: '#282a36', surface: '#21222c', accent: '#bd93f9', accentText: '#21222c', text: '#f8f8f2' })
    },
    {
        id: 'nord',
        name: 'Nord',
        css: build({ bg: '#2e3440', surface: '#272c36', accent: '#88c0d0', accentText: '#2e3440', text: '#eceff4' })
    },
    {
        id: 'gruvbox-dark',
        name: 'Gruvbox Dark',
        css: build({ bg: '#282828', surface: '#1d2021', accent: '#fabd2f', accentText: '#1d2021', text: '#ebdbb2' })
    }
]

module.exports = themes;
