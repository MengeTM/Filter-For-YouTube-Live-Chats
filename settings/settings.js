function Setting() {
    this.size = null;
    this.usernames = null;
    this.keywords = null;

    const that = this;

    this.restoreOptions = function () {

        function setCurrentChoice(result) {
            that.size = result.size || 30;
            that.keywords = result.keywords || ["[EN]"];
            that.usernames = result.usernames || [];

            that.update();
        }

        function onError(error) {
            console.log(`Error: ${error}`);
        }

        var getting = browser.storage.sync.get();
        getting.then(setCurrentChoice, onError);
    }

    this.start = function () {
        document.addEventListener("DOMContentLoaded", that.restoreOptions);
        document.querySelector("#size").addEventListener("change", function () { return that.newValue("size") });
        document.querySelector("#usernames").addEventListener("change", function () { return that.newValue("usernames") });
        document.querySelector("#keywords").addEventListener("change", function () { return that.newValue("keywords") });

        document.addEventListener("unload", function () {
            that.newValue("size");
            that.newValue("usernames");
            that.newValue("keywords");
        });

        document.querySelectorAll(".i18n").forEach(function (node) {
            if (node.hasAttribute("data-id")) {
                node.textContent = browser.i18n.getMessage(node.getAttribute("data-id"));
            } else {
                console.log("i18n Element: No \"data-id\" attribute");
            }
        });
    }

    this.update = function () {
        document.querySelector("#size").value = that.size;

        document.querySelector("#usernames").value = that.usernames.join("; ");

        document.querySelector("#keywords").value = that.keywords.join("; ");
    }

    this.newValue = function (type) {

        function split(string) {
            stringList = string.trim().split(new RegExp("[ ]*;[ ]*"));

            stringList = stringList.filter(function (item) { return item.length > 0 });
            return stringList;
        }
        switch (type) {
            case "size":
                that.size = document.querySelector("#size").value;
                that.size = Math.min(Math.max(that.size, 0), 100);
                setOption({ size: that.size });
                break;
            case "usernames":
                that.usernames = split(document.querySelector("#usernames").value);
                setOption({ usernames: that.usernames });
                break;
            case "keywords":
                that.keywords = split(document.querySelector("#keywords").value);
                setOption({ keywords: that.keywords });
                break;
            default:
        }

        that.update();

        return false;
    }

    function setOption(option) {
        browser.storage.sync.set(option);
    }
}

var setting = new Setting();
setting.start();