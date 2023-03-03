class OverlaySettings extends PopUpWindow {
    constructor() {
        super(i18n("btnOverlaySettings"));

        // JSON style object
        this.overlayStyle = null;

        // List of settings select elements
        this.elements = [];

        this.contents.classList.add("overlay-settings-box");

        // Adds setting items
        this.addItem("fontSize", new SelectFontSize());
        this.addItem("fontColor", new SelectColor());
        this.addItem("fontOpacity", new SelectOpacity());
        this.addItem("backgroundColor", new SelectColor());
        this.addItem("backgroundOpacity", new SelectOpacity());
        this.addItem("fontFamily", new SelectFontFamily());
        this.addItem("align", new SelectAlign());

        this.loadOptions();

    }

    /**
     * Loads Overlay settings 
     */
    loadOptions() {
        sync_get(["overlayStyle"], (result) => {
            this.overlayStyle = result.overlayStyle || {
                "fontSize": "1",
                "fontColor": "white",
                "fontOpacity": "1",
                "backgroundColor": "black",
                "backgroundOpacity": "0.25",
                "fontFamily": "p_sans-serif",
                "align": "center"
            };

            this.update();
        });
    }

    /**
     * Parses select element
     * @param key Key of overlaySettings
     * @param select Settings BaseSelect
     */
    parseSettingsItem(key, select) {
        select.key = key;

        select.element.addEventListener("change", () => {
            this.overlayStyle[key] = select.element.value;

            this.save();
        });

        // Settings row element
        let element = document.createElement("div");
        element.classList.add("overlay-setting");

        // Row text element
        let text = document.createElement("span");
        text.textContent = `${i18n(key)}:`;
        element.appendChild(text);

        // Row select element
        element.appendChild(select.element);

        return element;
    }

    /**
     * Adds options item to list
     * @param key Key of settings
     * @param select Select
     */
    addItem(key, select) {
        this.elements.push(select);

        this.appendChild(this.parseSettingsItem(key, select));
    }

    /**
     * Updates overlay settings
     */
    update() {
        for (let select of this.elements) {
            select.element.value = this.overlayStyle[select.key];
        }
    }

    /**
     * Saves overlay settings
     */
    save() {
        sync_set({ overlayStyle: this.overlayStyle });
        chrome.runtime.sendMessage({ type: "update_overlay" });
    }
}

class SelectOpacity extends SelectBox {
    constructor() {
        super(["0", "0.25", "0.50", "0.75", "1"], ["0%", "25%", "50%", "75%", "100%"]);
    }
}

class SelectFontSize extends SelectBox {
    constructor() {
        super(["0.5", "0.75", "1", "1.5", "2", "3"], ["50%", "75%", "100%", "150%", "200%", "300%"]);
    }
}

class SelectColor extends SelectBox {
    constructor() {
        super(["white", "yellow", "green", "cyan", "blue", "magenta", "red", "black"], i18n(["white", "yellow", "green", "cyan", "blue", "magenta", "red", "black"]));
    }
}

class SelectFontFamily extends SelectBox {
    constructor() {
        super(["m_sans", "p_sans", "m_sans-serif", "p_sans-serif", "calsual", "cursive", "small_capitals"], ["Monospaced Serif", "Proportional Serif", "Monospaced Sans-Serif", "Proportional Sans-Serif", "Casual", "Cursive", "Small-Capitals"]);
    }
}

class SelectAlign extends SelectBox {
    constructor() {
        super(["left", "center"], i18n(["overlayAlignLeft", "overlayAlignCenter"]));
    }
}