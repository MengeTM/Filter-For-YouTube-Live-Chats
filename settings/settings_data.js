class JSONParser {
    constructor() {

    }

    /*
     * Parses JSON data of a Filter to HTML elements
     */
    parseJSON = function (json) {
        if (json.length !== undefined) {
            // List
            for (let filter of json) {
                filter.data = this.parseJSON(filter.data);
            }

            return json;
        } else {
            // Input object
            switch (json["type"]) {
                case "TextElement":
                    return new TextElement(json["string"], json["is_array"]);
                case "LogicalB":
                    return new LogicalBinary(json["name"], this.parseJSON(json["a"]), this.parseJSON(json["b"]));
                case "LogicalU":
                    return new LogicalUnary(json["name"], this.parseJSON(json["a"]));
                case "StringOption":
                    return new StringOption(json["name"]);
                case "StringRegex":
                    return new StringRegex(json["name"], this.parseJSON(json["key"]), this.parseJSON(json["regexp"]), this.parseJSON(json["bool"]));
                case "LogicalA":
                    return new LogicalArray(json["name"]);
                default:
                    throw Error(`Error while evaluating, type="${json["type"]}" is not available`);
            }
        }   
    }
}

/*
 * Input text element
 */
class TextElement {
    constructor(string, isArray = true) {
        // String of input
        this.string = string;

        // If string is a list of strings or a string
        this.isArray = isArray;

        // HTML input element
        this.element = document.createElement("input");
        this.element.type = "text";
        this.element.classList.add("input");

        // Sets value of HTML element
        if (isArray && string.push !== undefined) {
            this.element.value = string.join("; ");
        } else {
            this.element.value = string;
        }

        // Formats string
        this.element.addEventListener("change", () => {
            this.update();
        });
    }

    /*
     * Sets whether strings are formatted as lists or as strings
     */
    setArray(isArray) {
        this.isArray = isArray;

        this.update();
    }

    /*
     * Formats a string separated by ";" into an Array and deletes empty elements
     */
    split = function (string) {
        let stringList = string.trim().split(new RegExp("[ ]*;[ ]*"));

        stringList = stringList.filter(function (item) { return item.length > 0 });
        return stringList;
    }

    /*
     * Sets and formats the input string
     */
    update = function () {
        let string = this.element.value;

        if (this.isArray) {
            string = this.split(string);
            this.element.value = string.join("; ");
        }

        this.string = string;
    }

    /*
     * JSON data from text element
     */
    json = function () {
        return { type: "TextElement", string: this.split(this.element.value), is_array: this.isArray };
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
    json = function () {

    }

    /*
     * String
     */
    toString = function () {

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
    json = function () {
        return { type: "LogicalB", name: this.element.value, a: this.a.json(), b: this.b.json() };
    }

    /*
     * Evaluates if data matches
     */
    evaluate = function (data) {
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
    replace = function (data) {
        data = this.a.replace(data);
        data = this.b.replace(data);

        return data;
    }

    /*
     * String
     */
    toString = function () {
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
    json = function () {
        return { type: "LogicalU", name: this.element.value, a: this.a.json() };
    }

    /*
     * Evaluates if data matches
     */
    evaluate = function (data) {
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
    toString = function () {
        if (this.name != "none") {
            return `${this.name} ${this.a.toString()}`;
        } else {
            return this.a.toString();
        }
    }

    /*
     * Replaces data if data matches
     */
    replace = function (data) {
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
    json = function () {
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
    disable = function (disabled) {
        this.element.disabled = disabled;

        if (disabled) {
            this.element.value = "";
        } else {
            this.element.value = this.name;
        }
    }
    
    /*
     * JSON data from HTML element
     */
    json = function () {
        return { type: "LogicalA", name: this.name };
    }

    /*
     * Evaluates list with boolean function fun
     */
    evaluate = function (array, fun) {
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
    toString = function () {
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
     * JSON data from HTML element
     */
    json = function () {
        return { type: "StringRegex", name: this.element.value, key: this.key.json(), regexp: this.regexp.json(), bool: this.bool.json() };
    }

    /*
     * Evaluates if regexp.string matches data
     * String matching uses list of keys as input
     * RegExp matching uses string as input
     */
    evaluate = function (data) { 
        let string = data[this.key.name].toLocaleLowerCase();

        switch (this.name) { 
            case "startsWith":
                return this.bool.evaluate(this.regexp.string, (key) => { return string.startsWith(key.toLocaleLowerCase()); });
            case "endsWith":
                return this.bool.evaluate(this.regexp.string, (key) => { return string.endsWith(key.toLocaleLowerCase()); });
            case "includes":
                return this.bool.evaluate(this.regexp.string, (key) => { return string.includes(key.toLocaleLowerCase()); });
            case "is":
                return this.bool.evaluate(this.regexp.string, (key) => { return string == key.toLocaleLowerCase() });
            case "regexp":
                return string.match(new RegExp(this.regexp.string)) !== null;
        }
    }

    /*
     * Replaces data if data matches
     * String matching uses list of keys as input
     * RegExp matching uses string as input
     */
    replace = function (data) {
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
    setElements = function () {
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
    toString = function () {
        return `${this.key.name} ${this.name} ${this.bool.toString()} of ${this.regexp.string}`;
    }
}