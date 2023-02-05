function Separator(box_top, box_bottom) {
    this.element = document.createElement("div");
    this.box_top = box_top;
    this.box_bottom = box_bottom;

    this.element.id = "separator";

    this.element.classList.add("style-scope");
    this.element.classList.add("yt-live-chat-renderer");
    this.element.classList.add("youtube-stream-slide");

    this.mouseElement = document.createElement("div");
    this.mouseElement.id = "mouse-element";
    this.mouseElement.classList.add("mouse-element");

    this.startY = null;

    this.startHeight = null;
    this.startSize = null;


    let that = this;

    this.getSize = function (dY) {
        size = that.startSize * (that.startHeight - dY) / that.startHeight * 100;

        size = Math.round(size);
        size = Math.min(Math.max(size, 0), 100);
        return size;
    }

    this.updateSize = function (size) {
        size = size / 100;

        that.box_top.style.flex = 1 - size;
        that.box_bottom.style.flex = size;
    }

    function mousedownListener (event) {
        event.preventDefault();

        if (that.startY === null) {
            that.startY = event.clientY;
            that.startHeight = box_bottom.offsetHeight;
            that.startSize = box_bottom.offsetHeight / (box_top.offsetHeight + box_bottom.offsetHeight);

            that.box_bottom.parentNode.parentNode.appendChild(that.mouseElement);
        }
    }

    function mousemoveListener (event) {
        event.preventDefault();

        let posY = event.clientY;

        let size = that.getSize(posY - that.startY);
        that.updateSize(size);
    }

    function mouseupListener (event) {
        event.preventDefault();

        that.box_bottom.parentNode.parentNode.removeChild(that.mouseElement);

        that.startSize = that.getSize(event.clientY - that.startY);
        that.updateSize(that.startSize);
        browser.storage.sync.set({ size: that.startSize });

        that.startY = null;
        that.startSize = null;
    }

    this.element.addEventListener("mousedown", mousedownListener);
    this.mouseElement.addEventListener("mousemove", mousemoveListener);
    this.mouseElement.addEventListener("mouseup", mouseupListener);
}