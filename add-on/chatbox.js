class ChatBox {
    constructor() {
        // Function for adding YouTube live-chat class names
        let addRenderer = function (node) {
            node.classList.add("style-scope")
            node.classList.add("yt-live-chat-item-list-renderer");
        }

        // YouTube live-chat items
        this.youtubeItems = document.querySelector("yt-live-chat-renderer #chat-messages > #contents #chat yt-live-chat-item-list-renderer #item-scroller #items");

        // Renderer for chat messages
        let renderer = document.createElement("div");
        renderer.id = "live-chat-item-list-panel";
        renderer.classList.add("style-scope")
        renderer.classList.add("yt-live-chat-renderer");
        renderer.classList.add("sf-highlight-chat-box");
        renderer.setAttribute("allow-scroll", "");
        this.renderer = renderer;

        // Contents of chat messages
        let contents = document.createElement("div");
        contents.id = "contents";
        addRenderer(contents);
        renderer.appendChild(contents);
        this.contents = contents;

        // Scroller for chat-messages
        let itemScroller = document.createElement("div");
        itemScroller.id = "item-scroller";
        itemScroller.classList.add("animated");
        itemScroller.addEventListener("scroll", () => {
            // Force that scrolls down to bottom of chat-box, if user does not scroll strong enough
            // When at this area, chat - box will scroll automatically to bottom when new chat messages are added
            if (this.itemScroller.scrollTop > this._scrollTopMax() - 15) {
                this.itemScroller.scrollTo(0, this._scrollTopMax());
            }
        });
        contents.appendChild(itemScroller);
        this.itemScroller = itemScroller;

        // Items, where children are chat-messages from YouTube live-chat
        let items = document.createElement("div");
        items.id = "items";
        addRenderer(items);
        itemScroller.appendChild(items);
        this.items = items;
    }

    /**
     * Deletes all messages
     */
    clear() {
        while (this.items.firstElementChild !== null) {
            this.deleteMessage(this.items.firstElementChild);
        }
    }

    /**
     * Maximum scrollTop, similar to Firefox scrollTopMax
     */
    _scrollTopMax() {
        return this.itemScroller.scrollHeight - this.itemScroller.clientHeight;
    }

    /**
     * Deletes YouTube live-chat message by adding it to YouTube live-chat items
     * @param {HTMLElement} message YouTube live-chat message
     */
    deleteMessage(message) {
        message.hidden = true;
        message.deleted = true;

        try {
            this.youtubeItems.replaceChild(message, message.div);
        } catch (e) {
            this.items.removeChild(message);
        }
    }

    /**
    * Adds YouTube live-chat message element to chat box
    * @param {HTMLElement} message YouTube live-chat message
    */
    addMessage(message) {
        // Removes oldest highlighted message if 100 messages
        if (this.items.childNodes.length > 100) {
            this.deleteMessage(this.items.firstElementChild);
        }

        let scrollTopMax = this._scrollTopMax();
        this.items.appendChild(message);

        // When at the bottom area, scrolls down chat box to newest message
        if (this.itemScroller.scrollTop > scrollTopMax - 15) {
            this.itemScroller.scrollTo(0, this._scrollTopMax());
        }
    }
}