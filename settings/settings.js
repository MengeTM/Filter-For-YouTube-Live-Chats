class Setting {
    constructor() {
        this.size = null;
        this.usernames = null;
        this.keywords = null;
    }

    /*
     * Loads settings
     */
    restoreOptions = function () {
        let getting = browser.storage.sync.get();
        getting.then((result) => {
            this.size = result.size || 30;
            this.keywords = result.keywords || ["[EN]"];
            this.usernames = result.usernames || [];

            this.update();
        }, (error) => {
            console.log(`Error: ${error}`);
        });
    }

    /*
     * Starts settings listener
     */
    start = function () {
        // Saves settings when input element are updated
        document.querySelector("#size").addEventListener("change", () => { return this.newValue("size") });
        document.querySelector("#usernames").addEventListener("change", () => { return this.newValue("usernames") });
        document.querySelector("#keywords").addEventListener("change", () => { return this.newValue("keywords") });

        // Saves settings when page is left
        document.addEventListener("unload", () => {
            this.newValue("size");
            this.newValue("usernames");
            this.newValue("keywords");
        });

        // Replaces placeholders of html with _locale strings
        document.querySelectorAll(".i18n").forEach(function (node) {
            if (node.hasAttribute("data-id")) {
                node.textContent = browser.i18n.getMessage(node.getAttribute("data-id"));
            } else {
                console.log("i18n Element: No \"data-id\" attribute");
            }
        });

        this.restoreOptions();
    }

    /*
     * Updates html input elements with settings
     */
    update = function () {
        document.querySelector("#size").value = this.size;

        document.querySelector("#usernames").value = this.usernames.join("; ");

        document.querySelector("#keywords").value = this.keywords.join("; ");
    }

    /*
     * Sets new setting value and updates html input elements
     */
    newValue = function (type) {

        // Formats a string separated by ";" into an Array and deletes empty elements
        function split(string) {
            stringList = string.trim().split(new RegExp("[ ]*;[ ]*"));

            stringList = stringList.filter(function (item) { return item.length > 0 });
            return stringList;
        }
        switch (type) {
            case "size":  // Heigth of highlight chat box
                this.size = document.querySelector("#size").value;
                this.size = Math.min(Math.max(this.size, 0), 100);
                this.setOption({ size: this.size });
                break;
            case "usernames":  // Filter usernames
                this.usernames = split(document.querySelector("#usernames").value);
                this.setOption({ usernames: this.usernames });
                break;
            case "keywords":  // Filter messages
                this.keywords = split(document.querySelector("#keywords").value);
                this.setOption({ keywords: this.keywords });
                break;
            default:
        }

        this.update();

        return false;
    }

    /*
     * Saves setting
     */
    setOption(option) {
        browser.storage.sync.set(option);
    }
}

let setting = new Setting();
setting.start();