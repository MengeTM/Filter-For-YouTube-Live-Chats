/*
 * Sets json-data of storage
 */
function sync_set(json) {
	chrome.storage.sync.set(json);
}

/*
 * Gets json-data of storage
 */
function sync_get(array, callback) {
	chrome.storage.sync.get(array, callback);
}
