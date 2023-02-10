class YouTubeStreamFilter {

    constructor() {
        // Settings
        this.size = null;  // Size of chat-window
        this.enableHighlight = null;
        this.filters = null;  // Usernames for highlighting

        // Html elements
        this.highlightBox = null;  // Live-chat box for highlighting chat messages
        this.separator = null;  // Separator between live-chat and highlighBox for adjusing height
        this.menuItemSettings = null;
        this.menuItemFilter = null;

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
            // Added message elements
            for (let node of item.addedNodes) {
                this.newMessageQueue.push(node);
                node.hidden = true;
            }
        }

        if (this.filters !== null) {
            for (let node = this.newMessageQueue.shift(); node !== undefined; node = this.newMessageQueue.shift()) {
                let authorName = node.querySelector("#author-name").textContent;

                let message = this.mergeMessage(node.querySelector("#content>#message"));

                // Matches author and message of chat message
                let data = { author: authorName, message: message };
                let addChatBox = true;
                for (let filter of this.filters) {
                    if (filter.enable) {
                        switch (filter.type) {
                            case "highlight":
                                if (this.highlightBox !== null && addChatBox && filter.data.evaluate(data)) {
                                    console.log("highlight", message);
                                    node.hidden = false;

                                    // Adds chat message to highlight chat box
                                    this.highlightBox.addMessage(node);
                                    addChatBox = false;
                                }
                                break;
                            case "delete":
                                if (addChatBox && filter.data.evaluate(data)) {
                                    console.log("delete", message);

                                    node.parentNode.removeChild(node);
                                    addChatBox = false;
                                }
                                break;
                        }
                    }
                }

                node.hidden = false;
            }
        }
    });

    settingsobserver = new MutationObserver((itemList) => {
        for (let item of itemList) {
            for (let node of item.addedNodes) {
                if (node.id != "sf-menu-item") {
                    console.log("Settings update");

                    node.parentNode.appendChild(this.menuItemSettings.element);
                    node.parentNode.appendChild(this.menuItemFilter.element);
                }
            }
        }
    });

    appobserver = new MutationObserver((itemList) => {
        for (let item of itemList) {
            for (let node of item.addedNodes) {
                if (node.nodeName.toLowerCase() == "tp-yt-iron-dropdown") {
                    console.log("Settings added");

                    let menu = node.querySelector("ytd-menu-popup-renderer>#items");

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

        let getting = browser.storage.sync.get();
        getting.then((result) => {

            this.size = result.size || 30;
            this.enableHighlight = result.enableHighlight;
            this.filters = result.filters || {
                name: "",
                type: "highlight",
                data_type: "1",
                data: new StringRegex("includes", new StringOption("message"), new TextElement(["[EN]"]), new LogicalArray("some")),
                enable: true
            };

            if (this.enableHighlight === undefined) {
                this.enableHighlight = true;
            }

            this.setHighlightBox();

            if (this.enableHighlight) {
                this.toggleHighlightBox(this.enableHighlight);
            }

            let parser = new JSONParser();
            this.filters = parser.parseJSON(this.filters);
        }, (error) => {
            console.log(`Error: ${error}`);
        });
    }

    toggleHighlightBox = function (highlight) {
        if (this.highlightBox !== null) {
            if (highlight === undefined) {
                this.enableHighlight = !this.enableHighlight;
                browser.storage.sync.set({ enableHighlight: this.enableHighlight });
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

            this.menuItemSettings = new MenuItem(i18n("menuSettingsPage"), browser.runtime.getURL("menu.svg"));
            this.menuItemSettings.element.addEventListener("mousedown", (event) => {
                event.preventDefault();

                browser.runtime.sendMessage({ type: "settings" });
            });

            this.menuItemFilter = new MenuItem(i18n("menuHideHighlight"), browser.runtime.getURL("enable_highlight.svg"));
            this.menuItemFilter.element.addEventListener("mousedown", (event) => {
                event.preventDefault();
                this.toggleHighlightBox();
            });

            let app = document.querySelector("yt-live-chat-app");

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

            this.appobserver.observe(app, { attributes: false, childList: true, subtree: false });


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