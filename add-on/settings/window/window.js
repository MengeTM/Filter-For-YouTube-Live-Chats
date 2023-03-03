class PopUpWindow {
    title = null;

    constructor(title) {

        // Background for pop-up window
        this.background = document.createElement("div");
        this.background.classList.add("background");
        this.background.classList.add("hidden");
        this.background.addEventListener("click", (event) => {
            event.stopPropagation();

            this.exit();
        });

        // Pop-up window
        this.window = document.createElement("div");
        this.window.classList.add("window");
        this.window.addEventListener("click", (event) => {
            event.stopPropagation();
        });
        this.background.appendChild(this.window);

        // Window title
        if (title && title.length > 0) {
            this.title = document.createElement("h2");
            this.title.textContent = title;
            this.window.appendChild(this.title);
        }

        // Box for elements
        this.contents = document.createElement("div");
        this.contents.classList.add("contents");
        this.window.appendChild(this.contents);

        // Box controls
        this.controls = document.createElement("div");
        this.controls.classList.add("controls");
        this.window.appendChild(this.controls);

        // Exit pop-up window
        let btnExit = document.createElement("button");
        btnExit.textContent = i18n("btnExit");
        btnExit.title = i18n("titleBtnExit");
        btnExit.addEventListener("click", () => {
            this.exit();
        });
        this.controls.appendChild(btnExit);

        document.body.appendChild(this.background);
    }

    /**
     * Sets window height
     * @param height Height
     */
    setHeight(height) {
        this.window.style.height = height;
    }

    /**
     * Sets window width
     * @param width Width
     */
    setWidth(width) {
        this.window.style.width = width;
    }

    loadURL(url, loaded) {
        if (url !== undefined) {
            parseXML(url, (xml) => {
                let body = xml.childNodes[1];
                while (body.firstElementChild !== null) {
                    this.appendChild(body.firstElementChild);
                }

                i18n_replace(this.contents);

                if (loaded !== undefined) {
                    loaded();
                }
            });
        }
    }

    /**
     * Appends child
     * @param element HTMLElement
     */
    appendChild(element) {
        this.contents.appendChild(element);
    }

    /**
     * Exits window
     */
    exit() {
        this.background.classList.add("hidden");
    }

    /**
     * Shows window
     */
    show() {
        this.background.classList.remove("hidden");
    }
}