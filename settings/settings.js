class Setting {
    constructor() {
        this.size = null;
        this.enableHighlight = null;
        this.expertMode = null;
        this.filters = null;

        this.filterList = new FilterList();
        document.querySelector("#filters-box").appendChild(this.filterList.filters);
    }

    /*
     * Loads settings
     */
    restoreOptions = function () {
        let getting = browser.storage.sync.get();
        getting.then((result) => {
            this.size = result.size || 30;
            this.enableHighlight = result.enableHighlight;
            this.expertMode = result.expertMode;
            this.filters = result.filters || {
                name: "",
                type: "highlight",
                data_type: "1",
                data: new LogicalArray("some", new StringRegex("includes", new StringOption("message"), new TextElement(["[EN]"]))),
                enable: true
            };

            if (this.enableHighlight === undefined) {
                this.enableHighlight = true;
            }

            if (this.expertMode === undefined) {
                this.expertMode = false;
            }

            for (let filter of this.filters) {
                this.filterList.addFilter(new Filter(filter));
            }

            this.update();

        }, (error) => {
            console.log(`Error: ${error}`);
        });
    }

    /*
     * Starts settings listener
     */
    start = function () {
        // Saves settings when input element are updated
        document.querySelector("#size").addEventListener("change", () => {
            this.size = document.querySelector("#size").value;
            this.size = Math.min(Math.max(this.size, 0), 100);
            this.setOption({ size: this.size });
        });

        document.querySelector("#enable_highlight").addEventListener("change", () => {
            this.enableHighlight = document.querySelector("#enable_highlight").checked;
            this.setOption({ "enableHighlight": this.enableHighlight });
        });

        document.querySelector("#btn_add_filter").addEventListener("click", () => {
            let filter = new Filter(document.querySelector("#select_new_filter").value);
            this.filterList.addFilter(filter);

            return false;
        });

        document.querySelector("#enable_expert_mode").addEventListener("change", () => {
            this.expertMode = document.querySelector("#enable_expert_mode").checked;
            this.setOption({ expertMode: this.expertMode });

            if (this.filterList !== null) {
                this.filterList.setExpertMode(this.expertMode);
            }
        });

        // Saves settings when page is left
        document.addEventListener("unload", () => {
            this.newValue("size");
            this.filterList.save();
        });

        // Replaces placeholders of html with _locale strings
        document.querySelectorAll(".i18n").forEach(function (node) {
            if (node.hasAttribute("data-id")) {
                if (node instanceof HTMLInputElement) {
                    node.value = browser.i18n.getMessage(node.getAttribute("data-id"));
                } else {
                    node.textContent = browser.i18n.getMessage(node.getAttribute("data-id"));
                }
            }
            if (node.hasAttribute("title-id")) {
                node.title = browser.i18n.getMessage(node.getAttribute("title-id"));
            }
        });

        this.restoreOptions();
    }

    /*
     * Updates html input elements with settings
     */
    update = function () {
        document.querySelector("#size").value = this.size;
        document.querySelector("#enable_highlight").checked = this.enableHighlight;
        this.filterList.setExpertMode(this.expertMode);
    }

    /*
     * Saves setting
     */
    setOption(option) {
        browser.storage.sync.set(option);
    }
}

let setting = new Setting();
setting.start();