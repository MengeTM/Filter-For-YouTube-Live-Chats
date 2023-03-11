class Setting {
    constructor() {
        // Settings

        // Highlight chat-box
        this.size = null;  // Size of highlight chat-box
        this.enableHighlight = null;  // Enables highlight chat-box

        // Overlay
        this.enableOverlay = null;  // Enables caption overlay
        this.overlayAlign = null;  // Sets text align of ovelay
        this.enableOverlayDuration = null;  // Enables overlay duration
        this.overlayDuration = null;  // Duration of showing overlay messages

        // Enables expert select options for selection
        this.expertMode = null;

        // List of JSON filter data
        this.filters = null;

        // Manages filter data and filter elements
        this.filterList = new FilterList(document.querySelector("#filters"));

        // Settings window for player overlay
        this.overlaySettings = new OverlaySettings();

        // Settings page title
        document.title = i18n("titleSettingsPage");
    }

    /**
     * Loads settings
     */
    restoreOptions() {

        sync_get(["size", "enableHighlight", "expertMode", "filters", "enableOverlay", "enableOverlayDuration", "overlayDuration"], (result) => {
            this.size = result.size;
            this.enableHighlight = result.enableHighlight;
            this.enableOverlay = result.enableOverlay;
            this.enableOverlayDuration = result.enableOverlayDuration;
            this.overlayDuration = result.overlayDuration;
            this.expertMode = result.expertMode;
            this.filters = result.filters;

            // Filter elements from JSON data, adds filter elements to filter manager
            for (let filter of this.filters) {
                this.filterList.addFilter(new Filter(filter));
            }

            this.update();
        });
    }

    /**
     * Sends message for updating settings
     */
    updateOverlay() {
        chrome.runtime.sendMessage({ type: "update_overlay" });
    }

    /**
     * Starts settings listener
     */
    start() {
        // Saves highlight chat-box size settings
        document.querySelector("#size").addEventListener("change", () => {
            this.size = document.querySelector("#size").value;
            this.size = Math.min(Math.max(this.size, 0), 100);
            sync_set({ size: this.size });
        });

        // Saves enable highlight chat-box settings
        document.querySelector("#enable_highlight").addEventListener("change", () => {
            this.enableHighlight = document.querySelector("#enable_highlight").checked;
            sync_set({ enableHighlight: this.enableHighlight });
        });

        document.querySelector("#enable_overlay").addEventListener("change", () => {
            this.enableOverlay = document.querySelector("#enable_overlay").checked;
            sync_set({ enableOverlay: this.enableOverlay });
            this.updateOverlay();
        });

        document.querySelector("#enable_overlay_duration").addEventListener("change", () => {
            this.enableOverlayDuration = document.querySelector("#enable_overlay_duration").checked;
            document.querySelector("#overlay_duration").disabled = !this.enableOverlayDuration;
            sync_set({ enableOverlayDuration: this.enableOverlayDuration });
            this.updateOverlay();
        });

        document.querySelector("#overlay_duration").addEventListener("change", () => {
            this.overlayDuration = document.querySelector("#overlay_duration").value;
            this.overlayDuration = Math.max(0.5, this.overlayDuration);
            sync_set({ overlayDuration: this.overlayDuration });
            this.updateOverlay();
            this.update();
        });

        // Adds and saves new filter rule
        document.querySelector("#btn_add_filter").addEventListener("click", () => {
            let filter = new Filter(document.querySelector("#select_new_filter").value);
            this.filterList.addFilter(filter);

            return false;
        });

        // Shows overlay settings
        document.querySelector("#btn_overlay_settings").addEventListener("click", () => {
            this.overlaySettings.show();
        });

        // Toggles and saves expert mode
        document.querySelector("#enable_expert_mode").addEventListener("change", () => {
            this.expertMode = document.querySelector("#enable_expert_mode").checked;
            sync_set({ expertMode: this.expertMode });

            if (this.filterList !== null) {
                // Toggles expert select options to be selectable
                this.filterList.setExpertMode(this.expertMode);
            }
        });

        // Saves settings when page is left
        document.addEventListener("unload", () => {
            this.newValue("size");
            this.filterList.save();
        });

        // Replaces placeholders of html with _locale strings
        i18n_replace(document);

        this.restoreOptions();
    }

    /**
     * Updates html input elements with settings
     */
    update() {
        document.querySelector("#size").value = this.size;
        document.querySelector("#enable_highlight").checked = this.enableHighlight;
        document.querySelector("#enable_overlay").checked = this.enableOverlay;
        document.querySelector("#enable_overlay_duration").checked = this.enableOverlayDuration;
        document.querySelector("#overlay_duration").value = this.overlayDuration;
        document.querySelector("#overlay_duration").disabled = !this.enableOverlayDuration;
        document.querySelector("#enable_expert_mode").checked = this.expertMode;
        this.filterList.setExpertMode(this.expertMode);
    }
}

let setting = new Setting();
setting.start();