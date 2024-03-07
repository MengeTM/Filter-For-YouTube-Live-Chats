class DropdownSettings {
    enableOverlay = null;  // Enable overlay
    overlayStyle = null;  // JSON overlay style

    enableHighlight = null; // Enable highlight

    filters = null;  // List of filters
    expertMode = null;  // Expert mode

    overlayElements = [];

    dropdownElementsFilters = [];
    dropdownElementOverlayStyle = null;

    constructor(dropdownSettings) {
        this.dropdownSettings = dropdownSettings || document.querySelector("body");

        parseXML(chrome.runtime.getURL("../menu_item/menu.svg"), (svg) => {
            svg.classList.add("sf-icon");
            let settingsIcon = this.dropdownSettings.querySelector("#sf-settings-icon");
            settingsIcon.parentElement.replaceChild(svg, settingsIcon);
        });

        chrome.runtime.onMessage.addListener((message) => {
            switch (message.type) {
                case "update_overlay":
                    if (this.dropdownSettings.classList.contains("sf-hidden")) {
                        this.loadOverlayStyle();
                    }
                    break;
                case "update_filters":
                    if (this.dropdownSettings.classList.contains("sf-hidden")) {
                        this.loadFilters();
                    }
                    break;
                case "updade_box":
                    if (this.dropdownSettings.classList.contains("sf-hidden")) {
                        this.loadChatBox();
                    }
                    break;
            }
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

        this.loadOverlayStyle();
        this.loadFilters();
        this.loadChatBox();

        this.dropdownSettings.addEventListener("focusout", (event) => {
            // console.log(event.target);
            if (!this.dropdownSettings.contains(event.relatedTarget) && event.target !== this.dragElement) {
                this.show(false);
                this.dropdownElementsFilters.forEach((item) => {
                    item.update(false);
                });
                this.dropdownElementOverlayStyle.update(false);
            }
        });
    }

    /**
     * Loads highlight settings
     */
    loadChatBox() {
        sync_get(["enableHighlight"], (result) => {
            this.enableHighlight = result.enableHighlight;

            const enableHighlight = this.dropdownSettings.querySelector("#sf-enable-highlight");
            enableHighlight.checked = this.enableHighlight;
            enableHighlight.addEventListener("change", () => {
                this.enableHighlight = enableHighlight.checked;
                sync_set({ enableHighlight: this.enableHighlight });

                this.updateSettings();
            });
        });
    }

    /**
     * Loads overlay settings
     */
    loadOverlayStyle() {
        sync_get(["enableOverlay", "overlayStyle"], (result) => {
            this.enableOverlay = result.enableOverlay;
            this.overlayStyle = result.overlayStyle;

            this.dropdownSettings.querySelector("#sf-enable-overlay").checked = this.enableOverlay;
            this.setOverlayStyle();
        });
    }

    /**
     * Loads filters settings
     */
    loadFilters() { 
        sync_get(["filters", "expertMode"], (result) => {
            this.filters = result.filters;
            this.expertMode = result.expertMode;

            this.setFilters();

            this.dropdownSettings.querySelectorAll(".expert").forEach((item) => {
                item.hidden = !this.expertMode;
            });
        });
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
        let name = filterData.name;
        if (name.length == 0) {
            name = i18n("filterName");
        }
        let dropdown = new DropDown(name, filterSwitch.element, filterDelete);
        dropdown.filterData = filterData;
        this.dropdownElementsFilters.push(dropdown);

        // Start dragging filter
        dropdown.index.addEventListener("dragstart", (event) => {
            event.dataTransfer.effectAllowed = "move";
            dropdown.index.classList.add("sf-dragging");
            this.dragElement = dropdown;
        });

        // Swapping filter when entering filter
        dropdown.index.draggable = true;
        dropdown.index.addEventListener("dragenter", (event) => {
            const element = document.createElement("div");
            if (this.dragElement !== dropdown) {
                const dropdownId = this.filters.indexOf(dropdown.filterData);
                const dragId = this.filters.indexOf(this.dragElement.filterData);

                this.dragElement.element.replaceWith(element);
                dropdown.element.replaceWith(this.dragElement.element);
                element.replaceWith(dropdown.element);
                

                this.filters[dragId] = dropdown.filterData;
                this.filters[dropdownId] = this.dragElement.filterData;
            }
        });

        dropdown.index.addEventListener("dragover", (event) => {
            event.preventDefault();
        });

        dropdown.index.addEventListener("drop", (event) => {
            event.preventDefault();

            event.dataTransfer.dropEffect = "move";
        });

        // Stop dragging filter
        dropdown.index.addEventListener("dragend", (event) => {
            this.dragElement.index.classList.remove("sf-dragging");
            dropdown.index.focus();

            this.saveFilters();
        });

        filterDelete.addEventListener("click", () => {
            if (confirm(i18n("deleteFilterMessage", dropdown.title.textContent))) {
                this.filters = this.filters.filter((item) => { return item !== filterData });
                dropdown.element.parentElement.removeChild(dropdown.element);

                this.saveFilters();
            }
        });

        // Filter name
        let block = new Block(i18n("filterName"));
        name = document.createElement("input");
        name.type = "text";
        name.title = i18n("titleFilterName");
        name.value = filterData.name;
        name.addEventListener("change", () => {
            filterData.name = name.value.trim();

            let title = filterData.name;
            if (title.length == 0) {
                title = i18n("filterName");
            }
            dropdown.setTitle(title);
            this.saveFilters();
        });
        block.appendChild(name);
        dropdown.appendChild(block.element);

        // Filter action
        block = new Block(i18n("filterAction"));
        let action = new Action(filterData.type);
        action.element.addEventListener("change", () => {
            filterData.type = action.element.value;

            this.saveFilters();
        });
        block.appendChild(action.element);
        dropdown.appendChild(block.element);

        // Filter rule
        block = new Block(i18n("filterRule"));
        let filter = new FilterRule(null, parseJSON(filterData.data));
        filter.element.classList.add("sf-filter");
        if (filterData.type == "subtitles") {
            for (let element of filter.elementList) {
                if (element instanceof HTMLDivElement) {
                    element.remove();
                }
            }
        }
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
        this.dropdownElementsFilters = [];
        let filters = new DropDown(i18n("filters"));
        this.dropdownElementsFilters.push(filters);
        filters.element.id = "sf-filters";
        this.dropdownSettings.querySelector("#sf-filters").parentElement.replaceChild(filters.element, this.dropdownSettings.querySelector("#sf-filters"));

        // Delete filters
        filters.clear();

        let newFilterBox = document.createElement("div");
        newFilterBox.classList.add("sf-new-filter");

        let selectNewFilter = new BaseSelect("filter_translation", ["filter_translation", "filter_language", "filter_1", "filter_2"], i18n(["filterTranslation", "filterLanguage", "filter1", "filter2"]));
        selectNewFilter.title = i18n("titleSelectNewFilterType");

        let btnNewFilter = document.createElement("input");
        btnNewFilter.type = "button";
        btnNewFilter.value = i18n("newFilter");
        btnNewFilter.title = i18n("titleNewFilter");
        btnNewFilter.addEventListener("click", () => {
            let json = newFilter(selectNewFilter.element.value);
            json.data = json.data.json();
            this.filters.push(json);

            filters.appendChild(this.newFilter(json));

            this.saveFilters();
        });
        newFilterBox.appendChild(btnNewFilter);
        newFilterBox.appendChild(selectNewFilter.element);

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
        this.dropdownElementOverlayStyle = overlayStyle;
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

            element.element.value = this.overlayStyle[element.key];

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
        chrome.runtime.sendMessage({ type: "update_box" });
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

    constructor(title, item_0 = null, item_1 = null) {
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
        this.element.tabIndex = "1";

        // Index opening dropdown
        this.index = document.createElement("div");
        this.index.classList.add("sf-dropdown-index");
        this.index.classList.add("sf-align");
        this.index.tabIndex = 0;
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
     * Sets title of DropDown
     * @param title String title
     */
    setTitle(title) {
        this.title.textContent = title;
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
     * @param open (Optional) sets dropdown
     */
    update(open) {
        if (open !== undefined) {
            this.open = open;
        }

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

if (document.querySelector("body > #sf-settings")) {
    new DropdownSettings();
}