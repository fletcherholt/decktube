const rcMod = require('./resolveCommandModifiers')

function toast(title, subtitle) {
    let toastCommand = {
        openPopupAction: {
            popupType: 'TOAST',
            popup: {
                overlayToastRenderer: {
                    title: {
                        simpleText: title
                    },
                    subtitle: {
                        simpleText: subtitle
                    }
                }
            }
        }
    };

    rcMod.resolveCommand(toastCommand)
}

function popupMenu(options) {
    return {
        openPopupAction: {
            popup: {
                overlaySectionRenderer: {
                    dismissalCommand: {
                        signalAction: {
                            signal: 'POPUP_BACK'
                        }
                    },
                    overlay: {
                        overlayTwoPanelRenderer: {
                            actionPanel: {
                                overlayPanelRenderer: {
                                    header: {
                                        overlayPanelHeaderRenderer: {
                                            title: {
                                                simpleText: options.title
                                            }
                                        }
                                    },
                                    content: {
                                        overlayPanelItemListRenderer: {
                                            selectedIndex: options.selectedIndex || 0,
                                            items: options.items,
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };
}

function link(options) {
    return {
        compactLinkRenderer: {
            title: {
                simpleText: options.title
            },
            secondaryIcon: options.icon ? { iconType: options.icon } : undefined,
            serviceEndpoint: {
                commandExecutorCommand: {
                    get commands() {
                        return [
                            options.closeMenu
                                ? {
                                    signalAction: {
                                        signal: 'POPUP_BACK'
                                    }
                                }
                                : undefined,
                            options.callback
                                ? {
                                    signalAction: {
                                        get signal() {
                                            options.callback()
                                            return 'UNKNOWN';
                                        }
                                    }
                                }
                                : undefined,
                            options.createSubMenu
                                ? options.createSubMenu()
                                : undefined
                        ].filter(Boolean)
                    }
                }
            }
        }
    };
}

module.exports = {
    toast,
    popupMenu,
    link
}