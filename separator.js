class Separator {

    constructor(box_top, box_bottom) {
        // Chat-box above the separator
        this.box_top = box_top;
        // Chat-box below the separator
        this.box_bottom = box_bottom;

        // Separator
        this.separatorElement = document.createElement("div");
        this.separatorElement.id = "separator";
        this.separatorElement.classList.add("style-scope");
        this.separatorElement.classList.add("yt-live-chat-renderer");
        this.separatorElement.classList.add("youtube-stream-slide");

        // Overlay for catching mouse events from all chat-boxes
        this.mouseElement = document.createElement("div");
        this.mouseElement.id = "mouse-element";
        this.mouseElement.classList.add("mouse-element");

        // Start variables when starting drag of separator
        this.startY = null;  // Y-position
        this.startHeight = null; // box_bottom height
        this.startSize = null;  //  box_bottom

        // Add event listeners

        this.separatorElement.addEventListener("mousedown", (event) => {
            event.preventDefault();

            // Start drag if not dragging
            if (this.startY === null) {
                // Set start variables
                this.startY = event.clientY;
                this.startHeight = this.box_bottom.offsetHeight;
                this.startSize = this.box_bottom.offsetHeight / (this.box_top.offsetHeight + this.box_bottom.offsetHeight);

                // Append mouseElement for getting mousemove and mouseup events
                this.box_bottom.parentNode.appendChild(this.mouseElement);
            }
        });

        this.mouseElement.addEventListener("mousemove", (event) => {
            event.preventDefault();

            // New mouse position
            let posY = event.clientY;

            // Set new height of box_bottom
            let size = this.getSize(posY - this.startY);
            this.updateSize(size);
        });

        this.mouseElement.addEventListener("mouseup", (event) => {
            event.preventDefault();

            // Stop dragging by removing mouseElement
            this.box_bottom.parentNode.removeChild(this.mouseElement);

            // Set new height of box_bottom and save height
            this.startSize = this.getSize(event.clientY - this.startY);
            this.updateSize(this.startSize);
            browser.storage.sync.set({ size: this.startSize });

            // Enabling new drag events by setting variables to null
            this.startY = null;
            this.startSize = null;
        });
    }

    /*
     * Gets flex size of box_bottom when moving mouse dY pixel
     */
    getSize = function (dY) {
        let size = this.startSize * (this.startHeight - dY) / this.startHeight * 100;

        size = Math.round(size);
        size = Math.min(Math.max(size, 0), 100);
        return size;
    }

    /*
     * Updates height of box_top and box_bottom
     */
    updateSize = function (size) {
        size = size / 100;

        this.box_top.style.flex = 1 - size;
        this.box_bottom.style.flex = size;
    }
}