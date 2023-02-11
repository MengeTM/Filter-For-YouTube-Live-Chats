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
        this.separatorElement.classList.add("sf-separator");

        // Overlay for catching mouse events from all chat-boxes
        this.mouseElement = document.createElement("div");
        this.mouseElement.id = "mouse-element";
        this.mouseElement.classList.add("sf-separator-mouse");

        // Start variables when starting drag of separator
        this.startY = null;  // Y-position
        this.height = null;  // height both chat-boxes
        this.startHeight = null;  // height box_bottom

        /*
         * Starts dragging separator
         */
        this.startDragging = function (y) {
            // Start drag if not dragging
            if (this.startY === null) {
                // Set start variables
                this.startY = y;
                this.height = this.box_top.offsetHeight + this.box_bottom.offsetHeight;
                this.startHeight = this.box_bottom.offsetHeight;

                // Append mouseElement for getting mousemove and mouseup events
                this.box_bottom.parentNode.appendChild(this.mouseElement);
            }
        }

        /*
         * Stops dragging separator
         */
        this.stopDragging = function (y) {
            // Stop dragging by removing mouseElement
            this.box_bottom.parentNode.removeChild(this.mouseElement);

            // Set new height of box_bottom and save height
            let size = this.getSize(y - this.startY);
            this.updateSize(size);
            browser.storage.sync.set({ size: size });

            // Enabling new drag events by setting variables to null
            this.startY = null;
            this.startHeight = null;
        }

        // Add event listeners

        this.separatorElement.addEventListener("mousedown", (event) => {
            event.preventDefault();

            this.startDragging(event.clientY);
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

            this.stopDragging(event.clientY);
        });

        this.mouseElement.addEventListener("mouseleave", (event) => {
            event.preventDefault();

            this.stopDragging(event.clientY);
        });
    }

    /*
     * Gets flex size of box_bottom when moving mouse dY pixel
     */
    getSize = function (dY) {
        let size = (this.startHeight - dY) / this.height * 100;

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