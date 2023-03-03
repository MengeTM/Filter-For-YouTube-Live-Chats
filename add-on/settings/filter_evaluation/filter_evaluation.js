class FilterEvaluation extends PopUpWindow {
    constructor() {
        super(i18n("evaluateFilter"));

        this.filter = null;  // Filter rule
        this.filterCopy = null;  // Copy of filter rule for local updates

        super.setHeight("80%");
        super.setWidth("80%");

        super.loadURL("filter_evaluation/filter_evaluation.html", () => {
            this.filterBox = this.contents.querySelector(".evaluation-filter-box");
            this.scroll = this.contents.querySelector("#evaluation-items");

            // Rows of author-name, message, and match
            for (let i = 0; i < 3; i++) {
                // Row
                let row = document.createElement("div");
                row.classList.add("evaluation-grid");
                row.classList.add("row");

                // Input author-name
                let authorInput = document.createElement("input");
                authorInput.type = "text";
                authorInput.classList.add("author");
                authorInput.classList.add("evaluation-element");
                authorInput.classList.add("input");
                authorInput.placeholder = i18n("placeholderAuthor");
                authorInput.title = i18n("titleAuthorEvaluation");
                authorInput.addEventListener("input", () => {
                    this.validate();
                });
                row.appendChild(authorInput);

                // Input message
                let messageInput = document.createElement("input");
                messageInput.type = "text";
                messageInput.classList.add("message");
                messageInput.classList.add("evaluation-element");
                messageInput.classList.add("input");
                messageInput.placeholder = i18n("placeholderMessage");
                messageInput.title = i18n("titleMessageEvaluation");
                messageInput.addEventListener("input", () => {
                    this.validate();
                });
                row.appendChild(messageInput);

                // Match string
                let match = document.createElement("span");
                match.classList.add("match-string");
                match.classList.add("evaluation-element");
                row.appendChild(match);

                this.scroll.appendChild(row);
            }
        });
    }

    /**
     * Shows a filter rule for validation
     * @param filter _FilterBox filter rule
     */
    showFilter(filter) {
        if (this.filterCopy !== null) {
            this.filterBox.removeChild(this.filterCopy.element);
        }

        // Sets filter and listener for validation
        this.filter = filter;
        this.filterCopy = filter.copy();
        this.filterCopy.addEventListener("input", () => {
            this.validate();
        });
        this.filterCopy.addEventListener("change", () => {
            this.validate();
        });

        this.filterCopy.element.classList.add("evaluation-filter");
        this.filterBox.appendChild(this.filterCopy.element);

        this.validate();

        super.show();
    }

    /**
     * Validates the filter rule regarding the example live-chat author-names and messages
     */
    validate() {
        let rows = this.scroll.querySelectorAll(".row");
        // Rows of example live-chat author-names and messages
        for (let row of rows) {
            let author = row.querySelector(".author").value;
            let message = row.querySelector(".message").value;
            let match_string = row.querySelector(".match-string");

            // Matches the filter rule, updates match string
            let match = this.filterCopy.data.evaluate({ author: author, message: message });
            if (match === true) {
                row.classList.add("match");
                row.classList.remove("no-match");
                row.title = i18n("titleDoesMatch");
                match_string.textContent = i18n("doesMatch");
            } else {
                row.classList.remove("match");
                row.classList.add("no-match");
                row.title = i18n("titleNoMatch");
                match_string.textContent = i18n("noMatch");
            }
        }
    }

    /**
     * Exits validation window
     */
    exit() {
        this.save();

        super.exit();
    }

    /**
     * Saves filter rule
     */
    save() {
        // Sets data
        this.filter.data.set(this.filterCopy.data);

        this.filter.save();
    }

    /**
     * HTML text node
     * @param string String
     */
    textNode(string) {
        let element = document.createElement("span");
        element.textContent = string;

        return element;
    }
}