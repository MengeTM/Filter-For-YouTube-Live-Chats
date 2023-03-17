chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message: " + message.type, message, sender);

    switch (message.type) {
        case "replay":
            // Sends player seekstart
            chrome.tabs.sendMessage(sender.tab.id, { type: "replay" });
            break;
        case "overlay":
            // Sends a message from live-chat to youtube
            let params = new URLSearchParams(sender.url);
            if (params.has("is_popout") && params.get("is_popout") == "1") {
                chrome.tabs.query({ url: `*://www.youtube.com/watch?=${params.get("v")}` }, (tabs) => {
                    for (let tab of tabs) {
                        chrome.tabs.sendMessage(tab.id, message);
                    }
                });
            } else {
                chrome.tabs.sendMessage(sender.tab.id, message);
            }
            break;
        case "settings":
            // Settings page
            chrome.runtime.openOptionsPage();
            break;
        case "update_filters":
            // Sends that settings should be updated
            chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
                for (let tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, { type: "update_filters" });
                }
            });
            break;
        case "update_box":
            chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
                for (let tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, { type: "update_box" });
                }
            });
            break;
        case "update_overlay":
            chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
                for (let tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, { type: "update_overlay" });
                }
            });
            break;
    }
});