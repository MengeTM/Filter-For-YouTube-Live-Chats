class YouTubeStreamFilter {
    menu = null;

    constructor() {
        // Settings
        this.size = null;  // Size of chat-window
        this.enableHighlight = null;  // Enables highlight chat-box
        this.filters = null;  // Usernames for highlighting

        // Html elements
        this.highlightBox = null;  // Live-chat box for highlighting chat messages
        this.separator = null;  // Separator between live-chat and highlighBox for adjusing height

        // List of chat-messages for matching
        this.newMessageQueue = [];
    }

    /*
     * Merges messages of a YouTube chat message element and replaces emoji-images with text alts
     */
    mergeMessage(message) {
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
     * Loads add-on settings
     */
    loadOptions() {

        sync_get(["size", "enableHighlight"], (result) => {
            this.size = result.size || 30;
            this.enableHighlight = result.enableHighlight;

            if (this.enableHighlight === undefined) {
                this.enableHighlight = true;
            }

            this.setHighlightBox();

            this.toggleHighlightBox(this.enableHighlight);
        });
    }

    /*
     * Loads add-on filters
     */
    loadFilters() {

        sync_get(["filters"], (result) => {
            this.filters = result.filters || [{
                name: "Hololive EN",
                type: "highlight",
                data_type: "1",
                data: new StringRegex("includes", new StringOption("message"), new TextElement(["[EN]"]), new LogicalArray("some")).json(),
                enable: true
            }];

            // Parses Filter data for logical evaluation and string matching
            this.filters = parseJSON(this.filters);
        });
    }

    /*
     * Toggles highlight chat-box and separator functionallity and visibillity
     */
    toggleHighlightBox(highlight) {
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
    start() {
        if (document.getElementById("player") === null) {  // YouTube live-chat iFrame
            this.loadOptions();
            this.loadFilters();

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
                        break;
                    case "update":
                        console.log("update");
                        this.loadFilters();
                        break;
                }
            });
           
            // Starts messages observer
            this.chatobserver.observe(items, { attributes: false, childList: true, subtree: false });

            this.menu = new Menu(app);

            // Menu item for opening settings page
            let menuItemSettings = new MenuItem(i18n("menuSettingsPage"), chrome.runtime.getURL("menu_item/menu.svg"));
            menuItemSettings.addEventListener("mousedown", () => {
                chrome.runtime.sendMessage({ type: "settings" });
            });
            this.menu.addMenuItem(menuItemSettings);

            // Menu item for toggling highlight chat-box
            let menuItemFilter = new MenuItem(i18n("menuHideHighlight"), chrome.runtime.getURL("menu_item/enable_highlight.svg"));
            menuItemFilter.addEventListener("mousedown", () => {
                this.toggleHighlightBox();
            });
            this.menu.addMenuItem(menuItemFilter);

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
    setHighlightBox() {
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