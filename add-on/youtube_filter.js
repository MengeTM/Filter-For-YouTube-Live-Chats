class YouTubeFilter {
    menu = null;  // YouTube menu

    constructor() {
        // Settings
        this.enableHighlight = null;  // Enables highlight chat-box
        this.filters = null;  // Usernames for highlighting
        this.showMessages = null; // Shows messages at the player

        // HTML Elements
        this.highlightBox = null;  // Live-chat box for highlighting chat messages
        this.separator = null;  // Separator between live-chat and highlighBox for adjusing height

        this.filtering = false;
        this.requestFiltering = false;

        this._setHighlightBox();

        this._loadOptions();
        this._loadFilters();

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
                    this._loadFilters();
                    break;
                case "update_box":
                    console.log("update box");
                    this._loadOptions();
                    break;
                case "update_overlay":
                    this._loadOverlayOptions();
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

            this._updateColorScheme();
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
        // this.menu.addMenuItem(menuItemFilter);
    }

    /**
     * Parses YouTube live-chat message element into either a string or a list of strings
     * @param {HTMLElement} message YouTube live-chat message element
     * @param {Boolean} merge Merges message texts and alt-texts of icons into a string, else returns list of message texts and icon urls
     * @returns String or list of strings
     */
    _parseMessage(message, merge=true) {
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
     * Updates DropdownSettings color scheme for YouTube color scheme
     */
    _updateColorScheme() {
        const style = getComputedStyle(document.querySelector("#content-pages"));

        if (style.getPropertyValue("--yt-live-chat-primary-text-color") == style.getPropertyValue("--yt-spec-text-primary")) {
            this.dropdownSettings.dropdownSettings.style.colorScheme = "light";
        } else {
            this.dropdownSettings.dropdownSettings.style.colorScheme = "dark";
        }
    }

    /**
     * Applies filters to a HTMLElement
     * @param {HTMLElement} element Message element to be filtered
     */
    filter(element) {
        let authorName = element.querySelector("#author-name");

        if (!element.deleted && authorName !== null) {
            authorName = authorName.textContent;

            const messageElement = element.querySelector("#content>#message");
            const message = this._parseMessage(messageElement, true);
            const rawMessage = this._parseMessage(messageElement, false);

            element.hidden = false;

            // Matches author and message of chat message
            const data = { author: authorName, message: message, rawMessage: rawMessage };
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
                                element.hidden = true;

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
    _loadOverlayOptions() {
        sync_get(["enableOverlay"], (result) => {
            this.enableOverlay = result.enableOverlay;
        });
    }

    /**
     * Loads add-on settings
     */
    _loadOptions() {

        sync_get(["size", "enableHighlight", "enableOverlay"], (result) => {
            this.enableHighlight = result.enableHighlight;
            this.enableOverlay = result.enableOverlay;

            this.separator.setSize(result.size);

            this.toggleHighlightBox(this.enableHighlight);
        });
    }

    /*
     * Loads add-on filters
     */
    _loadFilters() {
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

                    this.filterAll();
                }

                this.filtering = false;
            }
        });
    }

    /**
     * Filters YouTube live-chat items
     */
    filterAll() {
        // Put elements back to items
        let i = 0;
        const max = this.highlightBox.items.childNodes.length;
        while (this.highlightBox.items.firstElementChild !== null && i < max) {
            i += 1;

            const element = this.highlightBox.items.firstElementChild;
            element.deleted = false;
            element.hidden = false;
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
     * @param {Boolean} highlight (Optional) Highlights chat-box and separator, else toggles chat-box and separator 
     */
    toggleHighlightBox(highlight) {
        if (this.highlightBox !== null) {
            if (highlight === undefined) {
                this.enableHighlight = !this.enableHighlight;
                sync_set({ enableHighlight: this.enableHighlight });
            } else {
                this.enableHighlight = highlight;
            }

            this.separator.setVisible(this.enableHighlight);
        }
    }

    /*
     * Makes and appends highlighted chat messages box and the separator element
     */
    _setHighlightBox() {
        let box = document.querySelector("#chat>#item-list>#live-chat-item-list-panel");
        let contents = box.querySelector("#contents");

        this.highlightBox = new ChatBox();
        this.separator = new Separator(box, this.highlightBox.renderer);

        contents.parentNode.parentNode.appendChild(this.separator.separatorElement);
        contents.parentNode.parentNode.appendChild(this.highlightBox.renderer);

        this.toggleHighlightBox(false);
    }

}