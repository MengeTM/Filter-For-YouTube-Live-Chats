class FilterEvaluation {
    constructor() {
        this.filter = null;  // Filter rule
        this.filterCopy = null;  // Copy of filter rule for local updates

        // Background for pop-up window
        this.element = document.createElement("div");
        this.element.classList.add("background");
        this.element.classList.add("hidden");
        this.element.addEventListener("click", (event) => {
            event.stopPropagation();

            this.exit();
        });

        // Pop-up window
        this.window = document.createElement("div");
        this.window.classList.add("evaluation-window");
        this.window.addEventListener("click", (event) => {
            event.stopPropagation();
        });
        this.element.appendChild(this.window);

        // Title pop-up window
        let title = document.createElement("h2");
        title.textContent = i18n("evaluateFilter");
        this.window.appendChild(title);

        // Box filter rule
        this.filterBox = document.createElement("div");
        this.filterBox.classList.add("evaluation-filter-box");
        this.window.appendChild(this.filterBox)

        // Title box filter rule
        let filterTitle = document.createElement("h3");
        filterTitle.textContent = i18n("filterTitle");
        this.filterBox.appendChild(filterTitle);

        // Box validation live-chat example messages
        this.box = document.createElement("div");
        this.box.classList.add("evaluation-example-box");
        this.window.appendChild(this.box);

        // Title box validation live-chat example messages
        let evaluationTitle = document.createElement("h3");
        evaluationTitle.textContent = i18n("evaluationTitle");
        this.box.appendChild(evaluationTitle);

        // Titles for columns
        let theader = document.createElement("div");
        theader.classList.add("evaluation-grid");
        theader.id = "evaluation-header"
        theader.appendChild(this.textNode(i18n("author")));
        theader.appendChild(this.textNode(i18n("message")));
        theader.appendChild(this.textNode(i18n("match")));
        this.box.appendChild(theader);

        // Box rows
        let tbody = document.createElement("div");
        tbody.id = "evaluation-body"
        this.box.appendChild(tbody);

        // Scroll box for rows
        let scroll = document.createElement("div");
        scroll.classList.add("evaluation-scroll");
        tbody.appendChild(scroll);

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

            scroll.appendChild(row);
        }

        // Box controls
        let control = document.createElement("div");
        control.classList.add("evaluation-control");
        this.box.appendChild(control);

        // Exit pop-up window
        let btnExit = document.createElement("button");
        btnExit.textContent = i18n("btnExit");
        btnExit.title = i18n("titleBtnExit");
        btnExit.addEventListener("click", () => {
            this.exit();
        });
        control.appendChild(btnExit);

        document.body.appendChild(this.element);
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

        this.element.classList.remove("hidden");
    }

    /**
     * Validates the filter rule regarding the example live-chat author-names and messages
     */
    validate() {
        let rows = this.box.querySelectorAll(".row");
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
        this.element.classList.add("hidden");
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