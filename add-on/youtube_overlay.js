class YouTubeOverlay {
    duration = null;  // Duration in ms showing a new message
    style = null;  // JSON overlay style

    disabled = false;  // Disables overlay

    translatorTags = false;  // Displays not the [Language] translator tags



    // Styles color
    styleColor = {
        "white": [255, 255, 255],
        "yellow": [255, 255, 0],
        "green": [0, 255, 0],
        "cyan": [0, 255, 255],
        "blue": [0, 0, 255],
        "magenta": [255, 0, 255],
        "red": [255, 0, 0],
        "black": [8, 8, 8],
    };

    // Styles font family
    styleFontFamily = {
        "m_sans-serif": '"Deja Vu Sans Mono", "Lucida Console", Monaco, Consolas, "PT Mono", monospace',
        "p_sans-serif": '"YouTube Noto", Roboto, "Arial Unicode Ms", Arial, Helvetica, Verdana, "PT Sans Caption", sans-serif',
        "m_sans": '"Courier New", Courier, "Nimbus Mono L", "Cutive Mono", monospace',
        "p_sans": '"Times New Roman", Times, Georgia, Cambria, "PT Serif Caption", serif',
        "casual": '"Comic Sans MS", Impact, Handlee, fantasy',
        "cursive": '"Monotype Corsiva", "URW Chancery L", "Apple Chancery", "Dancing Script", cursive',
        "small_capitals": '"Arial Unicode Ms", Arial, Helvetica, Verdana, "Marcellus SC", sans-serif',
    };

    constructor() {
        this.player = document.querySelector(".html5-video-player");  // YouTube player box
        this.video = this.player.querySelector(".html5-video-container > video"); // YouTube video

        // Area for mouse events and dragging
        this.mousearea = document.createElement("div");
        this.mousearea.classList.add("sf-overlay-mouse");

        // Overlay for the YouTube player
        this.overlay = document.createElement("div");
        this.overlay.classList.add("sf-overlay");
        this.overlay.classList.add("sf-hidden");

        // Element for sliding text up or down
        this.textSlider = document.createElement("div");
        this.textSlider.classList.add("sf-overlay-text-slider");
        this.overlay.appendChild(this.textSlider);

        // Element for appending overlay text
        this.overlayText = document.createElement("div");
        this.overlayText.classList.add("sf-overlay-drag");
        this.overlayText.tabIndex = 0;
        this.textSlider.appendChild(this.overlayText);

        this.player.appendChild(this.overlay);

        this.loadOptions();

        // YouTube live-chat messages
        chrome.runtime.onMessage.addListener((message) => {
            switch (message.type) {
                case "overlay":
                    if (this.style !== undefined) {
                        let overlayMessage = this.parseOverlayMessage(message);
                        this.showMessage(overlayMessage, this.duration);
                    }
                    break;
                case "update_overlay":
                    this.loadOptions();
                    break;
            }
        });

        // Starts dragging the overlay element
        this.overlayText.addEventListener("mousedown", (event) => {
            this.overlayText.classList.add("sf-overlay-dragging");
            this.overlay.classList.add("sf-overlay-dragging");

            // Position overlay
            this.left = this.overlay.offsetLeft;
            this.bottom = this.player.clientHeight - this.overlay.offsetTop - this.overlay.offsetHeight;

            // Position mouse
            this.x = event.x;
            this.y = event.y;

            // Dragging listener
            this.player.appendChild(this.mousearea);
        });

        // Draggs the overlay
        this.mousearea.addEventListener("mousemove", (event) => {
            // Distance of mouse
            let dX = event.x - this.x;
            let dY = this.y - event.y;

            // New position overlay
            let left = this.left + dX;
            let bottom = this.bottom + dY;

            // Clamp position to player size
            left = Math.max(0, Math.min(this.player.clientWidth - this.overlay.clientWidth, left));
            bottom = Math.max(0, Math.min(this.player.clientHeight - this.overlay.clientHeight, bottom));

            // Move overlay element
            this.overlay.style.left = left / this.player.clientWidth * 100 + "%";
            this.overlay.style.bottom = bottom / this.player.clientHeight * 100 + "%";
        });

        // Stopps dragging the overlay element
        this.mousearea.addEventListener("mouseup", (event) => {
            this.player.removeChild(this.mousearea);
            this.overlayText.classList.remove("sf-overlay-dragging");
            this.overlay.classList.remove("sf-overlay-dragging");
        });

        // Stopps dragging the overlay element
        this.mousearea.addEventListener("mouseleave", (event) => {
            this.player.removeChild(this.mousearea);
            this.overlayText.classList.remove("sf-overlay-dragging");
            this.overlay.classList.remove("sf-overlay-dragging");
        });
    }

    /**
     * Loads options for YouTube overlay
     */
    loadOptions() {
        sync_get(["enableOverlay", "overlayStyle", "enableOverlayDuration", "overlayDuration"], (result) => {
            let enableOverlay = result.enableOverlay;
            let overlayStyle = result.overlayStyle;
            let enableOverlayDuration = result.enableOverlayDuration;
            let overlayDuration = result.overlayDuration;

            // Disable overlayDuration
            if (!enableOverlayDuration) {
                overlayDuration = null;
            } else {
                overlayDuration *= 1000;
            }

            // Sets overlay settings
            this.setStyle(overlayStyle);
            this.setDuration(overlayDuration);
            this.disable(!enableOverlay)
        });
    }

    /**
     * Updates text element
     */
    updateSize() {
        this.videoWidth = this.video.style.width.replace("px", "");
        this.videoHeight = this.video.style.height.replace("px", "");

        this.fontSize = this.style["fontSize"] * this.videoHeight * 0.05 + "px";
        this.width = this.videoWidth * 0.65 + "px";

        this.overlay.style.width = this.width;

        let element = this.overlayText.firstElementChild;
        if (element !== null) {
            element.style.fontSize = this.fontSize;
        }
    }

    /**
     * Sets overlay duration
     * @param duration Duration in ms
     */
    setDuration(duration) {
        this.duration = duration;
    }

    /**
     * Sets style of the overlay
     * @param style JSON object with HTML styles
     */
    setStyle(style) {
        this.style = style;

        switch (style["align"]) {
            case null:
            case "left":
                this.overlayText.style.textAlign = "left";
                break;
            case "center":
                this.overlayText.style.textAlign = "center";
                break
        }

        let element = this.overlayText.firstElementChild;

        this.updateSize();
        this.applyStyle(element);
    }

    /**
     * Applies style for overlay text and background
     * @param element HTMLElement for text
     */
    applyStyle(element) {
        if (element !== null && this.style !== null) {
            element.style.color = `rgba(${this.styleColor[this.style["fontColor"]].join(", ")}, ${this.style["fontOpacity"]})`;
            element.style.background = `rgba(${this.styleColor[this.style["backgroundColor"]].join(", ")}, ${this.style["backgroundOpacity"]})`;
            element.style.fontFamily = this.styleFontFamily[this.style["fontFamily"]];

            switch (this.style["align"]) {
                case null:
                case "left":
                    element.style.textAlign = "left";
                    break;
                case "center":
                    element.style.textAlign = "center";
                    break
            }

            for (let img of element.querySelectorAll("img")) {
                img.style.opacity = this.style["fontOpacity"];
            }
        }
    }

    /**
     * Parses a JSON YouTube live-chat message to a text element
     * @param message JSON with YouTube live-chat author, message, and rawMessage
     * @param align Alignment of message [null, "left" | "center"], null represents "left"
     */
    parseOverlayMessage(message) {
        let node = document.createElement("span");
        node.classList.add("sf-overlay-text");

        this.applyStyle(node);

        for (let obj of message.rawMessage) {
            let element;
            if (obj.src !== undefined) {
                // Img element
                element = document.createElement("img");
                // Better image resolution
                element.src = obj.src.replace(/=w\d+-h\d+/, "=w128-h128");
                element.style.opacity = this.style["fontOpacity"];

                element.draggable = true;
                element.addEventListener("dragstart", (event) => {
                    event.preventDefault();
                });
            } else {
                // Text element
                let string = obj.text;
                if (!this.translatorTags) {
                    string = string.replace(/\[(TL)?\/?([A-Za-z]{2}|.語)\]/g, "");
                }
                element = document.createTextNode(string);
            }

            node.appendChild(element);
        }

        node.style.fontSize = this.fontSize;

        return node;
    }

    /**
     * Shows a live-chat message over the YouTube player
     * @param element Message HTML element
     * @param duration Duration in ms message is shown, null shows the message until showing a new message
     */
    showMessage(element, duration = null) {
        if (!this.disabled) {
            // Replaces old element
            if (this.overlayText.firstElementChild !== null) {
                this.overlayText.replaceChild(element, this.overlayText.firstElementChild);
            } else {
                this.overlayText.appendChild(element);
            }

            // Deletes element when it is shown more than five seconds
            if (duration !== null) {
                setTimeout(() => {
                    if (this.overlayText.firstElementChild === element) {
                        this.overlay.classList.add("sf-hidden");

                        this.overlayText.removeChild(element);
                    }
                }, this.duration);
            }

            // Shows overlay
            this.overlay.classList.remove("sf-hidden");
        }
    }

    /**
     * Disables overlay and new messages
     * @param disable_overlay Disables overlay, else enables overlay
     */
    disable(disable_overlay=true) {
        this.disabled = disable_overlay;

        if (this.disabled) {
            this.overlay.classList.add("sf-hidden");
            this.playerobserver.disconnect();
            this.videoobserver.disconnect();
        } else {
            this.overlay.classList.remove("sf-hidden");
            this.playerobserver.observe(this.player, { attributes: true, childList: false, subtree: false });
            this.videoobserver.observe(this.video, { attributes: true, childList: false, substree: false });
        }
    }

    /**
     * Observes YouTube video and resizes font size
     */
    videoobserver = new MutationObserver((items) => {
        for (let item of items) {
            if (item.attributeName == "style") {
                this.updateSize();
            }
        }
    });

    /**
     * Observes YouTube player and toggles the overlay margin when the YouTube controls are shown
     */
    playerobserver = new MutationObserver((items) => {
        for (let item of items) {
            if (item.attributeName == "class") {

                if (item.target.classList.contains("ytp-autohide")) {
                    this.textSlider.classList.remove("sf-overlay-autohide");
                } else {
                    this.textSlider.classList.add("sf-overlay-autohide");
                }
            } else if (item.attributeName == "height") {
                this.fontSize = this.player.clientHeight / 0.0025;
            }
        }
    });
}