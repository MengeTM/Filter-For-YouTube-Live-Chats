function YouTubeStreamHighlight() {
    this.size = null;
    this.usernames = null;
    this.keywords = null;

    let that = this;

    this.separator = null;

    this.box = null;
    this.boxItems = null;

    this.itemBox = null;
    this.itemScroller = null;
    this.items = null;

    let includesAny = function (string, keywords) {
        let any = false;
        for (let keyword of keywords) {
            any = any || string.includes(keyword);
        }

        return any;
    }

    this.chatobserver = new MutationObserver(function (itemList) {
        for (let item of itemList) {
            for (let node of item.addedNodes) {
                let authorName = node.querySelector("#author-name");

                let message = node.querySelector("#content>#message");

                let stringMessage = "";
                let string;
                for (let node of message.childNodes) {
                    if (node instanceof HTMLImageElement) {
                        string = node.alt;
                    } else {
                        string = node.textContent;
                    }

                    stringMessage += string;
                }

                if (that.items !== null && that.itemScroller !== null && (includesAny(authorName, that.usernames) || includesAny(stringMessage, that.keywords))) {
                    console.log(stringMessage);
                    if (that.items.childNodes.length > 100) {
                        that.items.removeChild(that.items.firstChild);
                    }

                    let scrollTopMax = that.itemScroller.scrollTopMax;
                    that.items.appendChild(node);

                    if (that.itemScroller.scrollTop > scrollTopMax - 15) {
                        that.itemScroller.scrollTo(0, that.itemScroller.scrollTopMax);
                    }
                }
            }
        }
    });

    this.loadOptions = function () {

        function setCurrentChoice(result) {
            that.size = result.size || 30;
            that.usernames = result.usernames || [];
            that.keywords = result.keywords || ["[EN]"];

            that.makeBox();
        }

        function onError(error) {
            console.log(`Error: ${error}`);
        }

        var getting = browser.storage.sync.get();
        getting.then(setCurrentChoice, onError);
    }

    this.start = function () {
        if (document.getElementById("player") === null) {
            that.loadOptions();

            that.box = document.querySelector("#chat>#item-list>#live-chat-item-list-panel");
            let contents = that.box.querySelector("#contents");
            that.boxItems = contents.querySelector("#item-scroller>#item-offset>#items");

            that.chatobserver.observe(that.boxItems, { attributes: false, childList: true, subtree: false });
        }
    }

    this.updateSize = function (size) {
        if (size === undefined) {
            size = that.size;
        }

        if (that.separator !== null) {
            that.separator.updateSize(size);
        }
    }

    this.makeBox = function () {
        let addRenderer = function (node) {
            node.classList.add("style-scope")
            node.classList.add("yt-live-chat-item-list-renderer");
        }

        let renderer = document.createElement("div");
        renderer.id = "live-chat-item-list-panel";
        renderer.classList.add("style-scope")
        renderer.classList.add("yt-live-chat-renderer");
        renderer.setAttribute("allow-scroll", "");

        let contents = document.createElement("div");
        contents.id = "contents";
        addRenderer(contents);
        renderer.appendChild(contents);

        let itemScroller = document.createElement("div");
        itemScroller.id = "item-scroller";
        itemScroller.classList.add("animated");
        contents.appendChild(itemScroller);

        let items = document.createElement("div");
        items.id = "items";
        addRenderer(items);
        itemScroller.appendChild(items);
        itemScroller.addEventListener("scroll", function () {
            if (itemScroller.scrollTop > itemScroller.scrollTopMax - 15) {
                itemScroller.scrollTo(0, itemScroller.scrollTopMax);
            }
        });

        that.separator = new Separator(that.box, renderer);
        let separator = that.separator.element;

        let box = that.box.querySelector("#contents");
        box.parentNode.parentNode.appendChild(separator);
        box.parentNode.parentNode.appendChild(renderer);

        that.itemBox = renderer;
        that.itemScroller = itemScroller;
        that.items = items;

        that.updateSize();
    }

}

let youtubeStreamHighlight = new YouTubeStreamHighlight();
youtubeStreamHighlight.start();