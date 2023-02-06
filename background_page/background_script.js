class MessageListener {

    constructor() {

    }

    start = function () {
        browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log("Received message: " + message.type, message, sender);

            switch (message.type) {
                case "replay":
                    browser.tabs.sendMessage(sender.tab.id, { type: "replay" });
                    break;
            }
        });
    }
}

let messageListener = new MessageListener();
messageListener.start();
