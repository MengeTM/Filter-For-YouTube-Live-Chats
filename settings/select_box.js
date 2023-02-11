class SelectBox {
    constructor(option, options) {
        this.element = document.createElement("select");
        this.element.classList.add("select");
        this.element.autocomplete = true;
        this.element.required = "required";

        // Adds select options
        options.forEach((option) => {
            let optionElement = document.createElement("option");
            optionElement.classList.add("option");
            optionElement.id = option["value"];
            optionElement.value = option["value"];
            optionElement.textContent = option["text"];
            this.element.appendChild(optionElement);
        });

        this.element.value = option;
    }

    setOption = function (option) {
        this.element.value = option;
    }
}