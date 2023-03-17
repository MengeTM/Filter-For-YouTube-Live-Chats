class MenuItem {

    constructor(text, src) {
        this.menu = null;

        // Container element
        this.element = document.createElement("div");
        this.element.classList.add("sf-menu-item-element");

        // Menu item
        this.menuItem = document.createElement("div");
        this.menuItem.classList.add("sf-menu-item");
        this.menuItem.id = "sf-menu-item";
        this.menuItem.addEventListener("click", () => {
            this.menu.close();
        });
        this.menuItem.tabIndex = "0";
        this.element.appendChild(this.menuItem);

        // Menu item icon
        let imgElement = document.createElement("div");
        imgElement.classList.add("sf-svg");
        this.menuItem.appendChild(imgElement);
        parseXML(src, (svg) => {
            svg.classList.add("sf-svg");
            this.menuItem.replaceChild(svg, imgElement);
        });

        // Menu item text
        let txtElement = document.createElement("span");
        txtElement.classList.add("sf-text");
        txtElement.textContent = text;
        this.menuItem.appendChild(txtElement);
    }

    addEventListener(type, listener) {
        this.menuItem.addEventListener(type, (event) => {
            event.preventDefault();

            this.menuItem.focus();

            listener(event);
        }); 
    }
}

class Menu {
    constructor(app, index = true) {
        this.width = "0px";
        this.top = "0px";
        this.left = "0px";

        this.app = app;  // YouTube live-chat app
        this.menuItems = [];  // List of YouTube live-chat menu items
        this.index = index;  // Index adds menu items to YouTube live-chat settings, else to YouTube live-chat message settings

        // Live-chat settings element
        this.menu = this.app.querySelector("yt-live-chat-app > tp-yt-iron-dropdown");
        this.items = this.app.querySelector("yt-live-chat-app > tp-yt-iron-dropdown ytd-menu-popup-renderer > #items");

        this.appobserver.observe(this.app, { attributes: false, childList: true, subtree: false });

        // YouTube live chat menu added
        if (this.items !== null) {
            this.settingsobserver.observe(this.menu, { attributes: true, childList: false, subtree: false });
            this.appobserver.disconnect();
        }
    }

    /**
     * Adds a MenuItem
     * @param menuItem MenuItem
     */
    addMenuItem(menuItem) {
        menuItem.menu = this;
        this.menuItems.push(menuItem);
    }

    /**
     * Closes settings menu
     */
    close() {
        this.menu.style.display = "none";
    }

    /*
     * Observer of YouTube live chat menu
     */
    settingsobserver = new MutationObserver((itemList) => {
        for (let item of itemList) {
            // console.log(item);
            if (item.attributeName == "style" && !this.items.contains(this.menuItems[0].element)) {
                let node = item.target;

                this.top = parseInt(this.menu.style.top.replace("px", ""));
                this.left = parseInt(this.menu.style.left.replace("px", ""));
                this.width = this.menu.clientWidth;


                if (this.index && this.top < 45 || !this.index && this.top >= 45) {
                    // Adds menu items
                    for (let menuItem of this.menuItems) {
                        this.items.appendChild(menuItem.element);
                    }

                    let menu = this.menu.querySelector("ytd-menu-popup-renderer");
                    menu.style.maxHeight = this.items.offsetHeight + "px";
                }
            }
        }
    });

    /*
     * Observer of YouTube live chat app
     */
    appobserver = new MutationObserver((itemList) => {
        for (let item of itemList) {
            for (let node of item.addedNodes) {
                if (node.nodeName.toLowerCase() == "tp-yt-iron-dropdown") {
                    console.log("Settings added");

                    this.items = this.app.querySelector("yt-live-chat-app > tp-yt-iron-dropdown ytd-menu-popup-renderer > #items");
                    this.menu = this.app.querySelector("yt-live-chat-app > tp-yt-iron-dropdown");

                    // YouTube live chat menu added
                    this.settingsobserver.observe(node, { attributes: true, childList: false, subtree: false });
                    this.appobserver.disconnect();
                }
            }
        }
    });
}