class ToggleSwitch {
    /* From https://www.w3schools.com/howto/howto_css_switch.asp */
    constructor(checked) {
        this.element = document.createElement("label");
        this.element.classList.add("switch");

        this.checkbox = document.createElement("input");
        this.checkbox.type = "checkbox";
        this.checkbox.checked = checked;
        this.element.appendChild(this.checkbox);

        let slider = document.createElement("span");
        slider.classList.add("slider");
        slider.classList.add("round");
        this.element.appendChild(slider);

        // Stops dragging when entering text
        this.element.draggable = true;
        this.element.addEventListener("dragstart", (event) => {
            event.stopPropagation();
            event.preventDefault();
        });
    }

    toggle = function () {
        this.checkbox.checked = !this.checkbox.checked;
    }
}