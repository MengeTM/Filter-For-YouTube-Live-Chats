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
                    result.size = result.size || 30;
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
                    result.filters = result.filters || [{
                        name: "Translations - EN",
                        type: "subtitles",
                        data: new TranslationLanguage("en", new Authors("all"), new TextElement([])).json(),
                        enable: true
                    },
                    {
                        name: "Hololive EN",
                        type: "highlight",
                        data: new StringRegex("includes", new StringOption("message"), new TextElement("[EN]"), new LogicalArray("some")).json(),
                        enable: true
                    }];
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
                        result.enableOverlayDuration = false;
                    }
                    break;
                case "overlayDuration":
                    result.overlayDuration = result.overlayDuration || 5;
                    break;
                case "overlayPos":
                    result.overlayPos = result.overlayPos || {
                        left: 0.212,
                        bottom: 0.02,
                        top: 0.98,
                        right: 0.788
                    };
                    break;
            }
        }

        callback(result);
    });
}
