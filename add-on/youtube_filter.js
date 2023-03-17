class YouTubeFilter {
    menu = null;  // YouTube menu

    constructor() {
        // Settings
        this.size = null;  // Size of chat-window
        this.enableHighlight = null;  // Enables highlight chat-box
        this.filters = null;  // Usernames for highlighting
        this.showMessages = null; // Shows messages at the player

        // HTML Elements
        this.highlightBox = null;  // Live-chat box for highlighting chat messages
        this.separator = null;  // Separator between live-chat and highlighBox for adjusing height

        this.filtering = false;
        this.requestFiltering = false;

        this.setHighlightBox();

        this.loadOptions();
        this.loadFilters();

        let app = document.querySelector("yt-live-chat-app");

        // YouTube chat-box
        let box = document.querySelector("#chat>#item-list>#live-chat-item-list-panel");
        box = box.querySelector("#contents");
        this.items = box.querySelector("#item-scroller>#item-offset>#items");

        // Background page messages
        chrome.runtime.onMessage.addListener((message) => {
            switch (message.type) {
                case "replay":
                    // Removes highlighted messages when video is seeking
                    if (this.highlightBox !== null) {
                        this.highlightBox.clear();
                    }
                    break;
                case "update_filters":
                    console.log("update filters");
                    this.loadFilters();
                    break;
                case "update_box":
                    console.log("update box");
                    this.loadOptions();
                    break;
                case "update_overlay":
                    this.loadOverlayOptions();
                    break;
            }
        });
           
        // Starts messages observer
        this.chatobserver.observe(this.items, { attributes: false, childList: true, subtree: false });

        this.menu = new Menu(app);

        let messages = document.querySelector("#chat-messages");
        parseXML(chrome.runtime.getURL("dropdown_settings/dropdown_settings.html"), (xml) => {
            xml = xml.querySelector("body > div");
            messages.appendChild(xml);
            xml.classList.add("sf-hidden");

            this.dropdownSettings = new DropdownSettings(xml);
        });

        // Menu item for opening settings page
        let menuItemSettings = new MenuItem(i18n("menuSettingsPage"), chrome.runtime.getURL("menu_item/menu.svg"));
        menuItemSettings.addEventListener("click", () => {
            this.dropdownSettings.show(true);
            this.dropdownSettings.dropdownSettings.style.top = `${this.menu.top}px`;
            this.dropdownSettings.dropdownSettings.style.left = `${this.menu.left + this.menu.width - this.dropdownSettings.dropdownSettings.clientWidth}px`;
        });
        this.menu.addMenuItem(menuItemSettings);

        // Menu item for toggling highlight chat-box
        let menuItemFilter = new MenuItem(i18n("menuHideHighlight"), chrome.runtime.getURL("menu_item/enable_highlight.svg"));
        menuItemFilter.addEventListener("click", () => {
            this.toggleHighlightBox();
        });
        this.menu.addMenuItem(menuItemFilter);
    }

    /**
     * Parses YouTube live-chat message element into either a string or a list of strings
     * @param message YouTube live-chat message element
     * @param merge Merges message texts and alt-texts of icons into a string, else returns list of message texts and icon urls
     */
    parseMessage(message, merge=true) {
        let strings = [];
        for (let node of message.childNodes) {
            if (node instanceof HTMLImageElement) {
                // YouTube live-chat icon
                if (merge) {
                    strings.push(node.alt);
                } else {
                    strings.push({ src: node.src });
                }
            } else {
                // Text
                if (merge) {
                    strings.push(node.textContent);
                } else {
                    strings.push({ text: node.textContent });
                }
            }
        }

        if (merge) {
            return strings.join("");
        } else {
            return strings;
        }
    }

    /**
     * Applies filters to a HTMLElement
     */
    filter(element) {
        let authorName = element.querySelector("#author-name");

        if (!element.deleted && authorName !== null) {
            authorName = authorName.textContent;

            let messageElement = element.querySelector("#content>#message");
            let message = this.parseMessage(messageElement, true);
            let rawMessage = this.parseMessage(messageElement, false);

            element.hidden = false;

            // Matches author and message of chat message
            let data = { author: authorName, message: message, rawMessage: rawMessage };
            let match = false;  // Does not apply other filters when already matched
            let deleted = false;  // Deletes node
            for (let filter of this.filters) {
                if (filter.enable) {
                    switch (filter.type) {
                        case "highlight":
                            if (!match && this.enableHighlight && filter.data.evaluate(data)) {
                                console.log("highlight", message);

                                // Div replacing element, for putting element back to its position
                                let div = document.createElement("div");
                                div.inserted = true;
                                element.div = div;

                                this.items.replaceChild(div, element);

                                // Adds chat message to highlight chat 
                                this.highlightBox.addMessage(element);

                                match = true;
                            }
                            break;
                        case "subtitles":
                            if (this.enableOverlay && filter.data.evaluate(data)) {
                                console.log("subtitles", message);

                                // Shows message as YouTube caption overlay
                                chrome.runtime.sendMessage({ type: "overlay", author: authorName, message: message, rawMessage: rawMessage });
                            }
                            break;
                        case "delete":
                            if (!match && filter.data.evaluate(data)) {
                                element.hiddden = true;

                                deleted = true
                            }
                            break;
                    }

                    if (deleted) {
                        break;
                    }
                }
            }
        }
    }

    /*
     * Observer of YouTube live-chat messages 
     */
    chatobserver = new MutationObserver((itemList) => {
        for (let item of itemList) {
            // Added message elements for matching
            for (let node of item.addedNodes) {
                if (this.filters !== null && !node.inserted) {
                    node.inserted = true;
                    this.filter(node);
                }
            }
        }
    });

    /**
     * Loads options for YouTube overlay
     */
    loadOverlayOptions() {
        sync_get(["enableOverlay"], (result) => {
            this.enableOverlay = result.enableOverlay;
        });
    }

    /**
     * Loads add-on settings
     */
    loadOptions() {

        sync_get(["size", "enableHighlight", "enableOverlay"], (result) => {
            this.size = result.size;
            this.enableHighlight = result.enableHighlight;
            this.enableOverlay = result.enableOverlay;

            this.separator.updateSize(this.size);

            this.toggleHighlightBox(this.enableHighlight);
        });
    }

    /*
     * Loads add-on filters
     */
    loadFilters() {

        sync_get(["filters"], (result) => {
            this.filters = result.filters;

            // Parses Filter data for logical evaluation and string matching
            this.filters = parseJSON(this.filters);

            // Synchronizes items filtering
            this.requestFiltering = true;
            if (!this.filtering) {
                this.filtering = true;

                while (this.requestFiltering) {
                    this.requestFiltering = false;

                    this.filterItems();
                }

                this.filtering = false;
            }
        });
    }

    /**
     * Filters YouTube live-chat items
     */
    filterItems() {
        // Put elements back to items
        let i = 0;
        let max = this.highlightBox.items.childNodes.length;
        while (this.highlightBox.items.firstElementChild !== null && i < max) {
            i += 1;

            let element = this.highlightBox.items.firstElementChild;
            try {
                this.items.replaceChild(element, element.div);
            } catch (e) {
                this.highlightBox.items.removeChild(element);
            }
        }

        // Filter items elements
        for (let element of this.items.childNodes) {
            this.filter(element);
        }
    }

    /**
     * Toggles highlight chat-box and separator functionality and visibillity
     * @param highlight (Optional) Highlights chat-box and separator, else toggles chat-box and separator 
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
     * Makes and appends highlighted chat messages box and the separator element
     */
    setHighlightBox() {
        let box = document.querySelector("#chat>#item-list>#live-chat-item-list-panel");
        let contents = box.querySelector("#contents");

        this.highlightBox = new ChatBox();
        this.separator = new Separator(box, this.highlightBox.renderer);

        contents.parentNode.parentNode.appendChild(this.separator.separatorElement);
        contents.parentNode.parentNode.appendChild(this.highlightBox.renderer);

        this.toggleHighlightBox(false);
    }

}