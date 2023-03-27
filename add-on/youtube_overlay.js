﻿class YouTubeOverlay {
    duration = null;  // Duration in ms showing a new message
    style = null;  // JSON overlay style

    pos = null;  // Overlay position

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
        this.video = document.querySelector(".html5-video-container > video"); // YouTube video

        console.log(this.player);

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

        if (this.player === null) {
            let app = document.querySelector("ytd-app > #content #page-manager");
            this.youtubeobserver.observe(app, { attributes: false, childList: true, subtree: false });
        } else {
            this.loaded();
        }

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
            this.startDragging(event.x, event.y);
        });

        // Draggs the overlay
        this.mousearea.addEventListener("mousemove", (event) => {
            this.drag(event.x, event.y);
        });

        // Stopps dragging the overlay element
        this.mousearea.addEventListener("mouseup", (event) => {
            this.stopDragging(event.x, event.y);
        });

        // Stopps dragging the overlay element
        this.mousearea.addEventListener("mouseleave", (event) => {
            this.stopDragging(event.x, event.y);
        });
    }

    /**
     * Starts dragging overlay
     * @param x Mouse position x
     * @param y Mouse position y
     */
    startDragging(x, y) {
        // Position mouse
        this.x = x;
        this.y = y;

        // Position overlay
        this.posX = this.overlay.offsetLeft;
        this.posY = this.player.clientHeight - this.overlay.offsetTop - this.overlay.offsetHeight;

        this.overlayText.classList.add("sf-overlay-dragging");
        this.overlay.classList.add("sf-overlay-dragging");

        // Dragging listener
        this.player.appendChild(this.mousearea);
    }

    /**
     * Drags overlay
     * @param x Mouse postion x
     * @param y Mouse position y
     */
    drag(x, y) {
        // Distance of mouse
        let dX = x - this.x;
        let dY = this.y - y;

        // New position overlay
        let posX = this.posX + dX;
        let posY = this.posY + dY;

        // Move overlay element
        this.setOverlayPosition(posX / this.player.clientWidth, posY / this.player.clientHeight);
    }

    /**
     * Stops dragging overlay
     */
    stopDragging(x, y) {
        // Distance of mouse
        let dX = x - this.x;
        let dY = this.y - y;

        this.posX = this.posX + dX;
        this.posY = this.posY + dY;

        this.pos = this.setOverlayPosition(this.posX / this.player.clientWidth, this.posY / this.player.clientHeight);

        sync_set({ overlayPos: this.pos });

        this.player.removeChild(this.mousearea);
        this.overlayText.classList.remove("sf-overlay-dragging");
        this.overlay.classList.remove("sf-overlay-dragging");
    }

    /**
     * Video loaded
     */
    loaded() {
        this.player.appendChild(this.overlay);

        this.video.addEventListener("seeking", () => {
            this.overlay.classList.add("sf-hidden");

            // Sends message to background page if YouTube video seeking
            chrome.runtime.sendMessage({ type: "replay" });
        });

        this.loadOptions();
    }

    /**
     * Loads options for YouTube overlay
     */
    loadOptions() {
        sync_get(["enableOverlay", "overlayStyle", "enableOverlayDuration", "overlayDuration", "overlayPos"], (result) => {
            let enableOverlay = result.enableOverlay;
            let overlayStyle = result.overlayStyle;
            let enableOverlayDuration = result.enableOverlayDuration;
            let overlayDuration = result.overlayDuration;
            this.pos = result.overlayPos;

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
     * Sets position of overlay element
     * @param left Left player padding
     * @param bottom Bottom player padding
     */
    setOverlayPosition(left, bottom) {
        let top;
        let right;

        if (left === undefined || bottom === undefined) {
            left = this.pos.left;
            bottom = this.pos.bottom;
            top = this.pos.top;
            right = this.pos.right;
        } else {
            top = 1 - bottom - this.overlay.clientHeight / this.player.clientHeight;
            right = 1 - left - this.overlay.clientWidth / this.player.clientWidth;
        }

        // Clamp pixel position
        left = Math.max(Math.min(1 - this.overlay.clientWidth / this.player.clientWidth, left), 0);
        right = Math.max(Math.max(1 - this.overlay.clientWidth / this.player.clientWidth, right), 0);
        bottom = Math.max(Math.min(1 - this.overlay.clientHeight / this.player.clientHeight, bottom), 0);
        top = Math.max(Math.min(1 - this.overlay.clientHeight / this.player.clientHeight, top), 0);

        // Relative position
        left = left * 100;
        right = right * 100;
        bottom = bottom * 100;
        top = top * 100;

        // Set position
        this.overlay.style.left = `${left}%`;
        if (bottom < 50) {
            this.overlay.style.bottom = `${bottom}%`;
            this.overlay.style.top = "";
        } else {
            this.overlay.style.bottom = "";
            this.overlay.style.top = `${top}%`;
        }

        return {
            top: top / 100,
            bottom: bottom / 100,
            left: left / 100,
            right: right / 100
        };
    }

    /**
     * Updates text element
     */
    updateSize() {
        this.videoWidth = this.video.style.width.replace("px", "");
        this.videoHeight = this.video.style.height.replace("px", "");

        // Resize fontSize and overlay width
        this.fontSize = this.style["fontSize"] * this.videoHeight * 0.05 + "px";
        this.width = this.videoWidth * 0.65 + "px";

        this.overlay.style.width = this.width;

        let element = this.overlayText.firstElementChild;
        if (element !== null) {
            element.style.fontSize = this.fontSize;
        }

        this.setOverlayPosition();
    }

    /**
     * Sets overlay duration
     * @param duration Duration in ms
     */
    setDuration(duration) {
        this.duration = duration;

        let element = this.overlayText.firstElementChild;

        if (element !== null) {
            setTimeout(() => {
                if (this.overlayText.firstElementChild === element) {
                    this.overlay.classList.add("sf-hidden");

                    this.overlayText.removeChild(element);
                }
            });
        }
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
     * Observes YouTube for added video element
     */
    youtubeobserver = new MutationObserver((items) => {
        for (let item of items) {
            for (let node of item.addedNodes) {
                if (node.nodeName.toLowerCase() == "ytd-watch-flexy") {
                    let player = node.querySelector("ytd-player > #container");

                    this.youtubeobserver.disconnect();
                    this.youtubeobserver.observe(player, { attributes: false, childList: true, subtree: false });
                } else if (node.classList.contains("html5-video-player")) {
                    this.player = document.querySelector(".html5-video-player");
                    this.video = document.querySelector(".html5-video-container > video");

                    this.loaded();

                    this.youtubeobserver.disconnect();
                }
            }
        }
    });

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
            }
        }
    });
}