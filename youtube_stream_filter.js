class YouTubeStreamFilter {

    constructor() {
        // Settings
        this.size = null;  // Size of chat-window
        this.usernames = null;  // Usernames for highlighting
        this.keywords = null;  // Message keywords used for highlighting

        // Html elements
        this.highlightBox = null;  // Live-chat box for highlighting chat messages
        this.separator = null;  // Separator between live-chat and highlighBox for adjusing height
    }

    /*
     * When the string is included in any of the keywords it returns true
     */
    includesAny = function (string, keywords) {
        let any = false;
        for (let keyword of keywords) {
            any = any || string.includes(keyword);
        }

        return any;
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
                if (this.highlightBox !== null && (this.includesAny(authorName, this.usernames) || this.includesAny(message, this.keywords))) {
                    console.log(message);

                    // Adds chat message to highlight chat box
                    this.highlightBox.addMessage(node);
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
            this.usernames = result.usernames || [];
            this.keywords = result.keywords || ["[EN]"];

            this.setHighlightBox();
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
                        // Removes highlighted messages when video is seeked
                        if (this.highlightBox !== null) {
                            this.highlightBox.clear();
                        }
                }
            });

            // Starts messages observer
            this.chatobserver.observe(items, { attributes: false, childList: true, subtree: false });
        } else {  // YouTube player
            // Sends message to background page if YouTube video seeked
            document.getElementsByClassName("video-stream")[0].addEventListener("seeked", () => {
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