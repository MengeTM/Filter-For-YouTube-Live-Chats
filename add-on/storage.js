/**
 * Sets json-data of storage
 * @param json JSON data
 * @param callback Function when set data
 */
function sync_set(json, callback) {
	chrome.storage.local.set(json, callback);
}

/**
 * Gets json-data of storage
 * @param array Array of id strings for getting
 * @param callback Function when got data
 */
function sync_get(array, callback) {
    chrome.storage.local.get(array, (result) => {
        
        for (let id of array) {
            switch (id) {
                case "size":
                    if (result.size === undefined) {
                        result.size = 30;
                    }
                    break;
                case "enableHighlight":
                    if (result.enableHighlight === undefined) {
                        result.enableHighlight = true;
                    }
                    break;
                case "expertMode":
                    if (result.expertMode === undefined) {
                        result.expertMode = false
                    }
                    break;
                case "filters":
                    if (chrome.i18n.getUILanguage().startsWith("ja")) {
                        result.filters = result.filters || [{
                            name: `${i18n("filterTranslation")} - JA`,
                            type: "subtitles",
                            data: new TranslationLanguage("ja", new Authors("all"), new TextElement([])).json(),
                            enable: true
                        },
                        {
                            name: `${i18n("filterTranslation")} - JA`,
                            type: "highlight",
                            data: new StringRegex("includes", new StringOption("message"), new TextElement("[JP]; [JA]"), new LogicalArray("some")).json(),
                            enable: true
                        },
                        {
                            name: `${i18n("delete")} - EN`,
                            type: "delete",
                            data: new TranslationLanguage("en", new Authors("all"), new TextElement([])).json(),
                            enable: true
                        }];
                    } else {
                        result.filters = result.filters || [{
                            name: `${i18n("filterTranslation")} - EN`,
                            type: "subtitles",
                            data: new TranslationLanguage("en", new Authors("all"), new TextElement([])).json(),
                            enable: true
                        },
                        {
                            name: `${i18n("filterTranslation")} -  EN`,
                            type: "highlight",
                            data: new StringRegex("includes", new StringOption("message"), new TextElement("[EN]"), new LogicalArray("some")).json(),
                            enable: true
                        }];
                    }
                    break;
                case "enableOverlay":
                    if (result.enableOverlay === undefined) {
                        result.enableOverlay = true;
                    }
                    break;
                case "overlayStyle":
                    result.overlayStyle = result.overlayStyle || {
                        fontSize: "1",
                        fontColor: "white",
                        fontOpacity: "1",
                        backgroundColor: "black",
                        backgroundOpacity: "0.75",
                        fontFamily: "p_sans-serif",
                        align: "center"
                    };
                case "enableOverlayDuration":
                    if (result.enableOverlayDuration === undefined) {
                        result.enableOverlayDuration = true;
                    }
                    break;
                case "overlayDuration":
                    result.overlayDuration = result.overlayDuration || 10;
                    break;
                case "overlayPos":
                    result.overlayPos = result.overlayPos || {
                        left: 0.212,
                        bottom: 0.02,
                        top: 0.98,
                        right: 0.14
                    };

                    // Bug resulting in overlayPos being undefined, breaking overlay
                    if (isNaN(result.overlayPos.left) || isNaN(result.overlayPos.bottom) || isNaN(result.overlayPos.top) || isNaN(result.overlayPos.right)) {
                        console.log("Storage: overlayPos is NaN");
 
                        result.overlayPos = {
                            left: 0.212,
                            bottom: 0.02,
                            top: 0.98,
                            right: 0.14
                        }
                    }
                    break;
            }
        }

        callback(result);
    });
}
