class YouTubeStreamFilter {

    constructor() {
        // Settings
        this.size = null;  // Size of chat-window
        this.enableHighlight = null;  // Enables highlight chat-box
        this.filters = null;  // Usernames for highlighting

        // Html elements
        this.highlightBox = null;  // Live-chat box for highlighting chat messages
        this.separator = null;  // Separator between live-chat and highlighBox for adjusing height
        this.menuItemSettings = null;  // Menu item for opening settings
        this.menuItemFilter = null;  // Menu item for toggling highlight cat-box

        // List of chat-messages for matching
        this.newMessageQueue = [];
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
            // Added message elements for matching
            for (let node of item.addedNodes) {
                this.newMessageQueue.push(node);
                node.hidden = true;
            }
        }

        if (this.filters !== null) {
            // Messages for matching
            for (let node = this.newMessageQueue.shift(); node !== undefined; node = this.newMessageQueue.shift()) {
                let authorName = node.querySelector("#author-name").textContent;

                let message = this.mergeMessage(node.querySelector("#content>#message"));

                // Matches author and message of chat message
                let data = { author: authorName, message: message };
                let match = false;  // Does not apply other filters when already matched
                for (let filter of this.filters) {
                    if (filter.enable) {
                        switch (filter.type) {
                            case "highlight":
                                if (this.enableHighlight && !match && filter.data.evaluate(data)) {
                                    console.log("highlight", message);
                                    node.hidden = false;

                                    // Adds chat message to highlight chat box
                                    this.highlightBox.addMessage(node);
                                    match = true;
                                }
                                break;
                            case "delete":
                                if (!match && filter.data.evaluate(data)) {

                                    node.parentNode.removeChild(node);
                                    match = true;
                                }
                                break;
                        }
                    }
                }

                node.hidden = false;
            }
        }
    });

    /*
     * Observer of YouTube live chat menu
     */
    settingsobserver = new MutationObserver((itemList) => {
        for (let item of itemList) {
            for (let node of item.addedNodes) {
                if (node.id != "sf-menu-item") {
                    console.log("Settings update");

                    // Adds menu items
                    node.parentNode.appendChild(this.menuItemSettings.element);
                    node.parentNode.appendChild(this.menuItemFilter.element);
                }
            }
        }
    });

    /*
     * Observer of YouTube live chat app
     */
    appobserver = new MutationObserver((itemList) => {
        for (let item of itemList) {
            for (let node of item.addedNodes) {
                if (node.nodeName.toLowerCase() == "tp-yt-iron-dropdown") {
                    console.log("Settings added");

                    let menu = node.querySelector("ytd-menu-popup-renderer>#items");

                    // YouTube live chat menu added
                    this.settingsobserver.observe(menu, { attributes: false, childList: true, subtree: false });
                    this.appobserver.disconnect();
                }
            }
        }
    });


    /*
     * Loads add-on settings
     */
    loadOptions = function () {

        sync_get(["size", "enableHighlight", "filters"], (result) => {
            this.size = result.size || 30;
            this.enableHighlight = result.enableHighlight;
            this.filters = result.filters || [{
                name: "Hololive EN",
                type: "highlight",
                data_type: "1",
                data: new StringRegex("includes", new StringOption("message"), new TextElement(["[EN]"]), new LogicalArray("some")).json(),
                enable: true
            }];

            if (this.enableHighlight === undefined) {
                this.enableHighlight = true;
            }

            this.setHighlightBox();

            this.toggleHighlightBox(this.enableHighlight);

            // Parses Filter data for logical evaluation and string matching
            let parser = new JSONParser();
            this.filters = parser.parseJSON(this.filters);
        });
    }

    /*
     * Toggles highlight chat-box and separator functionallity and visibillity
     */
    toggleHighlightBox = function (highlight) {
        if (this.highlightBox !== null) {
            if (highlight === undefined) {
                this.enableHighlight = !this.enableHighlight;
                sync_set({ enableHighlight: this.enableHighlight });
            } else {
                this.enableHighlight = highlight;
            }

            if (this.enableHighlight) {
                this.highlightBox.renderer.classList.remove("sf-hidden");
                this.separator.separatorElement.classList.remove("sf-hidden");
                this.separator.updateSize(this.size);
            } else {
                this.highlightBox.renderer.classList.add("sf-hidden");
                this.separator.separatorElement.classList.add("sf-hidden");
                this.separator.updateSize(0);
            }
        }
    }

    /*
     * Starts add-on
     */
    start = function () {
        if (document.getElementById("player") === null) {  // YouTube live-chat iFrame
            this.loadOptions();

            // Menu item for opening settings page
            this.menuItemSettings = new MenuItem(i18n("menuSettingsPage"), chrome.runtime.getURL("menu.svg"));
            this.menuItemSettings.element.addEventListener("mousedown", (event) => {
                event.preventDefault();

                chrome.runtime.sendMessage({ type: "settings" });
            });

            // Menu item for toggling highlight chat-box
            this.menuItemFilter = new MenuItem(i18n("menuHideHighlight"), chrome.runtime.getURL("enable_highlight.svg"));
            this.menuItemFilter.element.addEventListener("mousedown", (event) => {
                event.preventDefault();
                this.toggleHighlightBox();
            });

            let app = document.querySelector("yt-live-chat-app");

            // YouTube chat-box
            let box = document.querySelector("#chat>#item-list>#live-chat-item-list-panel");
            box = box.querySelector("#contents");
            let items = box.querySelector("#item-scroller>#item-offset>#items");

            // Background page messages
            chrome.runtime.onMessage.addListener((message) => {
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

            this.appobserver.observe(app, { attributes: false, childList: true, subtree: false });


        } else {  // YouTube player
            // Sends message to background page if YouTube video seeking
            document.getElementsByClassName("video-stream")[0].addEventListener("seeking", () => {
                chrome.runtime.sendMessage({ "type": "replay" });
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