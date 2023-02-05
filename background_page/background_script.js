function MessageListener() {

    const that = this;

    this.start = function () {
        browser.runtime.onMessage.addListener(onMessage);
    }

    function onError(error) {
        console.log(error);
    }


    function onMessage(message, sender, sendResponse) {
        console.log("Received message: " + message.type, message, sender);
        switch (message.type) {
            case "replay":
                browser.tabs.sendMessage(sender.tab.id, { type: "replay" });
                break;
        }
    }
}

var messageListener = new MessageListener();
messageListener.start();
