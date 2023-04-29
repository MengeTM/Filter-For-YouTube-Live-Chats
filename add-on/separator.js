class Separator {
    size = 0; // Size of chat-box below separator [0..1]

    constructor(box_top, box_bottom) {
        // Chat-box above the separator
        this.box_top = box_top;
        // Chat-box below the separator
        this.box_bottom = box_bottom;

        // Scroll box
        this.box_top_scroll = this.box_top.querySelector("#item-scroller");
        this.box_bottom_scroll = this.box_bottom.querySelector("#item-scroller");

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
            this.updateSeparator(size);
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

    /**
     * Stops dragging separator
     * @param y Y-pixel when stop dragging separator
     */
    stopDragging(y) {
        // Stop dragging by removing mouseElement
        this.box_bottom.parentNode.removeChild(this.mouseElement);

        // Set new height of box_bottom and save height
        let size = this.getSize(y - this.startY);

        this.setSize(size);
        sync_set({ size: size });

        this.startY = null;
        this.startHeight = null;
    }

    /**
     * Sets Separator and bottom_box to be visible or hidden
     * @param visible Sets bottom_box and separator to be visible
     */
    setVisible(visible = true) {
        if (visible) {
            this.separatorElement.classList.remove("hidden");
            this.updateSeparator(this.size);
        } else {
            this.separatorElement.classList.add("hidden");
            this.updateSeparator(0);
        }
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
     * Sets size box_bottom
     * @param size Size box_bottom [0..100]
     */
    setSize(size) {
        this.size = size;

        this.updateSeparator(this.size);
    }

    /**
     * Updates height of box_top and box_bottom
     * @param size Size of box_bottom [0..100]
     */
    updateSeparator(size) {
        size = size / 100;

        let top_size = this.box_top.clientHeight;
        let bottom_size = this.box_bottom.clientHeight;

        this.box_top.style.flex = 1 - size;
        this.box_bottom.style.flex = size;

        this.box_top_scroll.scrollBy(0, Math.max(top_size - this.box_top.clientHeight, 0));
        this.box_bottom_scroll.scrollBy(0, Math.max(bottom_size - this.box_bottom.clientHeight, 0));
    }
}