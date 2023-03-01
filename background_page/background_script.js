chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message: " + message.type, message, sender);

    switch (message.type) {
        case "replay":
            chrome.tabs.sendMessage(sender.tab.id, { type: "replay" });
            break;
        case "settings":
            chrome.runtime.openOptionsPage();
            break;
        case "update":
            chrome.tabs.query({ url: "*://www.youtube.com/*" }, (tabs) => {
                for (let tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, { type: "update" });
                }
            });
            break;
    }
});