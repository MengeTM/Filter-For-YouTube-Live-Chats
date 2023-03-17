class OverlaySettings extends PopUpWindow {
    constructor() {
        super(i18n("btnOverlaySettings"));

        // JSON style object
        this.overlayStyle = null;

        // List of settings select elements
        this.elements = [];

        this.contents.classList.add("overlay-settings-box");

        // Adds setting items
        this.addItem(new SelectFontSize("fontSize"));
        this.addItem(new SelectColor("fontColor"));
        this.addItem(new SelectOpacity("fontOpacity"));
        this.addItem(new SelectColor("backgroundColor"));
        this.addItem(new SelectOpacity("backgroundOpacity"));
        this.addItem(new SelectFontFamily("fontFamily"));
        this.addItem(new SelectAlign("align"));

        this.loadOptions();

    }

    /**
     * Loads Overlay settings 
     */
    loadOptions() {
        sync_get(["overlayStyle"], (result) => {
            this.overlayStyle = result.overlayStyle;

            this.update();
        });
    }

    /**
     * Adds options item to list
     * @param select Select
     */
    addItem(select) {
        this.elements.push(select);

        select.element.addEventListener("change", () => {
            this.overlayStyle[key] = select.element.value;

            this.save();
        });

        // Settings row element
        let element = document.createElement("div");
        element.classList.add("overlay-setting");

        // Row text element
        let text = document.createElement("span");
        text.textContent = `${i18n(select.key)}:`;
        element.appendChild(text);

        // Row select element
        element.appendChild(select.element);

        this.appendChild(element);
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