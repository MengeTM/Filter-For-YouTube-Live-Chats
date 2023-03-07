class FilterRule {
    constructor(filter, data) {
        // Element container
        this.element = document.createElement("div");
        this.element.classList.add("filter-container");

        // Filter element
        this.filter = filter;

        // JSON data
        this.data = data;

        // List of HTML elements parsed from JSON
        this.elementList = this.parseData(data);

        this.update();
    }

    /*
     * Adds an event listener to all elements
     */
    addEventListener(type, listener) {
        for (let element of this.elementList) {
            element.addEventListener(type, listener);
        }
    }

    /* 
     * Makes a HTML text node
     */
    getText(string) {
        let node = document.createElement("div");
        node.classList.add("text-input");

        let text = document.createTextNode(string);
        node.appendChild(text);

        return node;
    }

    /* 
     * Adds HTML input elements from a list, adds listener for saving when input is updated
     */
    update() {
        while (this.element.firstElementChild !== null) {
            this.element.removeChild(this.element.firstElementChild);
        }

        for (let element of this.elementList) {
            this.element.appendChild(element);

            this.filter.addDragListener(element);
        }
    }

    /*
     * Copies elements and data of this element
     */
    copy() {
        let data = parseJSON(this.data.json());
        let filter = new FilterRule(this.filter, data);
        filter.setExpertMode(this.filter.filterList.expertMode);

        return filter;
    }

    save() {
        this.filter.save();
    }

    /*
     * Sets Expert mode for all select options
     */
    setExpertMode(expert) {
        // Selects expert elements by class and enables or disables them
        let expertElements = this.element.querySelectorAll(".expert");
        for (let element of expertElements) {
            element.hidden = !expert;
        }
    }

    /*
     * Formats JSON tree of html elements into a list of html elements
     */
    parseData(data) {
        if (data instanceof Language) {
            return [
                this.getText(`${i18n("translatorLanguage")}: `),
                data.element
            ];
        } else if (data instanceof LogicalBinary) {
            // Logical and
            let array = this.parseData(data.a);
            array.push(this.getText(i18n("and")));
            array = array.concat(this.parseData(data.b));

            return array;
        } else {
            // Japanese block
            if (chrome.i18n.getUILanguage().startsWith("ja")) {
                return [
                    data.key.element,       // string
                    data.regexp.element,    // text
                    data.bool.element,      // every
                    data.element,           // matches
                ];
            // English, German block
            } else {
                return [
                    data.key.element,       // string
                    data.element,           // matches
                    data.bool.element,      // every
                    data.regexp.element     // text
                ];
            }
        }
    }
}

class Filter {
    constructor(json) {
        // HTML Element for Filter data, is set draggable
        this.filterElement = document.createElement("div");
        this.filterElement.classList.add("filter");
        this.filterElement.draggable = true;
        this.filterElement.filter = this;

        // Elements of the Filter Element
        this.filterNameElement = null;  // Name TextField
        this.filterActionElement = null;  // Filter Action Select
        this.switch = null;  // Filter enable switch

        // FilterList to which this Filter Element is added
        this.filterList = null;

        // Empty filter rules if no filter json data
        if (typeof json == "string") {
            switch (json) {
                case "filter_translation":
                    // Language translation
                    json = {
                        name: "Translations - EN",
                        type: "subtitles",
                        data: new Language("en"),
                        enable: true
                    }
                    break;
                // One logical block
                case "filter_1":
                    json = {
                        name: "",
                        type: "highlight",
                        data: new StringRegex("includes", new StringOption("message"), new TextElement([]), new LogicalArray("some")),
                        enable: true
                    };
                    break;
                // Two logical blocks with logical and
                case "filter_2":
                    json = {
                        name: "",
                        type: "highlight",
                        data: new LogicalBinary("and", new StringRegex("includes", new StringOption("author"), new TextElement([]), new LogicalArray("some")), new StringRegex("includes", new StringOption("message"), new TextElement([]), new LogicalArray("some"))),
                        enable: true
                    };
                    break;
            }
            
        } else {
            // Parses the filter data to HTML elements (Select, TextField)
            json.data = parseJSON(json.data);
        }

        this.filterData = json;

        // Adds data Div and controls Div
        this.addMain();
        this.addControl();

        // Drag Listeners

        // Starts dragging
        this.filterElement.addEventListener("dragstart", (event) => {
            console.log("dragstart", this.filterElement.id);
            event.dataTransfer.setData("filter", this.filterElement.id);
            event.dataTransfer.effectAllowed = "move";

            this.filterElement.classList.add("dragging");
        });

        // Swaps dragged Filter element with entered Filter element when entering the Filter element
        this.filterElement.addEventListener("dragenter", (event) => {
            event.stopPropagation();

            if (this.filterElement !== event.target) {
                this.swapFilter(event.target);
            }
        });

        // Enables dragging
        this.filterElement.addEventListener("dragover", (event) => {
            event.preventDefault();
        });

        // Does nothing
        this.filterElement.addEventListener("drop", (event) => {
            console.log("drop", event);

            let filter = document.getElementById(event.dataTransfer.getData("filter"));
            if (filter !== null && this.filterElement !== filter) {
                this.swapFilter(filter);
            }
        });

        // Ends dragging by removing class
        this.filterElement.addEventListener("dragend", (event) => {
            event.target.classList.remove("dragging");
        });
    }

    /*
     * Swaps position of Filter element with this Filter element 
     */
    swapFilter(filterElement) {
        let element = document.createElement("div");

        this.filterList.filters.replaceChild(element, filterElement);
        this.filterList.filters.replaceChild(filterElement, this.filterElement);
        this.filterList.filters.replaceChild(this.filterElement, element);
    }

    /*
     * Sets listener for text elements, needed for enabling selecting text, when the element is draggable
     */
    addDragListener(element) {
        // Mozilla error, needed for text input to function when dragging
        if (element instanceof HTMLInputElement) {
            element.addEventListener("focus", () => { this.filterElement.draggable = false; });
            element.addEventListener("blur", () => { this.filterElement.draggable = true; });
        }
    }

    /*
     * JSON data from the HTML elements data 
     */
    json() {
        return {
            name: this.filterData.name,
            type: this.filterData.type,
            data: this.filterBox.data.json(),
            enable: this.filterData.enable
        };
    }

    /*
     * Saves the FilterList and this Filter
     */
    save() {
        this.filterList.save();
    }

    /*
     * Deletes Filter from FilterList and saves FilterList
     */
    deleteFilter () {
        this.filterList.deleteFilter(this);
    }

    /**
     * Selects expert elements by class and enables or disables them
     */
    setExpertMode(expert) {
        let expertElements = this.filterElement.querySelectorAll(".expert");
        for (let element of expertElements) {
            element.hidden = !expert;
        }
    }

    /* 
     * Adds HTML element with data input elements
     */
    addMain() {
        // Element contrainer
        let mainElement = document.createElement("div");
        mainElement.classList.add("main");
        this.filterElement.appendChild(mainElement);

        // Input text for filter name
        this.filterNameElement = new TextElement(this.filterData.name, false);
        this.filterNameElement.element.classList.add("name");
        this.filterNameElement.element.classList.add("input");
        this.filterNameElement.element.placeholder = i18n("filterName");
        this.filterNameElement.element.title = i18n("titleFilterName");
        this.addDragListener(this.filterNameElement.element);
        this.filterNameElement.element.addEventListener("change", () => {
            this.filterData.name = this.filterNameElement.element.value;

            this.save();
        });
        mainElement.appendChild(this.filterNameElement.element);

        // Select for filter action
        this.filterActionElement = new BaseSelect(this.filterData.type, ["highlight", "subtitles", "delete"], i18n(["highlight", "subtitles", "delete"]));
        this.filterActionElement.element.classList.add("filter-type");
        this.filterActionElement.element.classList.add("input");
        this.filterActionElement.element.title = i18n("titleSelectAction");
        this.filterActionElement.element.addEventListener("change", () => {
            this.filterData.type = this.filterActionElement.element.value;

            this.save();
        });
        mainElement.appendChild(this.filterActionElement.element);

        // Scrollable box with match settings for filter
        this.filterBox = new FilterRule(this, this.filterData.data);
        this.filterBox.addEventListener("change", () => {
            this.save();
        });
        mainElement.appendChild(this.filterBox.element);

        // Switch for enabling the filter
        let enableElement = document.createElement("div");
        enableElement.classList.add("enable");
        mainElement.appendChild(enableElement);
        this.switch = new ToggleSwitch(this.filterData.enable);
        this.switch.element.title = i18n("titleSwitchEnableFilter");
        this.switch.element.addEventListener("change", () => {
            this.filterData.enable = this.switch.checkbox.checked;

            this.save();
        });
        enableElement.appendChild(this.switch.element);
    }

    /* 
     * Adds HTML element for interacting with filter
     */
    addControl() {
        // Element container
        let controlElement = document.createElement("div");
        controlElement.classList.add("control");
        this.filterElement.appendChild(controlElement);

        // Flex
        let flex = document.createElement("div");
        flex.classList.add("flex-auto");
        controlElement.appendChild(flex);

        // Icon button for evaluating filter
        let btnEvaluate = document.createElement("button");
        btnEvaluate.classList.add("expert");
        btnEvaluate.textContent = i18n("evaluateFilter");
        btnEvaluate.title = i18n("evaluateFilter");
        btnEvaluate.addEventListener("click", () => {
            this.filterList.filterEvaluation.showFilter(this.filterBox);
        });
        controlElement.appendChild(btnEvaluate);

        // Icon button for deleting filter
        let imgTrash = document.createElement("img");
        imgTrash.src = "filters/trash.svg";
        imgTrash.title = i18n("titleDeleteFilter");
        imgTrash.addEventListener("click", () => {
            if (confirm(i18n("deleteFilterMessage", this.filterData.name))) {
                this.deleteFilter();
            }
        });
        imgTrash.draggable = true;
        imgTrash.addEventListener("dragstart", (event) => { event.preventDefault(); event.stopPropagation(); });
        controlElement.appendChild(imgTrash);
    }
}

class FilterList {
    constructor(filtersElement) { 
        if (filtersElement === undefined) {
            filtersElement = document.createElement("div");
        }

        this.expertMode = false;

        // Element for adding filter elements
        this.filters = filtersElement;
        this.filters.id = "filters";
        this.filters.classList.add("filters-container")

        // Id for added filter elements
        this.next_id = 0;

        this.filterEvaluation = new FilterEvaluation();
    }

    /*
     * Adds Filter element and sets reference and id
     */
    addFilter(filter) {
        if (filter.filterList !== null) {
            filter.filterList.deleteFilter(filter);
        }

        filter.filterList = this;

        filter.setExpertMode(this.expertMode);

        this.filters.appendChild(filter.filterElement);
        filter.filterElement.id = `filter_${this.next_id}`;
        this.next_id += 1;

        this.save();
    }

    /*
     * Deletes Filter element
     */
    deleteFilter(filter) {
        this.filters.removeChild(filter.filterElement);
        filter.filterList = null;

        this.save();
    }

    /*
     * Sets expert mode for all Filter elements
     */
    setExpertMode(expert) {
        this.expertMode = expert;

        // Selects expert elements by class and enables or disables them
        let expertElements = this.filters.querySelectorAll(".expert");
        for (let element of expertElements) {
            element.hidden = !expert;
        }
    }

    /*
     * Saves all Filter elements as JSON
     */
    save() {
        let filters = [];
        for (let filterElement of this.filters.childNodes) {
            filters.push(filterElement.filter.json());
        }

        sync_set({ filters: filters });

        chrome.runtime.sendMessage({ type: "update_filters" });
    }
}