class DropdownSettings {
    enableOverlay = null;  // Enable overlay
    overlayStyle = null;  // JSON overlay style

    filters = null;  // List of filters
    expertMode = null;  // Expert mode

    overlayElements = [];

    constructor(dropdownSettings) {
        this.dropdownSettings = dropdownSettings || document;

        parseXML(chrome.runtime.getURL("../menu_item/menu.svg"), (svg) => {
            svg.classList.add("sf-icon");
            let settingsIcon = this.dropdownSettings.querySelector("#sf-settings-icon");
            settingsIcon.parentElement.replaceChild(svg, settingsIcon);
        });

        this.dropdownSettings.querySelector("#sf-enable-overlay").addEventListener("change", () => {
            this.enableOverlay = this.dropdownSettings.querySelector("#sf-enable-overlay").checked;

            sync_set({ enableOverlay: this.enableOverlay });

            this.updateOverlay();
        });

        this.dropdownSettings.querySelector("#sf-settings-controls > div").addEventListener("click", () => {
            chrome.runtime.sendMessage({ type: "settings" });
        });

        i18n_replace(this.dropdownSettings);

        this.setOverlayStyle();

        this.loadOptions();

        this.dropdownSettings.addEventListener("focusout", () => {
            this.show(false);
        });
    }

    /**
     * Loads settings
     */
    loadOptions() {
        sync_get(["enableOverlay", "overlayStyle", "filters", "expertMode"], (result) => {
            this.enableOverlay = result.enableOverlay;
            this.overlayStyle = result.overlayStyle;
            this.filters = result.filters;
            this.expertMode = result.expertMode;

            this.update();
        });
    }

    /**
     * Updates HTMLElements with settings
     */
    update() {
        this.dropdownSettings.querySelector("#sf-enable-overlay").checked = this.enableOverlay;

        this.setFilters();
        this.updateOverlayStyle();

    }

    /**
     * Shows dropdown menu
     * @param show Shows dropdown menu
     */
    show(show) {
        if (show) {
            this.dropdownSettings.classList.remove("sf-hidden");
            this.dropdownSettings.focus()
        } else {
            this.dropdownSettings.classList.add("sf-hidden");
        }
    }

    /**
     * Makes and inserts new filter
     * @param filterData JSON filter
     */
    newFilter(filterData) {
        // Switch enable filter
        let filterSwitch = new ToggleSwitch();
        filterSwitch.checkbox.checked = filterData.enable;
        filterSwitch.element.title = i18n("titleSwitchEnableFilter");
        filterSwitch.checkbox.addEventListener("change", () => {
            filterData.enable = filterSwitch.checkbox.checked;

            this.saveFilters();
        });

        // Image delete filter
        let filterDelete = document.createElement("img");
        filterDelete.src = chrome.runtime.getURL("../settings/filters/trash.svg");
        filterDelete.classList.add("sf-item");
        filterDelete.title = i18n("titleDeleteFilter");
        filterDelete.draggable = true;
        filterDelete.addEventListener("dragstart", (event) => { event.preventDefault(); event.stopPropagation(); });

        // Dropdown filter settings
        let dropdown = new DropDown(filterData.name, filterSwitch.element, filterDelete);

        filterDelete.addEventListener("click", () => {
            if (confirm(i18n("deleteFilterMessage", filter.name))) {
                this.filters = this.filters.filter((item) => { return item !== filterData });
                dropdown.element.parentElement.removeChild(dropdown.element);

                this.saveFilters();
            }
        });

        // Filter action
        let block = new Block(i18n("filterAction"));
        let action = new Action(filterData.action);
        block.appendChild(action.element);
        dropdown.appendChild(block.element);

        // Filter rule
        block = new Block(i18n("filterRule"));
        let filter = new FilterRule(null, parseJSON(filterData.data));
        filter.element.classList.add("sf-filter");
        filter.addEventListener("change", () => {
            filterData.data = filter.json();

            this.saveFilters();
        });
        block.appendChild(filter.element);
        dropdown.appendChild(block.element);

        return dropdown.element;
    }

    /**
     * Adds filters
     */
    setFilters() {
        let filters = new DropDown(i18n("filterRule"));
        filters.element.id = "sf-filters";
        this.dropdownSettings.querySelector("#sf-filters").parentElement.replaceChild(filters.element, this.dropdownSettings.querySelector("#sf-filters"));

        // Delete filters
        filters.clear();

        let newFilterBox = document.createElement("div");
        newFilterBox.classList.add("sf-new-filter");

        let newFilter = new BaseSelect("filter_translation", ["filter_translation", "filter_language", "filter_1", "filter_2"], i18n(["filterTranslation", "filterLanguage", "filter1", "filter2"]));
        newFilter.title = i18n("titleSelectNewFilterType");

        let btnNewFilter = document.createElement("input");
        btnNewFilter.type = "button";
        btnNewFilter.value = i18n("newFilter");
        btnNewFilter.title = i18n("titleNewFilter");
        btnNewFilter.addEventListener("click", () => {
            let json = null;
            switch (newFilter.element.value) {
                case "filter_translation":
                    // Language translation
                    json = {
                        name: "Translations - EN",
                        type: "subtitles",
                        data: new TranslationLanguage("en", new Authors("all"), new TextElement([])).json(),
                        enable: true
                    };
                    break;
                case "filter_language":
                    // Language
                    json = {
                        name: "Characters - Latin",
                        type: "highlight",
                        data: new Language("latin").json(),
                        enable: true
                    };
                    break;
                // One logical block
                case "filter_1":
                    json = {
                        name: "",
                        type: "highlight",
                        data: new StringRegex("includes", new StringOption("message"), new TextElement([]), new LogicalArray("some")).json(),
                        enable: true
                    };
                    break;
                // Two logical blocks with logical and
                case "filter_2":
                    json = {
                        name: "",
                        type: "highlight",
                        data: new LogicalBinary("and", new StringRegex("includes", new StringOption("author"), new TextElement([]), new LogicalArray("some")), new StringRegex("includes", new StringOption("message"), new TextElement([]), new LogicalArray("some"))).json(),
                        enable: true
                    };
                    break;
            }
            this.filters.push(json);

            filters.appendChild(this.newFilter(json));

            this.saveFilters();
        });
        newFilterBox.appendChild(btnNewFilter);
        newFilterBox.appendChild(newFilter.element);

        filters.box.appendChild(newFilterBox);

        // Add filters
        for (let filterData of this.filters) {
            let filter = this.newFilter(filterData);
            filters.appendChild(filter);
        }
    }

    /**
     * Update overlay style
     */
    updateOverlayStyle() {
        for (let element of this.overlayElements) {
            element.element.value = this.overlayStyle[element.key];
        }
    }

    /**
     * Settings overlay style
     */
    setOverlayStyle() {
        let overlayStyle = new DropDown(i18n("btnOverlaySettings"));
        overlayStyle.element.id = "sf-overlay-style";
        this.dropdownSettings.querySelector("#sf-overlay-style").parentNode.replaceChild(overlayStyle.element, this.dropdownSettings.querySelector("#sf-overlay-style"));

        this.overlayElements = [];

        let addItem = (element) => {
            this.overlayElements.push(element);

            element.element.addEventListener("change", () => {
                this.overlayStyle[element.key] = element.element.value;

                sync_set({ overlayStyle: this.overlayStyle });
                this.updateOverlay();
            });

            let block = new Block(i18n(element.key));
            block.appendChild(element.element);

            overlayStyle.appendChild(block.element);
        }

        addItem(new SelectFontSize("fontSize"));
        addItem(new SelectColor("fontColor"));
        addItem(new SelectOpacity("fontOpacity"));
        addItem(new SelectColor("backgroundColor"));
        addItem(new SelectOpacity("backgroundOpacity"));
        addItem(new SelectFontFamily("fontFamily"));
        addItem(new SelectAlign("align"));
    }

    /**
     * Saves filter settings
     */
    saveFilters() {
        sync_set({ filters: this.filters });

        this.updateFilters();
    }

    /**
     * Updates highlight chat-box settings
     */
    updateSettings() {
        chrome.runtime.sendMessage({ type: "update_settings" });
    }

    /**
     * Updates overlay settings
     */
    updateOverlay() {
        chrome.runtime.sendMessage({ type: "update_overlay" });
    }

    /**
     * Updates filter settings
     */
    updateFilters() {
        chrome.runtime.sendMessage({ type: "update_filters" });
    }
}

class DropDown {
    left = "❮";
    right = "❯";

    open = false;  // Dropdown box open

    constructor(title, item_0=null, item_1=null) {
        if (item_0 === null) {
            item_0 = document.createElement("div");
        }
        if (item_1 === null) {
            item_1 = document.createElement("div");
        }

        this.item_0 = item_0;  // Item close index
        this.item_1 = item_1;  // Item open index

        // Dropdown element
        this.element = document.createElement("div");
        this.element.classList.add("sf-dropdown");

        // Index opening dropdown
        this.index = document.createElement("div");
        this.index.classList.add("sf-dropdown-index");
        this.index.classList.add("sf-align");
        this.index.addEventListener("click", () => {
            this.open = !this.open;

            this.update();
        });
        this.element.appendChild(this.index);

        // Index
        this.index.appendChild(this.item_0);

        // Index title
        this.title = document.createElement("span");
        this.title.classList.add("sf-title");
        this.title.textContent = title;
        this.index.appendChild(this.title);

        // Index icon
        this.icon = document.createElement("span");
        this.icon.classList.add("sf-icon");
        this.index.appendChild(this.icon);

        // Dropdown box
        this.box = document.createElement("div");
        this.box.classList.add("sf-dropdown-box");
        this.element.appendChild(this.box);

        this.scroll = document.createElement("div");
        this.scroll.classList.add("sf-scroll");
        this.box.appendChild(this.scroll);

        this.update();
    }

    /**
     * Appends HTMLElement as dropdown element
     * @param element HTMLElement
     */
    appendChild(element) {
        this.scroll.appendChild(element);
    }

    /**
     * Deletes dropdown elements
     */
    clear() {
        while (this.scroll.firstElementChild !== null) {
            this.scroll.removeChild(this.scroll.firstElementChild);
        }
    }

    /**
     * Updates dropdown open
     */
    update() {
        if (this.open) {
            this.icon.textContent = this.left;
            this.box.style.height = "auto";
            this.element.classList.add("sf-fullmenu");
            try {
                this.index.replaceChild(this.item_1, this.item_0);
            } catch (e) {

            }
        } else {
            this.icon.textContent = this.right;
            this.box.style.height = "0px";
            this.element.classList.remove("sf-fullmenu");
            try {
                this.index.replaceChild(this.item_0, this.item_1);
            } catch (e) {

            }
        }
    }
}

class Block {
    constructor(title) {
        this.element = document.createElement("div");
        this.element.classList.add("sf-block");

        this.title = document.createElement("span");
        this.title.textContent = title;
        this.title.classList.add("sf-block-title");
        this.element.appendChild(this.title);

        this.block = document.createElement("div");
        this.element.appendChild(this.block);
    }

    /**
     * Appends HTMLElement
     * @param element HTMLElement
     */
    appendChild(element) {
        this.block.appendChild(element);
    }
}