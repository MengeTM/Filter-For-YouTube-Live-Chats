/*
 * Sets json-data of storage
 */
function sync_set(json, callback) {
	chrome.storage.local.set(json, callback);
}

/*
 * Gets json-data of storage
 */
function sync_get(array, callback) {
	chrome.storage.local.get(array, callback);
}
