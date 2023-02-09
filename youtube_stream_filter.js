class YouTubeStreamFilter {

    constructor() {
        // Settings
        this.size = null;  // Size of chat-window
        this.enableHighlight = null;
        this.filters = null;  // Usernames for highlighting

        // Html elements
        this.highlightBox = null;  // Live-chat box for highlighting chat messages
        this.separator = null;  // Separator between live-chat and highlighBox for adjusing height
    }

    /*
     * Merges messages of a YouTube chat message element and replaces emoji-images with text alts
     */
    mergeMessage = function (message) {
        let stringMessage = "";
        let string;
        for (let node of message.childNodes) {
            if (node instanceof HTMLImageElement) {
                string = node.alt;
            } else {
                string = node.textContent;
            }

            stringMessage += string;
        }

        return stringMessage;
    }

    /*
     * Observer of YouTube live-chat messages 
     */
    chatobserver = new MutationObserver((itemList) => {
        for (let item of itemList) {
            // Added message elements
            for (let node of item.addedNodes) {
                let authorName = node.querySelector("#author-name").textContent;

                let message = this.mergeMessage(node.querySelector("#content>#message"));


                // Matches author and message of chat message
                let data = { author: authorName, message: message };
                let move = true;
                if (this.filters !== null) { 
                    for (let filter of this.filters) {
                        if (filter.enable) {
                            switch (filter.type) {
                                case "highlight":
                                    if (this.highlightBox !== null && move && filter.data.evaluate(data)) {
                                        console.log("highlight", message);

                                        // Adds chat message to highlight chat box
                                        this.highlightBox.addMessage(node);
                                        move = false;
                                    }
                                    break;
                                case "delete":
                                    if (move && filter.data.evaluate(data)) {
                                        console.log("delete", message);

                                        node.parentNode.removeChild(node);
                                        move = false;
                                    }
                                    break;
                            }
                        }
                    }
                }
                
            }
        }
    });


    /*
     * Loads add-on settings
     */
    loadOptions = function () {

        let getting = browser.storage.sync.get();
        getting.then((result) => {

            this.size = result.size || 30;
            this.enableHighlight = result.enableHighlight;
            this.filters = result.filters || {
                name: "",
                type: "highlight",
                data_type: "1",
                data: new LogicalArray("some", new StringRegex("includes", new StringOption("message"), new TextElement(["[]"]))),
                enable: true
            };

            if (this.enableHighlight === undefined) {
                this.enableHighlight = true;
            }

            if (this.enableHighlight) {
                this.setHighlightBox();
            }

            let parser = new JSONParser();
            this.filters = parser.parseJSON(this.filters);
        }, (error) => {
            console.log(`Error: ${error}`);
        });
    }

    /*
     * Starts add-on
     */
    start = function () {
        if (document.getElementById("player") === null) {  // YouTube live-chat iFrame
            this.loadOptions();

            let box = document.querySelector("#chat>#item-list>#live-chat-item-list-panel");
            box = box.querySelector("#contents");
            let items = box.querySelector("#item-scroller>#item-offset>#items");

            // Background page messages
            browser.runtime.onMessage.addListener((message) => {
                switch (message.type) {
                    case "replay":
                        // Removes highlighted messages when video is seeking
                        if (this.highlightBox !== null) {
                            this.highlightBox.clear();
                        }
                }
            });

            // Starts messages observer
            this.chatobserver.observe(items, { attributes: false, childList: true, subtree: false });
        } else {  // YouTube player
            // Sends message to background page if YouTube video seeking
            document.getElementsByClassName("video-stream")[0].addEventListener("seeking", () => {
                browser.runtime.sendMessage({ "type": "replay" });
            });
        }
    }

    /*
     * Makes and appends highlighted chat messages box and the separator element
     */
    setHighlightBox = function () {
        let box = document.querySelector("#chat>#item-list>#live-chat-item-list-panel");
        let contents = box.querySelector("#contents");

        this.highlightBox = new ChatBox();
        this.separator = new Separator(box, this.highlightBox.renderer);

        contents.parentNode.parentNode.appendChild(this.separator.separatorElement);
        contents.parentNode.parentNode.appendChild(this.highlightBox.renderer);

        this.separator.updateSize(this.size);
    }

}

let youtubeStreamFilter = new YouTubeStreamFilter();
youtubeStreamFilter.start();