/**
 * Replaces placeholders of html with _locale strings
 * @param element HTMLElement
 */
function i18n_replace(element) { 
    element.querySelectorAll(".i18n").forEach(function (node) {
        if (node.hasAttribute("data-id")) {
            if (node instanceof HTMLInputElement) {
                node.value = chrome.i18n.getMessage(node.getAttribute("data-id"));
            } else {
                node.textContent = chrome.i18n.getMessage(node.getAttribute("data-id"));
            }
        }
        if (node.hasAttribute("title-id")) {
            node.title = chrome.i18n.getMessage(node.getAttribute("title-id"));
        }
    });
}

/**
 * Locale Message from list or id
 * @param id ID of locale message
 * @param options (Optional) List of locale message options
 */
function i18n(id, options = []) {
    if (Array.isArray(id)) {
        return id.map((_id) => { return i18n(_id); });
    } else {
        return chrome.i18n.getMessage(id, options);
    }
}