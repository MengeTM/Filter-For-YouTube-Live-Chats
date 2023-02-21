class MenuItem {

    constructor(text, src) {
        // Container element
        this.element = document.createElement("div");
        this.element.classList.add("sf-menu-item");
        this.element.id = "sf-menu-item";

        // Menu item icon
        let imgElement = document.createElement("img");
        imgElement.src = src;
        this.element.appendChild(imgElement);

        // Menu item text
        let txtElement = document.createElement("span");
        txtElement.textContent = text;
        this.element.appendChild(txtElement);
    }
}