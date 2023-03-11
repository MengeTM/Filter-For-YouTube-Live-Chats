class Separator {

    constructor(box_top, box_bottom) {
        // Chat-box above the separator
        this.box_top = box_top;
        // Chat-box below the separator
        this.box_bottom = box_bottom;

        // Separator
        this.separatorElement = document.createElement("div");
        this.separatorElement.id = "separator";
        this.separatorElement.classList.add("sf-separator");

        // Overlay for catching mouse events from all chat-boxes
        this.mouseElement = document.createElement("div");
        this.mouseElement.id = "mouse-element";
        this.mouseElement.classList.add("sf-separator-mouse");

        // Start variables when starting drag of separator
        this.startY = null;  // Y-position
        this.height = null;  // height both chat-boxes
        this.startHeight = null;  // height box_bottom

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

    /**
     * Starts dragging separator
     * @param y Y-pixel when start dragging separator
     */
    startDragging(y) {
        // Set start variables
        this.startY = y;
        this.height = this.box_top.offsetHeight + this.box_bottom.offsetHeight;
        this.startHeight = this.box_bottom.offsetHeight;

        // Append mouseElement for getting mousemove and mouseup events
        this.box_bottom.parentNode.appendChild(this.mouseElement);
    }

    /*
     * Stops dragging separator
     * @param y Y-pixel when stop dragging separator
     */
    stopDragging(y) {
        // Stop dragging by removing mouseElement
        this.box_bottom.parentNode.removeChild(this.mouseElement);

        // Set new height of box_bottom and save height
        let size = this.getSize(y - this.startY);
        this.updateSize(size);
        sync_set({ size: size });

        this.startY = null;
        this.startHeight = null;
    }

    /**
     * Gets flex size of box_bottom when moving mouse dY pixel
     * @param dY Y-pixel distance separator
     */
    getSize(dY) {
        let size = (this.startHeight - dY) / this.height * 100;

        size = Math.round(size);
        size = Math.min(Math.max(size, 0), 100);
        return size;
    }

    /**
     * Updates height of box_top and box_bottom
     * @param size Size of box_bottom [0..1]
     */
    updateSize(size) {
        size = size / 100;

        this.box_top.style.flex = 1 - size;
        this.box_bottom.style.flex = size;
    }
}