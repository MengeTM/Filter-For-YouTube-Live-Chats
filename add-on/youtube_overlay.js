class YouTubeOverlay {
    duration = null;  // Duration in ms showing a new message
    align = null;  // Alignment of message

    disabled = false;  // Disables overlay

    translatorTags = false;  // Displays not the [Language] translator tags

    constructor(duration = null, align = null) {
        this.duration = duration;
        this.align = align;

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

        this.update();

        this.disable(false);

        // YouTube live-chat messages
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type == "overlay") {
                let overlayMessage = this.parseOverlayMessage(message, this.align);
                this.showMessage(overlayMessage, this.duration);
            }
        });

        // Starts dragging the overlay element
        this.overlayText.addEventListener("mousedown", (event) => {
            this.overlayText.classList.add("sf-overlay-dragging");

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
            this.overlay.style.left = left / this.playerWidth * 100 + "%";
            this.overlay.style.bottom = bottom / this.playerHeight * 100 + "%";
        });

        // Stopps dragging the overlay element
        this.mousearea.addEventListener("mouseup", (event) => {
            this.player.removeChild(this.mousearea);
            this.overlayText.classList.remove("sf-overlay-dragging");
        });

        // Stopps dragging the overlay element
        this.mousearea.addEventListener("mouseleave", (event) => {
            this.player.removeChild(this.mousearea);
            this.overlayText.classList.remove("sf-overlay-dragging");
        });
    }

    /**
     * Updates text element
     */
    update() {
        this.playerWidth = this.video.style.width.replace("px", "");
        this.playerHeight = this.video.style.height.replace("px", "");

        this.fontSize = this.playerHeight * 0.05 + "px";
        this.width = this.playerWidth * 0.65 + "px";

        this.overlay.style.width = this.width;

        let element = this.overlayText.firstElementChild;
        if (element !== null) {
            element.style.fontSize = this.fontSize;

            for (let img of element.querySelectorAll("img")) {
                img.style.height = this.fontSize;
            }
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
     * Sets overlay align
     * @param align Overlay align [null | "left" | "center"]
     */
    setAlign(align) {
        this.align = align;

        switch (align) {
            case null:
            case "left":
                this.overlayText.style.textAlign = "left";
                break;
            case "center":
                this.overlayText.style.textAlign = "center";
                break
        }
    }

    /**
     * Parses a JSON YouTube live-chat message to a text element
     * @param message JSON with YouTube live-chat author, message, and rawMessage
     * @param align Alignment of message [null, "left" | "center"], null represents "left"
     */
    parseOverlayMessage(message, align="left") {
        let node = document.createElement("span");
        node.classList.add("sf-overlay-text");

        for (let obj of message.rawMessage) {
            let text;
            if (obj.src !== undefined) {
                // Img element
                text = document.createElement("img");
                text.src = obj.src;
                text.style.height = this.fontSize;

                text.draggable = true;
                text.addEventListener("dragstart", (event) => {
                    event.preventDefault();
                });
            } else {
                // Text element
                let string = obj.text;
                if (!this.translatorTags) {
                    string = string.replace(/\[(TL)?\/?([A-Za-z]{2}|.語)\]/g, "");
                }
                text = document.createTextNode(string);
            }

            node.appendChild(text);
        }
        switch (align) {
            case null:
            case "left":
                node.classList.add("sf-overlay-left");
                break;
            case "center":
                node.classList.add("sf-overlay-center");
                break;
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
                this.update();
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