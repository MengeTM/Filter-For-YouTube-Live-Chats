/*
* Parses JSON data of a Filter to HTML elements
*/
function parseJSON(json) {
    try {
        if (json.length !== undefined) {
            // List
            for (let filter of json) {
                filter.data = parseJSON(filter.data);
            }

            return json;
        } else {
            // Input object
            switch (json["type"]) {
                case "TextElement":
                    return new TextElement(json["strings"], json["format_array"]);
                case "LogicalB":
                    return new LogicalBinary(json["name"], parseJSON(json["a"]), parseJSON(json["b"]));
                case "LogicalU":
                    return new LogicalUnary(json["name"], parseJSON(json["a"]));
                case "StringOption":
                    return new StringOption(json["name"]);
                case "StringRegex":
                    return new StringRegex(json["name"], parseJSON(json["key"]), parseJSON(json["regexp"]), parseJSON(json["bool"]));
                case "LogicalA":
                    return new LogicalArray(json["name"]);
                default:
                    throw Error(`Error while evaluating, type="${json["type"]}" is not available`);
            }
        }
    } catch (e) {
        console.log(`Error while parsing JSON:\n\t${e}`);
        return null;
    }
}

/*
 * Input text element
 */
class TextElement {
    constructor(strings, formatArray = true) {
        if (strings.push === undefined) {
            strings = [strings];
        }

        // String of input
        this.strings = strings;

        // If string is a list of strings or a string
        this.formatArray = formatArray;

        // HTML input element
        this.element = document.createElement("input");
        this.element.type = "text";
        this.element.classList.add("input");

        this.element.value = this.strings.join("; ");

        // Formats string
        this.element.addEventListener("change", () => {
            this.updateStrings();
        });
        this.element.addEventListener("input", () => {
            if (!this.formatArray) {
                this.updateStrings();
            }
        });
    }

    /*
     * Sets text
     */
    set(textElement) {
        this.strings = textElement.strings;
        this.element.value = this.strings.join("; ");
    } 

    /*
     * Sets whether strings are formatted as lists or as strings
     */
    setArray(formatArray) {
        this.formatArray = formatArray;

        this.updateStrings();
    }

    /*
     * Formats a string separated by ";" into an Array and deletes empty elements
     */
    split(string) {
        let stringList = string.trim().split(new RegExp("[ ]*;[ ]*"));

        stringList = stringList.filter(function (item) { return item.length > 0 });
        return stringList;
    }

    /*
     * Sets and formats the input string
     */
    updateStrings() {
        let value = this.element.value;

        if (this.formatArray) {
            this.strings = this.split(value);
            this.element.value = this.strings.join("; ");
        } else {
            this.strings = [value];
        }
    }

    /*
     * JSON data from text element
     */
    json() {
        return { type: "TextElement", strings: this.strings, format_array: this.formatArray };
    }
}

/*
 * Base HTML select, sets option elements
 */
class BaseSelect extends SelectBox {
    constructor(name, options, textList) {
        // List of value, text for generating options
        let selectOptions = [];
        for (let i = 0; i < options.length; i++) {
            selectOptions.push({ value: options[i], text: textList === undefined ? options[i] : textList[i] });
        }

        super(name, selectOptions);

        // HTML select element
        this.element.classList.add("input");
        this.element.addEventListener("change", () => {
            this.name = this.element.value;
        });

        if (!name in options) {
            throw Error(`Name="${name}" should be of ${options}"`);
        }

        this.options = options;
        this.name = name;
    }

    /*
     * JSON data from HTML element
     */
    json() {

    }

    /*
     * Sets value of the element
     */
    set(baseSelect) {
        if (typeof baseSelect != typeof this) {
            throw Error(`Error while setting filter data:\n\tthis="${typeof this}" is not the same as value="${baseSelect}"`);
        }

        this.name = baseSelect.name;
        this.element.value = baseSelect.element.value;
    }

    /*
     * String
     */
    toString() {

    }
}

/*
 * Logical Binary Operator
 */
class LogicalBinary extends BaseSelect {
    constructor(name, a, b) {
        super(name, ["and", "or"], i18n(["and", "or"]));

        this.a = a;
        this.b = b;

        this.element.title = "If author AND message should match, or if message OR author should match";
    }

    /*
     * JSON data from HTML element
     */
    json() {
        return { type: "LogicalB", name: this.element.value, a: this.a.json(), b: this.b.json() };
    }

    /*
     * Sets value
     */
    set(element) {
        super.set(element);

        this.a.set(element.a);
        this.b.set(element.b);
    }

    /*
     * Evaluates if data matches
     */
    evaluate(data) {
        switch (this.name) {
            case "and":
                return this.a.evaluate(data) && this.a.evaluate(data);
            case "or":
                return this.b.evaluate(data) || this.b.evaluate(data);
        }
    }

    /*
     * Replaces data if data matches
     */
    replace(data) {
        data = this.a.replace(data);
        data = this.b.replace(data);

        return data;
    }

    /*
     * String
     */
    toString() {
        return `${a.toString()} ${this.name} ${b.toString()}`;
    }
}

/*
 * Logical Unary Oparator
 */
class LogicalUnary extends BaseSelect {
    constructor(name, a) { 
        super(name, ["not", "none"], [i18n("not"), ""]);

        this.a = a;
    }

    /*
     * JSON data from HTML element
     */
    json() {
        return { type: "LogicalU", name: this.element.value, a: this.a.json() };
    }

    /*
     * Sets value
     */
    set(element) {
        super.set(element);

        this.a.set(element.a);
    }

    /*
     * Evaluates if data matches
     */
    evaluate(data) {
        switch (this.name) { 
            case "not":
                return !this.a.evaluate(data);
            case "none":
                return this.a.evaluate(data);
        }
    }

    /*
     * String
     */
    toString() {
        if (this.name != "none") {
            return `${this.name} ${this.a.toString()}`;
        } else {
            return this.a.toString();
        }
    }

    /*
     * Replaces data if data matches
     */
    replace(data) {
        return this.a.replace(data);
    }
}

/*
 * Select matching data
 */
class StringOption extends BaseSelect {
    constructor(name) {
        super(name, ["author", "message"], i18n(["author", "message"]));

        this.element.title = i18n("titleSelectAuthor");
    }

    /*
     * JSON data from HTML element
     */
    json() {
        return { type: "StringOption", name: this.element.value };
    }
}

/*
 * Logical Binary Operator for boolean list
 */
class LogicalArray extends BaseSelect {
    constructor(name) {
        super(name, ["some", "every", "none"], i18n(["some", "every", "none"]));
        this.name = name;

        this.element.title = i18n("titleSelectArray");

        this.element.addEventListener("change", () => { this.name = this.element.value; });

        // Expert mode
        this.element.namedItem("every").classList.add("expert");
        this.element.namedItem("none").classList.add("expert");
    }

    /*
     * Disables HTML select element and sets ""
     */
    disable(disabled) {
        this.element.disabled = disabled;

        if (disabled) {
            this.element.value = "";
        } else {
            this.element.value = this.name;
        }
    }

    set(element) {
        super.set(element);

        this.element.disabled = element.element.disabled;
    }
    
    /*
     * JSON data from HTML element
     */
    json() {
        return { type: "LogicalA", name: this.name };
    }

    /*
     * Evaluates list with boolean function fun
     */
    evaluate(array, fun) {
        switch (this.name) {
            case "some":
                return array.some((i) => { return fun(i); });
            case "every":
                return array.every((i) => { return fun(i); });
            case "none":
                return !array.some((i) => { return fun(i); });
        }
    }

    /*
     * String
     */
    toString() {
        return `${this.name}`
    }
}

/*
 * Matches data with strings or list of strings
 */
class StringRegex extends BaseSelect {
    constructor(name, key, regexp, bool) {
        super(name, ["startsWith", "endsWith", "includes", "is", "regexp"], i18n(["startsWith", "endsWith", "includes", "is", "regexp"]));

        // String used for replacing matches
        this.replace_str = "";

        // StringOption
        this.key = key;
        // TextElement
        this.regexp = regexp;
        // LogicalArray
        this.bool = bool;

        this.element.title = i18n("titleSelectAlgo");
        this.setElements();

        // Expert mode
        this.element.namedItem("regexp").classList.add("expert");

        this.element.addEventListener("change", () => {
            this.setElements();
        });
    }

    /*
     * Sets value
     */
    set(element) {
        super.set(element);

        this.key.set(element.key);
        this.regexp.set(element.regexp);
        this.bool.set(element.bool)
    }

    /*
     * JSON data from HTML element
     */
    json() {
        return { type: "StringRegex", name: this.element.value, key: this.key.json(), regexp: this.regexp.json(), bool: this.bool.json() };
    }

    /*
     * Evaluates if regexp.string matches data
     * String matching uses list of keys as input
     * RegExp matching uses string as input
     */
    evaluate(data) { 
        let string = data[this.key.name];

        switch (this.name) { 
            case "startsWith":
                return this.bool.evaluate(this.regexp.strings, (key) => { return string.toLocaleLowerCase().startsWith(key.toLocaleLowerCase()); });
            case "endsWith":
                return this.bool.evaluate(this.regexp.strings, (key) => { return string.toLocaleLowerCase().endsWith(key.toLocaleLowerCase()); });
            case "includes":
                return this.bool.evaluate(this.regexp.strings, (key) => { return string.toLocaleLowerCase().includes(key.toLocaleLowerCase()); });
            case "is":
                return this.bool.evaluate(this.regexp.strings, (key) => { return string.toLocaleLowerCase() == key.toLocaleLowerCase() });
            case "regexp":
                return string.match(new RegExp(this.regexp.strings[0])) !== null;
        }
    }

    /*
     * Replaces data if data matches
     * String matching uses list of keys as input
     * RegExp matching uses string as input
     */
    replace(data) {
        let string = data[this.name.key];

        switch (this.name) {
            case "startsWith":
                this.regexp.string.forEach((key) => { string = string.replaceAll(new RegExp(`^${key}`), this.replace_str); });
                break;
            case "endsWith":
                this.regexp.string.forEach((key) => { string = string.replaceAll(new RegExp(`${key}$`), this.replace_str); });
                break;
            case "includes":
                this.regexp.string.forEach((key) => { string = string.replaceAll(new RegExp(`${key}`), this.replace_str); });
                break;
            case "is":
                this.regexp.string.forEach((key) => { string = string.replaceAll(new RegExp(`^${key}$`), this.replace_str); });
                break;
            case "regexp":
                string = string.replaceAll(new RegExp(this.regexp.string), this.replace_str);
                break;
        }

        data[this.name.key] = string;

        return data;
    }

    /*
     * Sets LogicalArray as disabled when RegExp is selected
     */
    setElements() {
        this.regexp.setArray(this.element.value != "regexp");

        if (this.element.value == "regexp") {
            this.regexp.element.placeholder = i18n("placeholderRegexp");
            this.regexp.element.title = i18n("titleTextSearchRegex");
            this.bool.disable(true);
        } else {
            this.regexp.element.placeholder = i18n("placeholderStringArray");
            this.regexp.element.title = i18n("titleTextSearchStrings");
            this.bool.disable(false);
        }
    }

    /*
     * String
     */
    toString() {
        return `${this.key.name} ${this.name} ${this.bool.toString()} of ${this.regexp.string}`;
    }
}