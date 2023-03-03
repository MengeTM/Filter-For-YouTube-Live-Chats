class SelectBox {
    constructor(values, texts, selected) {
        this.element = document.createElement("select");
        this.element.classList.add("select");
        this.element.autocomplete = true;
        this.element.required = "required";

        if (values !== undefined && texts !== undefined && values.length != texts.length) {
            throw Error(`SelctBox: Values.length=${values.length} and texts.length=${texts.length} should be the same`);
        }

        // Adds select options
        for (let i = 0; i < values.length; i++) {
            let optionElement = document.createElement("option");
            optionElement.classList.add("option");
            if (values !== undefined) {
                optionElement.id = values[i];
                optionElement.value = values[i];
            }

            if (texts !== undefined) {
                optionElement.textContent = texts[i];
            }
            this.element.appendChild(optionElement);
        }

        if (selected !== undefined) {
            this.element.value = selected;
        }
    }

    select(option) {
        this.element.value = option;
    }
}