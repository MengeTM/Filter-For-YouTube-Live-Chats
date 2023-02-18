chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message: " + message.type, message, sender);

    switch (message.type) {
        case "replay":
            chrome.tabs.sendMessage(sender.tab.id, { type: "replay" });
            break;
        case "settings":
            chrome.runtime.openOptionsPage();
            break;
    }
});