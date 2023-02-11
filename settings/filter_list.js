class _FilterBox {
    constructor(filter, data, data_type) {
        // Element container
        this.element = document.createElement("div");
        this.element.classList.add("filter-container");

        // Filter element
        this.filter = filter;

        // JSON data
        this.data = data;

        // List of HTML elements parsed from JSON
        let elementList;
        switch (data_type) {
            // One logic block
            case "1":
                elementList = this.block_one(data);
                break;
            // Two logic blocks with and
            case "2":
                elementList = this.block_two(data);
                break;
            default:
                throw Error(`JSON data_type="${data_type}" should be of ["1", "2"]`)
        }

        this.addElements(elementList);
    }

    /* 
     * Makes a HTML text node
     */
    getText = function (string) {
        let node = document.createElement("div");
        node.classList.add("input");

        let text = document.createTextNode(string);
        node.appendChild(text);

        return node;
    }

    /* 
     * Adds HTML input elements from a list, adds listener for saving when input is updated
     */
    addElements = function (elementList) {
        for (let element of elementList) {
            this.element.appendChild(element);

            if (!(element instanceof Text)) {
                element.addEventListener("change", () => {
                    this.filter.save();
                });
            }

            this.filter.addDragListener(element);
        }
    }

    /*
     * Lists HTML input elements regarding language order for one logical block
     */
    block_one = function (data) {
        if (browser.i18n.getUILanguage().startsWith("ja")) {
            return [
                data.key.element,       // string
                data.regexp.element,    // text
                data.bool.element,      // every
                data.element,           // matches
            ];
        } else {
            return [
                data.key.element,       // string
                data.element,           // matches
                data.bool.element,      // every
                data.regexp.element     // text
            ];
        }
    }

    /*
     * List HTML elements regarding language order for two logical blocks with and
     */
    block_two = function (data) {
        if (browser.i18n.getUILanguage().startsWith("ja")) {
            return [
                data.a.key.element,         // string
                data.a.regexp.element,      // text
                data.a.bool.element,        // every
                data.a.element,             // matches
                this.getText(i18n("and")),
                data.b.key.element,         // string
                data.b.regexp.element,      // text
                data.b.bool.element,        // every
                data.b.element,             // matches
            ];
        } else {
            return [
                data.a.key.element,         // string
                data.a.element,             // matches
                data.a.bool.element,        // every
                data.a.regexp.element,      // text
                this.getText(i18n("and")),
                data.b.key.element,         // string
                data.b.element,             // matches
                data.b.bool.element,        // every
                data.b.regexp.element       // text
            ];
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
                // One logical block
                case "1":
                    json = {
                        name: "",
                        type: "highlight",
                        data_type: "1",
                        data: new StringRegex("includes", new StringOption("message"), new TextElement([]), new LogicalArray("some")),
                        enable: true
                    };
                    break;
                // Two logical blocks with logical and
                case "2":
                    json = {
                        name: "",
                        type: "highlight",
                        data_type: "2",
                        data: new LogicalBinary("and", new StringRegex("includes", new StringOption("author"), new TextElement([]), new LogicalArray("some")), new StringRegex("includes", new StringOption("message"), new TextElement([]), new LogicalArray("some"))),
                        enable: true
                    };
                    break;
            }
            
        } else {
            // Parses the filter data to HTML elements (Select, TextField)
            let parser = new JSONParser();
            json.data = parser.parseJSON(json.data);
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

            let filter = document.getElementById(event.dataTransfer.getData("filter"));
            if (filter !== null && this.filterElement !== filter) {
                this.swapFilter(filter);
            }
        });

        // Enables dragging
        this.filterElement.addEventListener("dragover", (event) => {
            event.preventDefault();
        });

        // Does nothing
        this.filterElement.addEventListener("drop", (event) => {
            console.log("drop", event);
        });

        // Ends dragging by removing class
        this.filterElement.addEventListener("dragend", (event) => {
            let filter = document.getElementById(event.dataTransfer.getData("filter"));
            if (filter !== null) {
                filter.classList.remove("dragging");
            }
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
    addDragListener = function (element) {
        // Mozilla error, needed for text input to function when dragging
        if (element instanceof HTMLInputElement) {
            element.addEventListener("focus", () => { this.filterElement.draggable = false; });
            element.addEventListener("blur", () => { this.filterElement.draggable = true; });
        }
    }

    /*
     * JSON data from the HTML elements data 
     */
    json = function () {
        return {
            name: this.filterData.name,
            type: this.filterData.type,
            data_type: this.filterData.data_type,
            data: this.filterData.data.json(),
            enable: this.filterData.enable
        };
    }

    /*
     * Saves the FilterList and this Filter
     */
    save = function () {
        this.filterList.save();
    }

    /*
     * Deletes Filter from FilterList and saves FilterList
     */
    deleteFilter = function () {
        this.filterList.deleteFilter(this);
    }

    /* 
     * Adds HTML element with data input elements
     */
    addMain = function () {
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
        this.filterActionElement = new BaseSelect(this.filterData.type, ["highlight", "delete"], i18n(["highlight", "delete"]));
        this.filterActionElement.element.classList.add("filter-type");
        this.filterActionElement.element.classList.add("input");
        this.filterActionElement.element.title = i18n("titleSelectAction");
        this.filterActionElement.element.addEventListener("change", () => {
            this.filterData.type = this.filterActionElement.element.value;

            this.save();
        });
        mainElement.appendChild(this.filterActionElement.element);

        // Scrollable box with match settings for filter
        this.filterBox = new _FilterBox(this, this.filterData.data, this.filterData.data_type);
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
    addControl = function () {
        // Element container
        let controlElement = document.createElement("div");
        controlElement.classList.add("control");
        this.filterElement.appendChild(controlElement);

        // Icon button for deleting filter
        let imgTrash = document.createElement("img");
        imgTrash.src = "trash.svg";
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

        // Element for adding filter elements
        this.filters = filtersElement;
        this.filters.id = "filters";
        this.filters.classList.add("filters-container")

        // Id for added filter elements
        this.next_id = 0;
    }

    /*
     * Adds Filter element and sets reference and id
     */
    addFilter = function (filter) {
        if (filter.filterList !== null) {
            filter.filterList.deleteFilter(filter);
        }

        filter.filterList = this;

        this.filters.appendChild(filter.filterElement);
        filter.filterElement.id = `filter_${this.next_id}`;
        this.next_id += 1;

        this.save();
    }

    /*
     * Deletes Filter element
     */
    deleteFilter = function (filter) {
        this.filters.removeChild(filter.filterElement);
        filter.filterList = null;

        this.save();
    }

    /*
     * Sets expert mode for all Filter elements
     */
    setExpertMode(expert) {
        // Selects expert elements by class and enables or disables them
        let expertElements = this.filters.querySelectorAll(".expert");
        for (let element of expertElements) {
            element.hidden = !expert;
        }
    }

    /*
     * Saves all Filter elements as JSON
     */
    save = function () {
        let filters = [];
        for (let filterElement of this.filters.childNodes) {
            filters.push(filterElement.filter.json());
        }

        browser.storage.sync.set({ filters: filters });
    }
}