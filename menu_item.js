class MenuItem {

    constructor(text, src) {
        this.element = document.createElement("div");
        this.element.classList.add("sf-menu-item");
        this.element.id = "sf-menu-item";

        let imgElement = document.createElement("img");
        imgElement.src = src;
        this.element.appendChild(imgElement);

        let txtElement = document.createElement("span");
        txtElement.textContent = text;
        this.element.appendChild(txtElement);
    }
}