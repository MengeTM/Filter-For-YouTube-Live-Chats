class FilterEvaluation {
    constructor() {
        this.filter = null;
        this.filterCopy = null;

        this.element = document.createElement("div");
        this.element.classList.add("background");
        this.element.classList.add("hidden");
        this.element.addEventListener("click", (event) => {
            event.stopPropagation();

            this.exit();
        });

        this.window = document.createElement("div");
        this.window.classList.add("evaluation-window");
        this.window.addEventListener("click", (event) => {
            event.stopPropagation();
        });
        this.element.appendChild(this.window);

        let title = document.createElement("h2");
        title.textContent = i18n("evaluateFilter");
        this.window.appendChild(title);

        this.box = document.createElement("div");
        this.box.classList.add("evaluation-box");
        this.window.appendChild(this.box);

        let theader = document.createElement("div");
        theader.classList.add("evaluation-grid");
        theader.id = "evaluation-header"
        theader.appendChild(this.textNode(i18n("author")));
        theader.appendChild(this.textNode(i18n("message")));
        theader.appendChild(this.textNode(i18n("match")));
        this.box.appendChild(theader);

        let tbody = document.createElement("div");
        tbody.id = "evaluation-body"
        this.box.appendChild(tbody);

        let scroll = document.createElement("div");
        scroll.classList.add("evaluation-scroll");
        tbody.appendChild(scroll);

        for (let i = 0; i < 3; i++) {
            let row = document.createElement("div");
            row.classList.add("evaluation-grid");
            row.classList.add("row");


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

            let match = document.createElement("span");
            match.classList.add("match-string");
            match.classList.add("evaluation-element");
            row.appendChild(match);

            scroll.appendChild(row);
        }

        let control = document.createElement("div");
        control.classList.add("evaluation-control");
        this.box.appendChild(control);

        let btnExit = document.createElement("button");
        btnExit.textContent = i18n("btnExit");
        btnExit.title = i18n("titleBtnExit");
        btnExit.addEventListener("click", () => {
            this.exit();
        });
        control.appendChild(btnExit);

        document.body.appendChild(this.element);
    }

    showFilter(filter) {
        if (this.filterCopy !== null) {
            this.box.removeChild(this.filterCopy.element);
        }

        this.filter = filter;
        this.filterCopy = filter.copy();
        this.filterCopy.addEventListener("input", () => {
            this.validate();
        });
        this.filterCopy.addEventListener("change", () => {
            this.validate();
        });

        this.filterCopy.element.classList.add("evaluation-filter");
        this.box.prepend(this.filterCopy.element);

        this.validate();

        this.element.classList.remove("hidden");
    }

    validate() {
        let rows = this.box.querySelectorAll(".row");
        for (let row of rows) {
            let author = row.querySelector(".author").value;
            let message = row.querySelector(".message").value;
            let match_string = row.querySelector(".match-string");

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

    exit() {
        this.save();
        this.element.classList.add("hidden");
    }

    save() {
        // Sets data
        this.filter.data.set(this.filterCopy.data);

        this.filter.save();
    }

    textNode(string) {
        let element = document.createElement("span");
        element.textContent = string;

        return element;
    }
}