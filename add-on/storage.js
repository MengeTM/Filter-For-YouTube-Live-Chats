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
                        name: "Hololive EN",
                        type: "subtitles",
                        data: new TranslationLanguage("en").json(),
                        enable: true
                    },
                    {
                        name: "Hololive EN",
                        type: "highlight",
                        data: new StringRegex("includes", new StringOption("message"), new TextElement("[EN]"), new LogicalArray("some")).json(),
                        enable: true
                    }];

                    // For users of v0.1.5
                    for (let filter of result.filters) {
                        if (filter.data.type == "LanguageMessage" && (filter.data.name == "en" || filter.data.name == "de")) {
                            filter.data.name = "latin";
                            sync_set({ filters: result.filters });
                        }
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
                        result.enableOverlayDuration = false;
                    }
                    break;
                case "overlayDuration":
                    result.overlayDuration = result.overlayDuration || 5;
                    break;
            }
        }

        callback(result);
    });
}
